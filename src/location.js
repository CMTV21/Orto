/* Address -> garden location lookup.
   Geocodes with Open-Meteo's free geocoding API, then derives an
   approximate USDA hardiness zone and average frost dates from ~10 years
   of historical daily lows via Open-Meteo's archive API. Both are public,
   keyless, CORS-enabled endpoints meant for direct client-side use, so
   this all runs from the browser with no backend involved. */

const GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search";
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

export async function geocodeAddress(query) {
  const url = `${GEOCODE_URL}?name=${encodeURIComponent(query)}&count=1&language=en&format=json`;
  let res;
  try {
    res = await fetch(url);
  } catch {
    throw new Error("Couldn't reach the location lookup service — check your connection and try again.");
  }
  if (!res.ok) throw new Error("Location lookup failed — try again in a moment.");
  const data = await res.json();
  const hit = data.results?.[0];
  if (!hit) throw new Error(`Couldn't find "${query}" — try a nearby city name instead.`);
  const label = [hit.name, hit.admin1, hit.country].filter(Boolean).join(", ");
  return { label, lat: hit.latitude, lon: hit.longitude };
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
