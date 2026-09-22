/* Address -> garden location lookup.
   Geocodes with OpenStreetMap's free Nominatim search — unlike a places-only
   geocoder, it understands full street addresses as well as city names — then
   derives an approximate USDA hardiness zone and average frost dates from
   ~10 years of historical daily lows via Open-Meteo's archive API. Both are
   public, keyless endpoints usable directly from the browser, so this all
   runs client-side with no backend involved. Nominatim's usage policy asks
   for attribution wherever a lookup it returned is shown — see the "OSM"
   credit next to the location picker in App.jsx. */

const GEOCODE_URL = "https://nominatim.openstreetmap.org/search";
const ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive";
const HISTORY_YEARS = 10;
const FROST_F = 32;
const MIDYEAR_CUTOFF_DOY = 196; // ~Jul 15 — splits a year's frosts into "spring" and "fall"

// USDA hardiness zones, by average annual extreme minimum temperature (°F).
// zoneFromMinTemp finds the highest threshold at or below the given value.
const ZONE_THRESHOLDS = [-65, -60, -55, -50, -45, -40, -35, -30, -25, -20, -15, -10, -5, 0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75];
const ZONE_LABELS = ["0a", "0b", "1a", "1b", "2a", "2b", "3a", "3b", "4a", "4b", "5a", "5b", "6a", "6b", "7a", "7b", "8a", "8b", "9a", "9b", "10a", "10b", "11a", "11b", "12a", "12b", "13a", "13b"];

export function zoneFromMinTemp(fahrenheit) {
  let zone = ZONE_LABELS[0];
  for (let i = 0; i < ZONE_LABELS.length; i++) {
    if (fahrenheit >= ZONE_THRESHOLDS[i]) zone = ZONE_LABELS[i];
  }
  return zone;
}

function dayOfYearUTC(y, m, d) {
  return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(y, 0, 1)) / 86400000) + 1;
}

// Turns an averaged (possibly fractional) day-of-year back into "MM-DD",
// using a fixed non-leap reference year so the mapping is stable.
function doyToMonthDay(doy) {
  const d = new Date(Date.UTC(2001, 0, 1));
  d.setUTCDate(d.getUTCDate() + Math.round(doy) - 1);
  return `${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

const mean = (arr) => arr.reduce((n, v) => n + v, 0) / arr.length;

export function computeFrostAndZone(dates, mins) {
  const byYear = new Map();
  for (let i = 0; i < dates.length; i++) {
    const v = mins[i];
    if (v == null) continue;
    const [y, m, d] = dates[i].split("-").map(Number);
    const doy = dayOfYearUTC(y, m, d);
    if (!byYear.has(y)) byYear.set(y, { min: Infinity, spring: null, fall: null });
    const rec = byYear.get(y);
    rec.min = Math.min(rec.min, v);
    if (v <= FROST_F) {
      if (doy <= MIDYEAR_CUTOFF_DOY) rec.spring = rec.spring == null ? doy : Math.max(rec.spring, doy);
      else rec.fall = rec.fall == null ? doy : Math.min(rec.fall, doy);
    }
  }

  const years = [...byYear.values()];
  if (!years.length) throw new Error("No usable climate history for that location.");

  const springDoys = years.map((y) => y.spring).filter((v) => v != null);
  const fallDoys = years.map((y) => y.fall).filter((v) => v != null);
  const annualMins = years.map((y) => y.min).filter((v) => Number.isFinite(v));

  // A location that never dropped to freezing in that window is effectively
  // frost-free there — treat spring as "already past" and fall as "not yet".
  const avgLastFrost = springDoys.length ? doyToMonthDay(mean(springDoys)) : "01-01";
  const avgFirstFrost = fallDoys.length ? doyToMonthDay(mean(fallDoys)) : "12-31";
  const zone = annualMins.length ? zoneFromMinTemp(mean(annualMins)) : null;

  return { avgLastFrost, avgFirstFrost, zone };
}

/* A full street address geocodes to a precise point, but showing that exact
   address as the plan's subtitle would put someone's home address on screen
   any time they share it — so the label is always built at city level,
   independent of how precise the typed query was. Falls back through
   looser address fields for a rural query that has no city proper. */
function cityLevelLabel(addr, fallback) {
  const place = addr.city || addr.town || addr.village || addr.hamlet || addr.municipality || addr.county;
  const region = addr.state || addr.region || addr.province;
  const label = [place, region, addr.country].filter(Boolean).join(", ");
  return label || fallback;
}

/* If the full query comes back empty (a typo'd house number, an
   over-specific address), retry with the string before the first comma —
   Nominatim's own parser otherwise already handles "city, region" and
   "city region" forms, and full street addresses, natively. */
function queryCandidates(raw) {
  const q = raw.trim();
  const candidates = [q];
  if (q.includes(",")) candidates.push(q.split(",")[0].trim());
  return [...new Set(candidates.filter(Boolean))];
}

export async function geocodeAddress(query) {
  let hits = [];
  for (const candidate of queryCandidates(query)) {
    const url = `${GEOCODE_URL}?q=${encodeURIComponent(candidate)}&format=jsonv2&addressdetails=1&limit=5`;
    let res;
    try {
      res = await fetch(url);
    } catch {
      throw new Error("Couldn't reach the location lookup service — check your connection and try again.");
    }
    if (!res.ok) continue;
    const data = await res.json();
    if (data.length) { hits = data; break; }
  }
  if (!hits.length) throw new Error(`Couldn't find "${query}" — try a nearby city name or a fuller address instead.`);

  const hit = hits[0];
  const addr = hit.address || {};
  const label = cityLevelLabel(addr, hit.display_name.split(",").slice(0, 3).join(", "));
  return { label, lat: Number(hit.lat), lon: Number(hit.lon) };
}

export async function fetchFrostAndZone(lat, lon) {
  const endYear = new Date().getFullYear() - 1;
  const startYear = endYear - (HISTORY_YEARS - 1);
  const url = `${ARCHIVE_URL}?latitude=${lat}&longitude=${lon}&start_date=${startYear}-01-01&end_date=${endYear}-12-31&daily=temperature_2m_min&temperature_unit=fahrenheit&timezone=UTC`;
  let res;
  try {
    res = await fetch(url);
  } catch {
    throw new Error("Couldn't reach the climate history service — check your connection and try again.");
  }
  if (!res.ok) throw new Error("Couldn't fetch climate history for that location.");
  const data = await res.json();
  const dates = data.daily?.time ?? [];
  const mins = data.daily?.temperature_2m_min ?? [];
  if (!dates.length) throw new Error("No climate history available for that location.");
  return computeFrostAndZone(dates, mins);
}

export async function lookupLocation(query) {
  const place = await geocodeAddress(query);
  const climate = await fetchFrostAndZone(place.lat, place.lon);
  return { ...place, ...climate };
}
