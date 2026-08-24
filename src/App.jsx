import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";

/* ============================================================
   ORTO — a kitchen garden planner
   Zone 6b (Hamilton, Ontario) defaults
   ============================================================ */

const STORAGE_KEY = "orto-garden-v1";

const FAMILY = {
  nightshade: { label: "Nightshades", color: "#D04235", note: "Solanaceae" },
  brassica: { label: "Brassicas", color: "#268446", note: "Cabbage family" },
  legume: { label: "Legumes", color: "#528031", note: "Nitrogen fixers" },
  allium: { label: "Alliums", color: "#8B62B4", note: "Onion family" },
  cucurbit: { label: "Cucurbits", color: "#AE6013", note: "Squash family" },
  umbellifer: { label: "Umbellifers", color: "#C25120", note: "Carrot family" },
  chenopod: { label: "Chenopods", color: "#C84370", note: "Beet & chard" },
  aster: { label: "Asters", color: "#8B720B", note: "Lettuce family" },
  herb: { label: "Herbs", color: "#2B8170", note: "Mixed families" },
  grass: { label: "Grasses", color: "#827349", note: "Corn" },
  perennial: { label: "Perennials", color: "#44799F", note: "Stays put" },
  flower: { label: "Flowers", color: "#C639A2", note: "Cutting & pollinator" },
  other: { label: "Custom", color: "#757568", note: "User-added" },
};

/* weeks are relative to last spring frost — negative = before */
const CROPS = [
  // ---- Nightshades ----
  { id: "tomato", name: "Tomato", fam: "nightshade", perSqFt: 0.5, spacing: "1 per 2 sq ft", dtm: 75, sowDepth: 0.25, sun: "Full sun, 6–8 hrs", water: "1–1.5 in/week, steady — irregular watering splits the fruit", indoors: -6, transplant: 1, tender: "tender", harvestSpan: 60,
    comp: ["basil", "carrot", "marigold", "lettuce", "parsley", "chive", "borage", "asparagus"],
    anti: ["potato", "fennel", "cabbage", "broccoli", "corn", "dill"] },
  { id: "pepper", name: "Pepper", fam: "nightshade", perSqFt: 1, spacing: "12 in", dtm: 70, sowDepth: 0.25, sun: "Full sun, 6–8 hrs", water: "1 in/week; let the top inch dry between waterings", indoors: -8, transplant: 2, tender: "tender", harvestSpan: 55,
    comp: ["basil", "onion", "carrot", "tomato", "oregano"], anti: ["fennel", "kohlrabi"] },
  { id: "eggplant", name: "Eggplant", fam: "nightshade", perSqFt: 1, spacing: "12 in", dtm: 75, sowDepth: 0.25, sun: "Full sun, 6–8 hrs", water: "1–1.5 in/week, consistent", indoors: -8, transplant: 2, tender: "tender", harvestSpan: 45,
    comp: ["bushbean", "pepper", "marigold", "thyme"], anti: ["fennel"] },
  { id: "tomatillo", name: "Tomatillo", fam: "nightshade", perSqFt: 0.5, spacing: "1 per 2 sq ft", dtm: 75, sowDepth: 0.25, sun: "Full sun, 6–8 hrs", water: "1 in/week", indoors: -6, transplant: 1, tender: "tender", harvestSpan: 45,
    comp: ["basil", "marigold", "nasturtium"], anti: ["fennel"] },
  { id: "potato", name: "Potato", fam: "nightshade", perSqFt: 1, spacing: "12 in", dtm: 90, sowDepth: 4, sun: "Full sun, 6+ hrs", water: "1–2 in/week, more once tubers set", direct: -2, tender: "half-hardy", harvestSpan: 21,
    comp: ["bushbean", "corn", "cabbage", "marigold"], anti: ["tomato", "cucumber", "wintersquash", "sunflower", "fennel"] },

  // ---- Brassicas ----
  { id: "broccoli", name: "Broccoli", fam: "brassica", perSqFt: 1, spacing: "12 in", dtm: 65, sowDepth: 0.5, sun: "Full sun, 6+ hrs", water: "1–1.5 in/week, steady", indoors: -6, transplant: -2, tender: "hardy", harvestSpan: 28, succession: 21,
    comp: ["onion", "beet", "celery", "dill", "potato"], anti: ["tomato", "strawberry", "polebean"] },
  { id: "cauliflower", name: "Cauliflower", fam: "brassica", perSqFt: 1, spacing: "12 in", dtm: 70, sowDepth: 0.5, sun: "Full sun, 6+ hrs", water: "1–1.5 in/week — never let it dry, or heads button", indoors: -6, transplant: -2, tender: "half-hardy", harvestSpan: 21,
    comp: ["onion", "beet", "celery", "dill"], anti: ["tomato", "strawberry", "polebean"] },
  { id: "cabbage", name: "Cabbage", fam: "brassica", perSqFt: 1, spacing: "12 in", dtm: 70, sowDepth: 0.5, sun: "Full sun, 6+ hrs", water: "1–1.5 in/week", indoors: -6, transplant: -3, tender: "hardy", harvestSpan: 28,
    comp: ["onion", "beet", "celery", "dill", "potato", "thyme"], anti: ["tomato", "strawberry", "polebean"] },
  { id: "brussels", name: "Brussels sprouts", fam: "brassica", perSqFt: 1, spacing: "18 in", dtm: 100, sowDepth: 0.5, sun: "Full sun, 6+ hrs", water: "1–1.5 in/week", indoors: -6, transplant: -2, tender: "hardy", harvestSpan: 95,
    comp: ["onion", "beet", "dill", "thyme"], anti: ["tomato", "strawberry", "polebean"] },
  { id: "kale", name: "Kale", fam: "brassica", perSqFt: 1, spacing: "12 in", dtm: 55, sowDepth: 0.5, sun: "Full sun to part shade, 4+ hrs", water: "1 in/week", indoors: -6, transplant: -3, tender: "hardy", harvestSpan: 150, succession: 28,
    comp: ["onion", "beet", "dill", "potato"], anti: ["tomato", "strawberry", "polebean"] },
  { id: "kohlrabi", heatSensitive: true, name: "Kohlrabi", fam: "brassica", perSqFt: 4, spacing: "6 in", dtm: 55, sowDepth: 0.5, sun: "Full sun to part shade", water: "1 in/week, steady — irregular watering splits bulbs", direct: -3, tender: "hardy", harvestSpan: 21, succession: 14,
    comp: ["onion", "beet", "cucumber"], anti: ["tomato", "polebean", "pepper", "strawberry"] },
  { id: "radish", heatSensitive: true, name: "Radish", fam: "brassica", perSqFt: 16, spacing: "3 in", dtm: 28, sowDepth: 0.5, sun: "Full sun to part shade, 4+ hrs", water: "1 in/week, evenly moist", direct: -4, tender: "hardy", harvestSpan: 14, succession: 10,
    comp: ["carrot", "lettuce", "cucumber", "pea", "spinach", "nasturtium"], anti: [] },
  { id: "arugula", heatSensitive: true, name: "Arugula", fam: "brassica", perSqFt: 9, spacing: "4 in", dtm: 35, sowDepth: 0.25, sun: "Full sun to part shade", water: "1 in/week", direct: -4, tender: "hardy", harvestSpan: 21, succession: 14,
    comp: ["lettuce", "carrot", "bushbean", "onion"], anti: [] },
  { id: "turnip", name: "Turnip", fam: "brassica", perSqFt: 9, spacing: "4 in", dtm: 50, sowDepth: 0.5, sun: "Full sun to part shade", water: "1 in/week", direct: -3, tender: "hardy", harvestSpan: 21, succession: 14,
    comp: ["pea", "onion", "radish"], anti: ["potato"] },
  { id: "mustard", heatSensitive: true, name: "Mustard greens", fam: "brassica", perSqFt: 9, spacing: "4 in", dtm: 40, sowDepth: 0.25, sun: "Full sun to part shade", water: "1 in/week", direct: -4, tender: "hardy", harvestSpan: 21, succession: 14,
    comp: ["lettuce", "radish"], anti: ["beet"] },

  // ---- Legumes ----
  { id: "bushbean", name: "Bush bean", fam: "legume", perSqFt: 9, spacing: "4 in", dtm: 55, sowDepth: 1, sun: "Full sun, 6+ hrs", water: "1 in/week; avoid wetting foliage once flowering", direct: 1, tender: "tender", harvestSpan: 21, succession: 14,
    comp: ["carrot", "cucumber", "corn", "potato", "strawberry", "celery", "marigold"], anti: ["onion", "garlic", "leek", "scallion", "fennel"] },
  { id: "polebean", name: "Pole bean", fam: "legume", perSqFt: 4, spacing: "6 in on trellis", dtm: 65, sowDepth: 1, sun: "Full sun, 6+ hrs", water: "1 in/week", direct: 1, tender: "tender", harvestSpan: 45,
    comp: ["corn", "carrot", "cucumber", "radish"], anti: ["onion", "garlic", "leek", "beet", "sunflower", "broccoli", "cabbage"] },
  { id: "pea", heatSensitive: true, name: "Pea (snap/snow)", fam: "legume", perSqFt: 8, spacing: "4 in on trellis", dtm: 60, sowDepth: 1, sun: "Full sun, tolerates part shade", water: "1 in/week, cool and steady", direct: -6, tender: "hardy", harvestSpan: 21, succession: 14,
    comp: ["carrot", "radish", "cucumber", "corn", "turnip", "spinach"], anti: ["onion", "garlic", "leek"] },

  // ---- Alliums ----
  { id: "onion", name: "Onion (sets)", fam: "allium", perSqFt: 9, spacing: "4 in", dtm: 115, sowDepth: 1, sun: "Full sun, 6+ hrs", water: "1 in/week, taper off before harvest", direct: -2, tender: "hardy", harvestSpan: 21,
    comp: ["carrot", "beet", "cabbage", "broccoli", "tomato", "lettuce", "strawberry"], anti: ["bushbean", "polebean", "pea", "asparagus", "sage"] },
  { id: "garlic", name: "Garlic", fam: "allium", perSqFt: 4, spacing: "6 in", dtm: 240, sowDepth: 2, sun: "Full sun", water: "Moderate; taper off 2–3 weeks before harvest", fallPlanted: true, tender: "hardy", harvestSpan: 14,
    comp: ["tomato", "carrot", "beet", "cabbage", "strawberry"], anti: ["bushbean", "polebean", "pea"] },
  { id: "leek", name: "Leek", fam: "allium", perSqFt: 9, spacing: "4 in", dtm: 100, sowDepth: 0.25, sun: "Full sun", water: "1–1.5 in/week", indoors: -10, transplant: -2, tender: "hardy", harvestSpan: 45,
    comp: ["carrot", "celery", "onion"], anti: ["bushbean", "pea"] },
  { id: "scallion", name: "Green onion", fam: "allium", perSqFt: 16, spacing: "3 in", dtm: 60, sowDepth: 0.25, sun: "Full sun to part shade", water: "1 in/week", direct: -4, tender: "hardy", harvestSpan: 30, succession: 21,
    comp: ["carrot", "beet", "lettuce", "tomato"], anti: ["bushbean", "pea"] },
  { id: "chive", name: "Chives", fam: "allium", perSqFt: 4, spacing: "6 in", dtm: 80, sowDepth: 0.25, sun: "Full sun to part shade", water: "1 in/week", perennialPlant: true, direct: -3, tender: "hardy", harvestWindow: [[4, 1], [9, 15]],
    comp: ["tomato", "carrot"], anti: ["bushbean", "pea"] },

  // ---- Cucurbits ----
  { id: "cucumber", name: "Cucumber (bush)", fam: "cucurbit", perSqFt: 2, spacing: "2 per sq ft on trellis", dtm: 55, sowDepth: 1, sun: "Full sun, 6+ hrs", water: "1–2 in/week, consistent — irregular watering turns fruit bitter", direct: 1, tender: "tender", harvestSpan: 45, succession: 21,
    comp: ["bushbean", "pea", "radish", "corn", "sunflower", "dill", "nasturtium"], anti: ["potato", "sage", "rosemary"] },
  { id: "zucchini", name: "Zucchini", fam: "cucurbit", perSqFt: 0.5, spacing: "1 per 2 sq ft", dtm: 50, sowDepth: 1, sun: "Full sun", water: "1–2 in/week", direct: 1, tender: "tender", harvestSpan: 60, succession: 30,
    comp: ["corn", "bushbean", "nasturtium", "marigold", "borage"], anti: ["potato"] },
  { id: "wintersquash", name: "Winter squash", fam: "cucurbit", perSqFt: 0.25, spacing: "1 per 4 sq ft", dtm: 95, sowDepth: 1, sun: "Full sun", water: "1–2 in/week", direct: 1, tender: "tender", harvestSpan: 21,
    comp: ["corn", "polebean", "nasturtium", "borage"], anti: ["potato"] },
  { id: "pumpkin", name: "Pumpkin", fam: "cucurbit", perSqFt: 0.25, spacing: "1 per 4 sq ft", dtm: 105, sowDepth: 1, sun: "Full sun", water: "1–2 in/week, heavy once vining", direct: 1, tender: "tender", harvestSpan: 21,
    comp: ["corn", "polebean", "nasturtium"], anti: ["potato"] },
  { id: "melon", name: "Melon", fam: "cucurbit", perSqFt: 0.5, spacing: "1 per 2 sq ft", dtm: 85, sowDepth: 0.5, sun: "Full sun", water: "1–2 in/week, taper as fruit ripens for sweetness", indoors: -3, transplant: 2, tender: "tender", harvestSpan: 21,
    comp: ["corn", "radish", "nasturtium"], anti: ["potato"] },

  // ---- Umbellifers ----
  { id: "carrot", name: "Carrot", fam: "umbellifer", perSqFt: 16, spacing: "3 in", dtm: 70, sowDepth: 0.25, sun: "Full sun to part shade", water: "1 in/week, steady — irregular watering forks the roots", direct: -3, tender: "hardy", harvestSpan: 30, succession: 14,
    comp: ["onion", "leek", "rosemary", "sage", "tomato", "pea", "lettuce", "radish"], anti: ["dill", "fennel", "parsnip"] },
  { id: "parsnip", name: "Parsnip", fam: "umbellifer", perSqFt: 9, spacing: "4 in", dtm: 120, sowDepth: 0.5, sun: "Full sun", water: "1 in/week", direct: -2, tender: "hardy", harvestSpan: 95,
    comp: ["pea", "radish", "onion"], anti: ["carrot", "celery"] },
  { id: "celery", name: "Celery", fam: "umbellifer", perSqFt: 4, spacing: "6 in", dtm: 100, sowDepth: 0.125, sun: "Full sun to part shade", water: "Consistently moist — a heavy feeder and drinker", indoors: -10, transplant: 1, tender: "half-hardy", harvestSpan: 30,
    comp: ["cabbage", "broccoli", "leek", "bushbean", "tomato"], anti: ["parsnip", "corn"] },
  { id: "dill", name: "Dill", fam: "umbellifer", perSqFt: 4, spacing: "6 in", dtm: 55, sowDepth: 0.25, sun: "Full sun", water: "1 in/week", direct: -1, tender: "half-hardy", harvestSpan: 45, succession: 21,
    comp: ["cabbage", "broccoli", "cucumber", "lettuce", "onion"], anti: ["carrot", "tomato", "fennel"] },
  { id: "parsley", name: "Parsley", fam: "umbellifer", perSqFt: 4, spacing: "6 in", dtm: 75, sowDepth: 0.25, sun: "Full sun to part shade", water: "1 in/week", indoors: -8, transplant: -1, tender: "hardy", harvestSpan: 100,
    comp: ["tomato", "asparagus", "corn", "pepper"], anti: ["lettuce"] },
  { id: "cilantro", heatSensitive: true, name: "Cilantro", fam: "umbellifer", perSqFt: 9, spacing: "4 in", dtm: 45, sowDepth: 0.25, sun: "Full sun to part shade", water: "1 in/week; bolts fast once it's hot", direct: -2, tender: "half-hardy", harvestSpan: 21, succession: 14,
    comp: ["spinach", "pepper", "tomato"], anti: ["fennel"] },
  { id: "fennel", name: "Fennel (bulb)", fam: "umbellifer", perSqFt: 4, spacing: "6 in", dtm: 90, sowDepth: 0.25, sun: "Full sun", water: "1 in/week", direct: -1, tender: "half-hardy", harvestSpan: 21,
    comp: [], anti: ["tomato", "pepper", "eggplant", "bushbean", "polebean", "carrot", "dill", "cilantro", "cucumber"] },

  // ---- Chenopods ----
  { id: "beet", name: "Beet", fam: "chenopod", perSqFt: 9, spacing: "4 in", dtm: 55, sowDepth: 0.5, sun: "Full sun to part shade", water: "1 in/week, even moisture for smooth roots", direct: -3, tender: "half-hardy", harvestSpan: 28, succession: 14,
    comp: ["onion", "cabbage", "broccoli", "lettuce", "bushbean", "kohlrabi"], anti: ["polebean", "mustard"] },
  { id: "chard", name: "Swiss chard", fam: "chenopod", perSqFt: 4, spacing: "6 in", dtm: 55, sowDepth: 0.5, sun: "Full sun to part shade", water: "1 in/week", direct: -2, tender: "half-hardy", harvestSpan: 100,
    comp: ["onion", "cabbage", "bushbean", "lettuce"], anti: ["polebean", "corn"] },
  { id: "spinach", heatSensitive: true, name: "Spinach", fam: "chenopod", perSqFt: 9, spacing: "4 in", dtm: 45, sowDepth: 0.5, sun: "Full sun to part shade", water: "1 in/week; bolts once it's hot", direct: -6, tender: "hardy", harvestSpan: 21, succession: 14,
    comp: ["strawberry", "pea", "radish", "cabbage"], anti: [] },

  // ---- Asters ----
  { id: "lettuce", heatSensitive: true, name: "Lettuce (leaf)", fam: "aster", perSqFt: 4, spacing: "6 in", dtm: 50, sowDepth: 0.125, sun: "Part shade in heat, full sun when cool", water: "1 in/week — shallow roots dry out fast", direct: -4, tender: "half-hardy", harvestSpan: 28, succession: 10,
    comp: ["carrot", "radish", "cucumber", "strawberry", "onion", "beet"], anti: ["parsley"] },
  { id: "romaine", name: "Lettuce (head)", fam: "aster", perSqFt: 4, spacing: "6 in", dtm: 65, sowDepth: 0.125, sun: "Full sun to part shade", water: "1 in/week", indoors: -5, transplant: -3, tender: "half-hardy", harvestSpan: 21, succession: 14,
    comp: ["carrot", "radish", "cucumber", "onion", "beet"], anti: ["parsley"] },
  { id: "endive", name: "Endive / radicchio", fam: "aster", perSqFt: 4, spacing: "6 in", dtm: 65, sowDepth: 0.25, sun: "Full sun to part shade", water: "1 in/week", direct: -3, tender: "hardy", harvestSpan: 28,
    comp: ["carrot", "onion", "beet"], anti: [] },
  { id: "sunflower", name: "Sunflower", fam: "aster", perSqFt: 1, spacing: "12 in", dtm: 90, sowDepth: 1, sun: "Full sun", water: "1 in/week while establishing, drought-tolerant after", direct: 1, tender: "tender", harvestSpan: 21,
    comp: ["cucumber", "corn"], anti: ["potato", "polebean"] },

  // ---- Herbs & companions ----
  { id: "basil", name: "Basil", fam: "herb", perSqFt: 4, spacing: "6 in", dtm: 60, sowDepth: 0.25, sun: "Full sun, 6+ hrs", water: "1 in/week — don't let it wilt", indoors: -6, transplant: 1, tender: "tender", harvestSpan: 75, succession: 30,
    comp: ["tomato", "pepper", "oregano", "asparagus", "marigold"], anti: ["sage"] },
  { id: "oregano", name: "Oregano", fam: "herb", perSqFt: 1, spacing: "12 in", dtm: 80, sowDepth: 0.125, sun: "Full sun", water: "Low; let it dry between waterings", perennialPlant: true, indoors: -8, transplant: 0, tender: "hardy", harvestWindow: [[5, 1], [9, 15]],
    comp: ["tomato", "pepper", "basil", "cabbage"], anti: [] },
  { id: "thyme", name: "Thyme", fam: "herb", perSqFt: 4, spacing: "6 in", dtm: 90, sowDepth: 0.125, sun: "Full sun", water: "Low; drought-tolerant once established", perennialPlant: true, indoors: -8, transplant: 0, tender: "hardy", harvestWindow: [[5, 1], [9, 20]],
    comp: ["cabbage", "broccoli", "eggplant", "strawberry"], anti: [] },
  { id: "rosemary", name: "Rosemary", fam: "herb", perSqFt: 1, spacing: "18 in", dtm: 120, sowDepth: 0.25, sun: "Full sun", water: "Low; needs sharp drainage", perennialPlant: true, transplant: 1, tender: "tender", harvestWindow: [[5, 15], [9, 30]],
    comp: ["cabbage", "bushbean", "carrot", "sage"], anti: ["cucumber"] },
  { id: "sage", name: "Sage", fam: "herb", perSqFt: 1, spacing: "18 in", dtm: 90, sowDepth: 0.25, sun: "Full sun", water: "Low once established", perennialPlant: true, transplant: 0, tender: "hardy", harvestWindow: [[5, 1], [9, 20]],
    comp: ["cabbage", "carrot", "rosemary", "strawberry"], anti: ["cucumber", "onion", "basil"] },
  { id: "mint", name: "Mint (contained)", fam: "herb", perSqFt: 1, spacing: "12 in — pot it", dtm: 70, sowDepth: 0.125, sun: "Full sun to part shade", water: "Keep moist — wilts fast when dry", perennialPlant: true, transplant: 0, tender: "hardy", harvestWindow: [[4, 20], [9, 20]],
    comp: ["cabbage", "tomato"], anti: ["parsley"] },
  { id: "marigold", name: "Marigold", fam: "aster", perSqFt: 4, spacing: "6 in", dtm: 50, sowDepth: 0.25, sun: "Full sun", water: "Moderate; drought-tolerant once established", indoors: -6, transplant: 1, tender: "tender", harvestSpan: 100,
    comp: ["tomato", "pepper", "eggplant", "cucumber", "potato", "bushbean"], anti: [] },
  { id: "nasturtium", name: "Nasturtium", fam: "herb", perSqFt: 1, spacing: "12 in", dtm: 55, sowDepth: 0.5, sun: "Full sun to part shade", water: "Low — rich, wet soil grows leaves, not flowers", direct: 1, tender: "tender", harvestSpan: 90,
    comp: ["cucumber", "zucchini", "wintersquash", "tomato", "cabbage"], anti: [] },
  { id: "borage", name: "Borage", fam: "herb", perSqFt: 1, spacing: "18 in", dtm: 55, sowDepth: 0.25, sun: "Full sun to part shade", water: "Moderate", direct: 0, tender: "half-hardy", harvestSpan: 90,
    comp: ["tomato", "zucchini", "strawberry"], anti: [] },

  // ---- Grass & perennials ----
  { id: "corn", name: "Sweet corn", fam: "grass", perSqFt: 4, spacing: "6 in, block-plant", dtm: 80, sowDepth: 1.5, sun: "Full sun", water: "1–1.5 in/week, critical at tasseling and ear fill", direct: 1, tender: "tender", harvestSpan: 14,
    comp: ["polebean", "zucchini", "wintersquash", "cucumber", "pea"], anti: ["tomato", "celery"] },
  { id: "strawberry", name: "Strawberry", fam: "perennial", perSqFt: 4, spacing: "6 in", dtm: 60, sowDepth: null, sun: "Full sun, 6+ hrs", water: "1–1.5 in/week", perennialPlant: true, transplant: -2, tender: "hardy", harvestWindow: [[5, 12], [6, 12]],
    comp: ["lettuce", "spinach", "onion", "thyme", "borage"], anti: ["cabbage", "broccoli", "cauliflower", "kale"] },
  { id: "asparagus", name: "Asparagus", fam: "perennial", perSqFt: 1, spacing: "12 in", dtm: 730, sowDepth: null, sun: "Full sun", water: "1–1.5 in/week", perennialPlant: true, transplant: -3, tender: "hardy", harvestWindow: [[4, 10], [5, 20]], note: "No cutting for the first two years",
    comp: ["tomato", "parsley", "basil"], anti: ["onion", "garlic"] },
  { id: "rhubarb", name: "Rhubarb", fam: "perennial", perSqFt: 0.25, spacing: "1 per 4 sq ft", dtm: 365, sowDepth: null, sun: "Full sun to part shade", water: "1 in/week", perennialPlant: true, transplant: -4, tender: "hardy", harvestWindow: [[4, 10], [5, 30]], note: "Stop pulling by early July",
    comp: ["cabbage", "broccoli", "garlic"], anti: [] },

  // ---- More vegetables ----
  { id: "watermelon", name: "Watermelon", fam: "cucurbit", perSqFt: 0.1, spacing: "1 per 10 sq ft", dtm: 85, sowDepth: 1, sun: "Full sun", water: "1–2 in/week, taper off as fruit ripens", indoors: -4, transplant: 2, tender: "tender", harvestSpan: 21,
    comp: ["corn", "nasturtium", "radish"], anti: ["potato"] },
  { id: "sweetpotato", name: "Sweet potato", fam: "other", perSqFt: 0.25, spacing: "1 per 4 sq ft, slips", dtm: 100, sowDepth: null, sun: "Full sun", water: "1 in/week, less as harvest nears", transplant: 3, tender: "tender", harvestSpan: 14, note: "Grown from slips, not seed. Marginal this far north — pick a short-season variety like Georgia Jet.",
    comp: ["bushbean", "dill"], anti: [] },
  { id: "okra", name: "Okra", fam: "other", perSqFt: 1, spacing: "12 in", dtm: 60, sowDepth: 0.5, sun: "Full sun", water: "1 in/week, drought-tolerant once established", direct: 2, tender: "tender", harvestSpan: 45, note: "Wants real heat — start indoors and set out well after last frost in a Hamilton season.",
    comp: ["pepper", "basil"], anti: [] },
  { id: "artichoke", name: "Artichoke", fam: "other", perSqFt: 0.25, spacing: "1 per 4 sq ft", dtm: 120, sowDepth: 0.5, sun: "Full sun", water: "1–1.5 in/week", indoors: -10, transplant: 2, tender: "tender", harvestSpan: 30, note: "Grown as an annual this far north — needs a long, cold-tricked start indoors to head the first year.",
    comp: ["pea", "sunflower"], anti: [] },
  { id: "rutabaga", name: "Rutabaga", fam: "brassica", perSqFt: 1, spacing: "8 in", dtm: 90, sowDepth: 0.5, sun: "Full sun", water: "1 in/week", direct: -2, tender: "hardy", harvestSpan: 30,
    comp: ["onion", "beet"], anti: ["tomato", "strawberry"] },
  { id: "escarole", name: "Escarole", fam: "aster", perSqFt: 1, spacing: "12 in", dtm: 60, sowDepth: 0.25, sun: "Full sun to part shade", water: "1 in/week", indoors: -6, transplant: -3, tender: "hardy", harvestSpan: 21,
    comp: ["carrot", "onion"], anti: [] },
  { id: "shallot", name: "Shallot", fam: "allium", perSqFt: 9, spacing: "4 in", dtm: 100, sowDepth: 1, sun: "Full sun", water: "1 in/week, taper off before harvest", direct: -4, tender: "hardy", harvestSpan: 21,
    comp: ["carrot", "beet", "tomato"], anti: ["bushbean", "polebean", "pea"] },
  { id: "edamame", name: "Edamame", fam: "legume", perSqFt: 6, spacing: "4 in", dtm: 80, sowDepth: 1, sun: "Full sun", water: "1 in/week", direct: 1, tender: "tender", harvestSpan: 14,
    comp: ["corn", "carrot"], anti: ["onion", "garlic"] },
  { id: "groundcherry", name: "Ground cherry", fam: "nightshade", perSqFt: 0.5, spacing: "1 per 2 sq ft", dtm: 75, sowDepth: 0.25, sun: "Full sun", water: "1 in/week", indoors: -6, transplant: 1, tender: "tender", harvestSpan: 45,
    comp: ["basil", "marigold"], anti: ["fennel"] },
  { id: "horseradish", name: "Horseradish", fam: "brassica", perSqFt: 0.5, spacing: "1 per 2 sq ft", dtm: 180, sowDepth: null, sun: "Full sun to part shade", water: "1 in/week", perennialPlant: true, transplant: -3, tender: "hardy", harvestSpan: 30, note: "Grown from root cuttings, spreads aggressively — give it a spot it can't escape from, or a bottomless pot sunk in the bed.",
    comp: ["potato"], anti: ["tomato", "strawberry"] },
  { id: "tarragon", name: "Tarragon", fam: "herb", perSqFt: 1, spacing: "18 in", dtm: 90, sowDepth: 0.125, sun: "Full sun to part shade", water: "Moderate; drier once established", perennialPlant: true, transplant: 0, tender: "hardy", harvestSpan: 120,
    comp: ["tomato"], anti: [] },
  { id: "chervil", name: "Chervil", fam: "umbellifer", perSqFt: 4, spacing: "6 in", dtm: 60, sowDepth: 0.25, sun: "Part shade", water: "1 in/week, bolts fast in heat", direct: -2, tender: "half-hardy", harvestSpan: 30, succession: 21,
    comp: ["lettuce", "radish"], anti: ["fennel"] },
  { id: "lovage", name: "Lovage", fam: "umbellifer", perSqFt: 1, spacing: "18 in", dtm: 85, sowDepth: 0.25, sun: "Full sun to part shade", water: "1 in/week", perennialPlant: true, transplant: -1, tender: "hardy", harvestSpan: 120,
    comp: ["tomato", "carrot", "bushbean"], anti: [] },
  { id: "sorrel", name: "Sorrel", fam: "chenopod", perSqFt: 4, spacing: "6 in", dtm: 60, sowDepth: 0.25, sun: "Full sun to part shade", water: "1 in/week", perennialPlant: true, direct: -3, tender: "hardy", harvestSpan: 90,
    comp: ["strawberry"], anti: [] },

  // ---- Cut flowers ----
  { id: "zinnia", name: "Zinnia", fam: "flower", perSqFt: 1, spacing: "12 in", dtm: 60, sowDepth: 0.25, sun: "Full sun", water: "1 in/week, keep foliage dry to avoid mildew", direct: 1, tender: "tender", harvestSpan: 90, bloomer: true, succession: 21,
    comp: ["tomato", "cucumber", "zucchini"], anti: [] },
  { id: "cosmos", name: "Cosmos", fam: "flower", perSqFt: 1, spacing: "12 in", dtm: 60, sowDepth: 0.25, sun: "Full sun", water: "Low; drought-tolerant, don't overfeed or it goes all leaf", direct: 1, tender: "tender", harvestSpan: 100, bloomer: true,
    comp: ["tomato", "zucchini", "corn"], anti: [] },
  { id: "dahlia", name: "Dahlia", fam: "flower", perSqFt: 0.5, spacing: "1 per 2 sq ft, tubers", dtm: 90, sowDepth: 4, sun: "Full sun", water: "1 in/week, more once budding", transplant: 2, tender: "tender", harvestSpan: 90, bloomer: true, note: "Grown from tubers, lifted and stored over winter — not hardy through a Hamilton winter in the ground.",
    comp: [], anti: [] },
  { id: "calendula", name: "Calendula", fam: "flower", perSqFt: 4, spacing: "6 in", dtm: 50, sowDepth: 0.25, sun: "Full sun to part shade", water: "1 in/week", direct: -3, tender: "hardy", harvestSpan: 100, bloomer: true, succession: 21,
    comp: ["tomato", "carrot", "cabbage", "broccoli"], anti: [] },
  { id: "sweetpea", name: "Sweet pea (ornamental)", fam: "flower", perSqFt: 4, spacing: "4 in on trellis", dtm: 65, sowDepth: 1, sun: "Full sun, cool roots", water: "1 in/week", direct: -6, tender: "hardy", harvestSpan: 45, bloomer: true, note: "Ornamental, not edible — the seeds and pods are toxic. Keep it clearly separate from garden peas.",
    comp: [], anti: [] },
  { id: "snapdragon", name: "Snapdragon", fam: "flower", perSqFt: 2, spacing: "8 in", dtm: 90, sowDepth: 0.125, sun: "Full sun", water: "1 in/week", indoors: -8, transplant: -3, tender: "hardy", harvestSpan: 90, bloomer: true,
    comp: [], anti: [] },
  { id: "celosia", name: "Celosia", fam: "flower", perSqFt: 1, spacing: "10 in", dtm: 70, sowDepth: 0.125, sun: "Full sun", water: "Moderate", indoors: -6, transplant: 1, tender: "tender", harvestSpan: 90, bloomer: true,
    comp: [], anti: [] },
  { id: "aster_flower", name: "China aster", fam: "flower", perSqFt: 1, spacing: "10 in", dtm: 80, sowDepth: 0.125, sun: "Full sun", water: "1 in/week", indoors: -6, transplant: 1, tender: "half-hardy", harvestSpan: 45, bloomer: true,
    comp: [], anti: [] },
  { id: "snapdragon2", name: "Larkspur", fam: "flower", perSqFt: 1, spacing: "9 in", dtm: 75, sowDepth: 0.125, sun: "Full sun", water: "1 in/week", direct: -6, tender: "hardy", harvestSpan: 45, bloomer: true, note: "Sow while it's still cold — it wants a chill to germinate well and sulks if started warm.",
    comp: [], anti: [] },
];

const CROP_BY_ID = Object.fromEntries(CROPS.map((c) => [c.id, c]));

/* Custom crops get folded into the same CROPS/CROP_BY_ID every part of the
   app already reads from — this is the one place that happens, so a crop
   added by the person works everywhere immediately: palette, seed box,
   schedule, rotation, all of it, with no separate code path to keep in sync. */
function registerCustomCrop(crop) {
  const existing = CROPS.findIndex((c) => c.id === crop.id);
  if (existing >= 0) CROPS[existing] = crop;
  else CROPS.push(crop);
  CROP_BY_ID[crop.id] = crop;
}
const newCropId = (name) =>
  "custom-" + name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Math.random().toString(36).slice(2, 6);

/* Depth as a gardener reads it — a fraction where that's the normal way to say it. */
function depthLabel(crop) {
  if (crop.sowDepth == null) {
    if (crop.id === "strawberry") return "crown at soil level, not buried";
    if (crop.id === "asparagus") return "crown 6–8 in deep, backfilled as it grows";
    if (crop.id === "rhubarb") return "bud 1–2 in below the surface";
    return "set at soil level";
  }
  const d = crop.sowDepth;
  const eighths = Math.round(d * 8);
  const table = { 1: "⅛ in", 2: "¼ in", 3: "⅜ in", 4: "½ in" };
  if (table[eighths]) return table[eighths];
  return `${d} in`;
}

/* ---------- seed keeping ----------
   Years a packet stays reliably viable, stored dry and cool. Family default,
   overridden where a crop is known to be shorter- or longer-lived. */
const FAMILY_SEED_LIFE = {
  nightshade: 4, brassica: 4, legume: 3, allium: 1, cucurbit: 5,
  umbellifer: 3, chenopod: 4, aster: 5, herb: 3, grass: 2, perennial: 3,
  flower: 3, other: 3,
};
const SEED_LIFE_OVERRIDE = {
  pepper: 2, parsley: 2, parsnip: 1, corn: 2, spinach: 3, sunflower: 3,
  celery: 5, lettuce: 5, romaine: 5, endive: 5, basil: 4, radish: 5, cucumber: 5,
  watermelon: 4, edamame: 3, chervil: 2,
};
const seedLife = (crop) => SEED_LIFE_OVERRIDE[crop.id] ?? FAMILY_SEED_LIFE[crop.fam] ?? 3;

/* Roughly what a full retail packet holds. Used only to sanity-check whether
   you have enough — not a substitute for counting. */
const FAMILY_PACKET = {
  nightshade: 30, brassica: 100, legume: 60, allium: 200, cucurbit: 15,
  umbellifer: 400, chenopod: 75, aster: 500, herb: 150, grass: 75, perennial: 40,
  flower: 100, other: 50,
};
const PACKET_OVERRIDE = {
  tomato: 25, pepper: 25, eggplant: 25, tomatillo: 30, carrot: 600, radish: 150,
  lettuce: 600, romaine: 300, corn: 75, pea: 90, bushbean: 70, polebean: 50,
  zucchini: 15, wintersquash: 12, pumpkin: 12, melon: 15, cucumber: 20,
  onion: 250, scallion: 300, leek: 200, spinach: 150, beet: 75, chard: 60,
  sunflower: 30, nasturtium: 15, borage: 30, marigold: 60, basil: 200,
  watermelon: 15, okra: 50, edamame: 40, groundcherry: 40, zinnia: 100, cosmos: 150,
};
const packetSeeds = (crop) => PACKET_OVERRIDE[crop.id] ?? FAMILY_PACKET[crop.fam] ?? 100;

/* Not everything comes in a packet. */
const PROPAGULE = {
  garlic: "cloves", potato: "seed potatoes", strawberry: "crowns",
  asparagus: "crowns", rhubarb: "crowns", onion: "sets or seed",
  rosemary: "plant or cutting", mint: "plant or cutting", oregano: "seed or plant",
  thyme: "seed or plant", sage: "seed or plant", chive: "seed or division",
  sweetpotato: "slips", horseradish: "root cuttings", dahlia: "tubers",
  tarragon: "plant or cutting", lovage: "seed or division", sorrel: "seed or division",
};
const propaguleOf = (crop) => PROPAGULE[crop.id] ?? "seed";
const isTruePacket = (crop) => !["garlic", "potato", "strawberry", "asparagus", "rhubarb", "sweetpotato", "horseradish", "dahlia"].includes(crop.id);

const FULLNESS = {
  full: { label: "Full", frac: 1 },
  half: { label: "About half", frac: 0.5 },
  low: { label: "Running low", frac: 0.15 },
  empty: { label: "Empty", frac: 0 },
};

/* Sow more than you need — some won't come up, and you thin. */
const sowFactor = (crop) => (crop.indoors != null ? 1.5 : 2.5);

/* How a packet is doing, given the year it was packed for. */
function seedStanding(seed, crop, today) {
  if (!crop) return { key: "unknown", label: "Unknown crop", age: null };
  const life = seedLife(crop);
  if (!seed.year) return { key: "undated", label: "No date recorded", age: null, life };
  const age = today.getFullYear() - Number(seed.year);
  if (age < 0) return { key: "fresh", label: "Current season", age, life };
  if (age === 0) return { key: "fresh", label: "This year's seed", age, life };
  if (age <= life) return { key: "good", label: `${age} yr old — still within ${life} yr`, age, life };
  if (age <= life + 2) return { key: "test", label: `${age} yr old — past ${life} yr, test it`, age, life };
  return { key: "spent", label: `${age} yr old — likely spent`, age, life };
}

/* Chris's layout, oriented from the aerial: the back yard sits SOUTH of the
   house, so the house wall is the garden's north edge and the three 4×8 beds
   run north–south down the WEST fence. x measures east from the west fence,
   y measures south from the house wall. rot 90 turns a bed side-on. */
const DEFAULT_BEDS = [
  { id: "b1", name: "West Fence — North", w: 4, l: 8, depth: 12, x: 1, y: 10.5, rot: 0, note: "Nearest the house, closest to the tree" },
  { id: "b2", name: "West Fence — Middle", w: 4, l: 8, depth: 12, x: 1, y: 20.83, rot: 0, note: "Middle of the fence run" },
  { id: "b3", name: "West Fence — South", w: 4, l: 8, depth: 12, x: 1, y: 31.17, rot: 0, note: "Far end of the fence run" },
  { id: "b4", name: "House Bed — West End", w: 3, l: 5, depth: 12, x: 11, y: 1, rot: 0, note: "Beside the west window" },
  { id: "b5", name: "U-Bed — Base", w: 8, l: 2, depth: 12, x: 16, y: 1, rot: 0, note: "99 in base, 1 ft off the house wall" },
  { id: "b6", name: "U-Bed — West Arm", w: 3, l: 5, depth: 12, x: 16, y: 3, rot: 0, note: "Arm running south from the base" },
  { id: "b7", name: "U-Bed — East Arm", w: 3, l: 5, depth: 12, x: 21, y: 3, rot: 0, note: "Arm running south from the base" },
  { id: "b8", name: "House Bed — East End", w: 3, l: 5, depth: 12, x: 26, y: 1, rot: 0, note: "Beside the east window" },
];

const DEFAULT_FEATURES = [
  { id: "f1", kind: "tree", name: "Fruit tree", x: 0.5, y: 0.5, w: 9, d: 9 },
];

const DEFAULT_YARD = {
  w: 40, d: 42,
  edges: { north: "house", east: "fence", south: "fence", west: "fence" },
  northAngle: 0,   // degrees clockwise from "up" on the plan to true north
  houseHeight: 20, // feet — used only where an edge is marked "house", for shade estimates
};

/* Things that sit in a yard. Sizes are typical defaults in feet, all editable.
   `clear` is the working space the object wants kept free around it. */
const FEATURE_KINDS = {
  house:      { label: "House", fill: "#6E6A63", shape: "rect", cat: "structure", w: 24, d: 10, height: 20, hatch: true, note: "Draw the footprint that intrudes on the yard. Foundations shed lime into the soil and eaves keep a strip permanently dry." },
  garage:     { label: "Garage", fill: "#6E6A63", shape: "rect", cat: "structure", w: 20, d: 20, height: 12, hatch: true },
  shed:       { label: "Shed", fill: "#7A6A57", shape: "rect", cat: "structure", w: 8, d: 6, height: 8 },
  deck:       { label: "Deck", fill: "#9C8A6A", shape: "rect", cat: "structure", w: 12, d: 10, height: 0 },
  patio:      { label: "Patio", fill: "#B4AFA0", shape: "rect", cat: "structure", w: 12, d: 10, height: 0 },
  greenhouse: { label: "Greenhouse", fill: "#A8C3C9", shape: "rect", cat: "structure", w: 8, d: 6, height: 7 },
  coldframe:  { label: "Cold frame", fill: "#A8C3C9", shape: "rect", cat: "structure", w: 4, d: 2, height: 1 },

  ac:         { label: "AC condenser", fill: "#8A8F96", shape: "rect", cat: "utility", w: 2.5, d: 2.5, clear: 2, height: 3, note: "Blows hot exhaust upward and needs roughly 2 ft clear on all sides for airflow and service. Don't plant anything tender against it." },
  heatpump:   { label: "Heat pump", fill: "#8A8F96", shape: "rect", cat: "utility", w: 3, d: 2.5, clear: 2, height: 3 },
  meter:      { label: "Gas / hydro meter", fill: "#8A8F96", shape: "rect", cat: "utility", w: 2, d: 1, clear: 1, height: 3, note: "Keep a clear path for the meter reader and don't screen it with anything permanent." },
  downspout:  { label: "Downspout", fill: "#3B5A73", shape: "rect", cat: "utility", w: 0.5, d: 0.5, height: 0, note: "Where the roof water actually lands. Worth knowing before you site a barrel." },
  gate:       { label: "Gate", fill: "#7A6A57", shape: "rect", cat: "utility", w: 3, d: 0.5, clear: 3, height: 0, note: "Leave swing room and enough width to get a wheelbarrow through." },

  rainbarrel: { label: "Rain barrel", fill: "#3B5A73", shape: "circle", cat: "water", w: 2, d: 2, height: 3, note: "A standard barrel holds about 200 L. One inch of rain on 100 sq ft of roof yields roughly 230 L, so a single barrel fills fast — plan for an overflow." },
  cistern:    { label: "Cistern / tote", fill: "#3B5A73", shape: "rect", cat: "water", w: 4, d: 3.5, height: 4, note: "An IBC tote holds about 1000 L. Screen it from light or it grows algae." },
  tap:        { label: "Outdoor tap", fill: "#3B5A73", shape: "circle", cat: "water", w: 1, d: 1, height: 0 },
  pond:       { label: "Pond", fill: "#4A7C8C", shape: "circle", cat: "water", w: 6, d: 6, height: 0 },

  compost:    { label: "Compost", fill: "#6B5344", shape: "rect", cat: "working", w: 4, d: 3, height: 3 },
  firepit:    { label: "Fire pit", fill: "#A3562E", shape: "circle", cat: "working", w: 4, d: 4, clear: 3, height: 1 },
  bocce:      { label: "Bocce court", fill: "#C2B48A", shape: "rect", cat: "working", w: 60, d: 10, height: 0, note: "A regulation court is 60 × 12 ft, but backyard courts are commonly 40 × 8." },
  play:       { label: "Play structure", fill: "#8FA372", shape: "rect", cat: "working", w: 10, d: 8, clear: 6, height: 7 },
  clothesline:{ label: "Clothesline", fill: "#9AA08F", shape: "rect", cat: "working", w: 20, d: 1, height: 6 },
  path:       { label: "Path", fill: "#B4AFA0", shape: "rect", cat: "working", w: 12, d: 2.5, height: 0 },
  lawn:       { label: "Lawn / open", fill: "#8FA372", shape: "rect", cat: "working", w: 12, d: 10, height: 0 },
  tree:       { label: "Tree (ornamental)", fill: "#7D9A5B", shape: "circle", cat: "working", w: 12, d: 12, height: 15, note: "Draw the mature canopy, not the trunk. Shade and root competition both reach about that far." },
};

/* ---------- perennial fruit ----------
   Woody plants live in the yard rather than in a bed square: they hold their
   spot for years, so spread and pollination matter more than spacing.
   Harvest windows are typical for Hamilton (6b) on an established plant. */
const BUSHES = {
  haskap:      { label: "Haskap / honeyberry", group: "Bush", spread: 4, height: 5, bear: 2, harvest: [[5, 8], [5, 28]], sun: "full to part", ph: "5.5–7.5", partner: "Needs a second, different variety nearby or it sets almost nothing.", note: "The first fruit of the year — ripe before strawberries. Extremely hardy and shrugs off a late frost." },
  strawberryP: { label: "Strawberry patch", group: "Ground", spread: 3, height: 0.8, bear: 1, harvest: [[5, 12], [6, 12]], sun: "full", ph: "5.5–6.5", selfFertile: true, note: "June-bearing gives one heavy flush; everbearing dribbles all season. Renew the bed every third year." },
  saskatoon:   { label: "Saskatoon berry", group: "Bush", spread: 6, height: 10, bear: 3, harvest: [[6, 1], [6, 20]], sun: "full", ph: "6.0–7.5", selfFertile: true, note: "Prairie native, very hardy, takes alkaline soil that would kill a blueberry." },
  currantRed:  { label: "Red currant", group: "Bush", spread: 4, height: 4, bear: 2, harvest: [[6, 5], [6, 25]], sun: "full to part", ph: "5.5–7.0", selfFertile: true, note: "One of the few fruits that genuinely crops in part shade." },
  currantBlack:{ label: "Black currant", group: "Bush", spread: 5, height: 5, bear: 2, harvest: [[6, 10], [6, 30]], sun: "full to part", ph: "5.5–7.0", selfFertile: true, note: "An alternate host for white pine blister rust — some Ontario municipalities still restrict planting. Worth a check locally. Choose a rust-immune cultivar." },
  gooseberry:  { label: "Gooseberry", group: "Bush", spread: 4, height: 4, bear: 2, harvest: [[6, 10], [7, 5]], sun: "full to part", ph: "5.5–7.0", selfFertile: true, note: "Thorny. Give yourself room to reach in, or plant a thornless cultivar." },
  raspSummer:  { label: "Raspberry, summer", group: "Cane", spread: 3, height: 5, bear: 2, harvest: [[6, 1], [6, 25]], sun: "full", ph: "5.6–6.5", selfFertile: true, note: "Fruits on last year's canes, so cut only the spent ones. Suckers aggressively — bury an edging or expect it in the lawn." },
  raspFall:    { label: "Raspberry, everbearing", group: "Cane", spread: 3, height: 5, bear: 1, harvest: [[7, 10], [9, 5]], sun: "full", ph: "5.6–6.5", selfFertile: true, note: "Can be mown to the ground each spring for one clean fall crop — by far the easiest berry to manage." },
  blueberry:   { label: "Highbush blueberry", group: "Bush", spread: 5, height: 6, bear: 3, harvest: [[6, 10], [7, 20]], sun: "full", ph: "4.5–5.5", partner: "Plant at least two different varieties — yields roughly double against a lone bush.", note: "The pH is the whole game. Hamilton soil runs alkaline over limestone, so this needs its own acidified bed with peat and sulphur, and it will drift back without upkeep. The hardest thing on this list to grow well here." },
  blackberry:  { label: "Blackberry", group: "Cane", spread: 4, height: 6, bear: 2, harvest: [[7, 1], [7, 31]], sun: "full", ph: "5.5–7.0", selfFertile: true, note: "Less hardy than raspberry in 6b. Choose an erect thornless type and expect some winter tip kill." },
  elderberry:  { label: "Elderberry", group: "Bush", spread: 8, height: 10, bear: 2, harvest: [[7, 15], [8, 15]], sun: "full to part", ph: "5.5–6.5", partner: "Two different varieties fruit far better than one.", note: "Big and vigorous — give it a corner. Raw berries need cooking." },
  grape:       { label: "Grape", group: "Vine", spread: 8, height: 7, bear: 3, harvest: [[8, 1], [9, 5]], sun: "full", ph: "5.5–7.0", selfFertile: true, note: "Wants a trellis or wire and hard annual pruning. A south-facing wall ripens it earlier." },
  fig:         { label: "Fig", group: "Bush", spread: 6, height: 8, bear: 2, harvest: [[7, 20], [8, 30]], sun: "full, sheltered", ph: "6.0–7.0", selfFertile: true, note: "Not reliably hardy here on its own. The old Hamilton method is to wrap it, bend and bury it, or grow it in a pot and wheel it into the garage — plenty of Italian gardens in this city have kept one going for decades." },
  cherrySour:  { label: "Sour cherry", group: "Tree", spread: 12, height: 14, bear: 3, harvest: [[6, 5], [6, 25]], sun: "full", ph: "6.0–7.0", selfFertile: true, note: "Self-fertile and far easier than sweet cherry. Montmorency is the standard." },
  cherrySweet: { label: "Sweet cherry", group: "Tree", spread: 14, height: 16, bear: 4, harvest: [[5, 25], [6, 15]], sun: "full", ph: "6.0–7.0", partner: "Most varieties need a compatible second tree unless sold as self-fertile.", note: "Splits in a wet June." },
  appleDwarf:  { label: "Apple, dwarf", group: "Tree", spread: 10, height: 10, bear: 4, harvest: [[8, 1], [9, 15]], sun: "full", ph: "6.0–7.0", partner: "Needs a second variety flowering at the same time, or a crabapple within range.", note: "On dwarf rootstock it needs permanent staking. Scab-resistant varieties save a lot of spraying." },
  pearDwarf:   { label: "Pear, dwarf", group: "Tree", spread: 10, height: 12, bear: 4, harvest: [[7, 25], [8, 25]], sun: "full", ph: "6.0–7.0", partner: "Two varieties needed for a reliable crop.", note: "Pick pears firm and ripen them off the tree." },
  plum:        { label: "Plum", group: "Tree", spread: 12, height: 14, bear: 3, harvest: [[7, 5], [8, 5]], sun: "full", ph: "6.0–7.0", partner: "European types are often self-fertile; Japanese types usually are not." },
  peach:       { label: "Peach", group: "Tree", spread: 12, height: 12, bear: 3, harvest: [[7, 5], [8, 1]], sun: "full, sheltered", ph: "6.0–7.0", selfFertile: true, note: "Marginal but real in this part of Ontario — the Niagara fruit belt is next door. Wants the warmest, best-drained spot you have." },
  rhubarbP:    { label: "Rhubarb", group: "Ground", spread: 3, height: 3, bear: 2, harvest: [[4, 1], [5, 20]], sun: "full to part", ph: "6.0–6.8", selfFertile: true, note: "Stop pulling by early July and let it build the crown back. Lives decades." },
};

const BUSH_GROUPS = ["Bush", "Cane", "Vine", "Tree", "Ground"];

const FEATURE_CATS = {
  structure: "Buildings",
  utility: "Services",
  water: "Water",
  working: "Yard",
};

const bedFootprint = (b) => (b.rot === 90 ? { w: b.l, d: b.w } : { w: b.w, d: b.l });

/* Shortest distance from a point to a line segment, in the same units as the points. */
function pointToSegment(p, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

/* ============================================================
   Sun exposure — real solar geometry, not a guess.
   Scoped to Hamilton, ON, like the frost dates elsewhere in the app.
   ============================================================ */

const HAMILTON_LAT = 43.2557;

/* Simplified solar position (NOAA-style approximation — ignores the equation
   of time, so "solar noon" can drift up to ~15 min from clock noon. That's
   well within the margin of everything else this estimate simplifies, so
   it's not worth the extra complexity to correct for it.) */
function solarPosition(dayOfYear, solarHour, latDeg) {
  const rad = Math.PI / 180;
  const decl = 23.45 * Math.sin(rad * (360 / 365) * (284 + dayOfYear));
  const H = 15 * (solarHour - 12);
  const lat = latDeg * rad, d = decl * rad, h = H * rad;
  const sinAlt = Math.sin(lat) * Math.sin(d) + Math.cos(lat) * Math.cos(d) * Math.cos(h);
  const altitude = Math.asin(Math.max(-1, Math.min(1, sinAlt))) / rad;
  let cosAz = (Math.sin(d) - Math.sin(altitude * rad) * Math.sin(lat)) / (Math.cos(altitude * rad) * Math.cos(lat));
  cosAz = Math.max(-1, Math.min(1, cosAz));
  let azimuth = Math.acos(cosAz) / rad;
  if (H > 0) azimuth = 360 - azimuth;
  return { altitude, azimuth };
}

function dayOfYearFor(month, day) {
  return Math.floor((new Date(2001, month - 1, day) - new Date(2001, 0, 0)) / 86400000);
}

/* Where "up" on the plan points at compass bearing `northAngleDeg`, convert a
   plan-space displacement (feet) into true compass displacement (feet). */
function planToWorld(dx, dy, northAngleDeg) {
  const t = (northAngleDeg * Math.PI) / 180;
  return {
    east: dx * Math.cos(t) - dy * Math.sin(t),
    north: -dx * Math.sin(t) - dy * Math.cos(t),
  };
}

/* Every shade-casting thing in the yard, reduced to a point, an effective
   width, and a height — beds, features, plantings, and house-wall edges all
   collapse to this same shape so one shading test covers all of them. */
function gatherObstructions(beds, features, plantings, yard) {
  const obs = [];
  features.forEach((f) => {
    const kind = FEATURE_KINDS[f.kind];
    const h = f.height ?? kind?.height ?? 0;
    if (h <= 0) return;
    obs.push({ x: f.x + f.w / 2, y: f.y + f.d / 2, width: Math.max(f.w, f.d), height: h, name: f.name });
  });
  plantings.forEach((p) => {
    const sp = BUSHES[p.speciesId];
    if (!sp || !sp.height) return;
    obs.push({ x: p.x + p.w / 2, y: p.y + p.w / 2, width: p.w, height: sp.height, name: p.variety || sp.label });
  });
  if (yard.houseHeight > 0) {
    const h = yard.houseHeight;
    const W = yard.w, D = yard.d;
    const edgePoints = {
      north: [{ x: 0, y: 0 }, { x: W, y: 0 }],
      south: [{ x: 0, y: D }, { x: W, y: D }],
      west: [{ x: 0, y: 0 }, { x: 0, y: D }],
      east: [{ x: W, y: 0 }, { x: W, y: D }],
    };
    Object.entries(yard.edges || {}).forEach(([side, kind]) => {
      if (kind !== "house") return;
      const [a, b] = edgePoints[side];
      // sample the wall as a few points along its length, since a single
      // centroid badly understates a wall that runs the whole yard edge
      const N = 5;
      for (let i = 0; i <= N; i++) {
        obs.push({
          x: a.x + (b.x - a.x) * (i / N),
          y: a.y + (b.y - a.y) * (i / N),
          width: Math.max(W, D) / N,
          height: h,
          name: "house wall",
        });
      }
    });
  }
  return obs;
}

/* Hours of direct sun a plan-space point gets on one date, sampled every 20
   minutes between sunrise and sunset. An obstruction shades the point when
   the point falls within its shadow's line-of-cast, approximated as a band
   the width of the obstruction along the shadow direction — not an exact
   polygon render, but the right order of accuracy for siting a vegetable bed. */
function sunHoursAt(point, obstructions, month, day, northAngleDeg, latDeg = HAMILTON_LAT) {
  const doy = dayOfYearFor(month, day);
  const pointWorld = planToWorld(point.x, point.y, northAngleDeg);

  // find sunrise/sunset in solar hours via the altitude=0 hour angle
  const rad = Math.PI / 180;
  const decl = 23.45 * Math.sin(rad * (360 / 365) * (284 + doy));
  const cosH0 = -Math.tan(latDeg * rad) * Math.tan(decl * rad);
  if (cosH0 <= -1) return 24; // polar day, never happens at this latitude but keep it safe
  if (cosH0 >= 1) return 0;   // polar night, ditto
  const H0 = Math.acos(cosH0) / rad;
  const sunrise = 12 - H0 / 15, sunset = 12 + H0 / 15;

  let litSteps = 0, totalSteps = 0;
  const STEP = 1 / 3; // 20-minute steps
  for (let t = sunrise; t <= sunset; t += STEP) {
    totalSteps++;
    const { altitude, azimuth } = solarPosition(doy, t, latDeg);
    if (altitude <= 3) continue; // treat near-horizon light as negligible for plant growth

    const shadowBearing = (azimuth + 180) % 360;
    const shadowDir = { east: Math.sin(shadowBearing * rad), north: Math.cos(shadowBearing * rad) };

    const shaded = obstructions.some((o) => {
      const shadowLen = o.height / Math.tan(altitude * rad);
      if (shadowLen <= 0 || shadowLen > 300) return false; // absurdly long low-angle shadows aren't useful signal
      const oWorld = planToWorld(o.x, o.y, northAngleDeg);
      const tip = { east: oWorld.east + shadowDir.east * shadowLen, north: oWorld.north + shadowDir.north * shadowLen };
      const dist = pointToSegment(
        { x: pointWorld.east, y: pointWorld.north },
        { x: oWorld.east, y: oWorld.north },
        { x: tip.east, y: tip.north }
      );
      return dist < Math.max(o.width / 2, 1.5);
    });
    if (!shaded) litSteps++;
  }
  return totalSteps ? (litSteps / totalSteps) * (sunset - sunrise) : 0;
}

/* Three dates spanning the growing season — not a full-season average, but
   enough to show whether a bed is consistently fine, consistently shaded,
   or shifts a lot as the sun angle climbs through summer. */
const SUN_SAMPLE_DATES = [
  { label: "May", month: 5, day: 15 },
  { label: "Jun", month: 6, day: 21 },
  { label: "Aug", month: 8, day: 15 },
];

function bedSunExposure(bed, obstructions, northAngleDeg) {
  const fp = bedFootprint(bed);
  const center = { x: bed.x + fp.w / 2, y: bed.y + fp.d / 2 };
  const byDate = SUN_SAMPLE_DATES.map((d) => ({
    label: d.label,
    hours: sunHoursAt(center, obstructions, d.month, d.day, northAngleDeg),
  }));
  const avg = byDate.reduce((n, d) => n + d.hours, 0) / byDate.length;
  return { byDate, avg };
}

/* Feet as a gardener reads a tape measure. */
function ftIn(feet) {
  const total = Math.round(feet * 12);
  const f = Math.floor(total / 12), i = total % 12;
  if (f === 0) return `${i} in`;
  return i === 0 ? `${f} ft` : `${f} ft ${i} in`;
}

/* Shortest clear gap between two rectangles.
   Sharing an edge is a join, not a collision — only overlapping interiors count. */
function gapBetween(a, b) {
  const ax2 = a.x + a.w, ay2 = a.y + a.d, bx2 = b.x + b.w, by2 = b.y + b.d;
  const overX = Math.min(ax2, bx2) - Math.max(a.x, b.x);
  const overY = Math.min(ay2, by2) - Math.max(a.y, b.y);
  if (overX > 0.01 && overY > 0.01) return { gap: 0, overlap: true, axis: "overlap" };
  const dx = Math.max(b.x - ax2, a.x - bx2, 0);
  const dy = Math.max(b.y - ay2, a.y - by2, 0);
  if (dx < 0.01 && dy < 0.01) return { gap: 0, overlap: false, axis: "joined" };
  if (dx < 0.01) return { gap: dy, overlap: false, axis: "vertical" };
  if (dy < 0.01) return { gap: dx, overlap: false, axis: "horizontal" };
  return { gap: Math.hypot(dx, dy), overlap: false, axis: "diagonal" };
}

/* ---------- building the beds ----------
   Nominal lumber is smaller than it sounds. These are the real dimensions. */
const BOARDS = {
  "2x6": { label: "2×6", h: 5.5, t: 1.5, priceMult: 1 },
  "2x8": { label: "2×8", h: 7.25, t: 1.5, priceMult: 1.35 },
  "2x10": { label: "2×10", h: 9.25, t: 1.5, priceMult: 1.7 },
  "2x12": { label: "2×12", h: 11.25, t: 1.5, priceMult: 2.1 },
};

const MATERIALS = {
  cedar: { label: "Cedar", life: "15–20 years", ppf: 4.5, note: "Rot resistant untreated. The usual choice for food beds." },
  hemlock: { label: "Hemlock", life: "7–10 years", ppf: 2.25, note: "Rough-sawn from a local mill is often the best value." },
  spruce: { label: "Spruce / SPF", life: "4–6 years", ppf: 1.75, note: "Cheapest up front, but you rebuild sooner." },
  pt: { label: "Pressure treated", life: "20+ years", ppf: 2.0, note: "Copper-based since CCA was dropped for residential use in 2004. Widely considered fine for beds; some gardeners still line the inner face." },
  composite: { label: "Composite", life: "25+ years", ppf: 7.5, note: "No rot, no splinters, highest up-front cost." },
};

const STOCK_LENGTHS = [8, 10, 12, 16];
const KERF = 0.125;
/* A saw kerf comes out of the middle of a cut, so an 8 ft and a 4 ft piece do
   come out of a 12 ft board — one just finishes an eighth short. Allow for that
   rather than forcing an extra board. */
const FIT_TOLERANCE = 0.5;

/* First-fit-decreasing: fit the cut pieces into stock boards of one length. */
function packPieces(pieces, stockFt) {
  const stockIn = stockFt * 12;
  const bars = [];
  const oversize = [];
  [...pieces].sort((a, b) => b.len - a.len).forEach((p) => {
    if (p.len > stockIn + FIT_TOLERANCE) { oversize.push(p); return; }
    let bar = bars.find((b) => b.used + p.len + (b.cuts.length ? KERF : 0) <= stockIn + FIT_TOLERANCE);
    if (!bar) { bar = { used: 0, cuts: [] }; bars.push(bar); }
    bar.used += p.len + (bar.cuts.length ? KERF : 0);
    bar.cuts.push(p);
  });
  return {
    bars, oversize, stockFt,
    totalFt: bars.length * stockFt,
    wasteIn: bars.reduce((n, b) => n + Math.max(0, stockIn - b.used), 0),
  };
}

/* Try every stock length, keep whichever wastes least. */
function bestPack(pieces) {
  if (!pieces.length) return null;
  let best = null;
  STOCK_LENGTHS.forEach((L) => {
    const r = packPieces(pieces, L);
    if (r.oversize.length) return;
    if (!best || r.totalFt < best.totalFt || (r.totalFt === best.totalFt && r.bars.length < best.bars.length)) best = r;
  });
  return best ?? packPieces(pieces, Math.max(...STOCK_LENGTHS));
}

/* Everything one bed needs. */
function bedBuild(bed, opts) {
  const board = BOARDS[opts.board];
  const depth = bed.depth ?? 12;
  const courses = Math.max(1, Math.round(depth / board.h));
  const wallIn = courses * board.h;

  const longFt = Math.max(bed.w, bed.l);
  const shortFt = Math.min(bed.w, bed.l);
  // Long boards run the full run; short boards fit between them.
  const longIn = longFt * 12;
  const shortIn = shortFt * 12 - (opts.posts ? 0 : 2 * board.t);

  const pieces = [];
  for (let c = 0; c < courses; c++) {
    pieces.push({ len: longIn, label: `${bed.name} · side`, bed: bed.id });
    pieces.push({ len: longIn, label: `${bed.name} · side`, bed: bed.id });
    pieces.push({ len: shortIn, label: `${bed.name} · end`, bed: bed.id });
    pieces.push({ len: shortIn, label: `${bed.name} · end`, bed: bed.id });
  }

  const postLenIn = opts.posts ? wallIn + 10 : 0;
  const screws = courses * 4 * (opts.posts ? 4 : 2);
  const fabricSqFt = bed.w * bed.l;
  const soilCuFt = bed.w * bed.l * (wallIn / 12);

  return { bed, courses, wallIn, pieces, longIn, shortIn, postLenIn, screws, fabricSqFt, soilCuFt };
}

const inchesToFtIn = (v) => {
  const f = Math.floor(v / 12);
  const i = Math.round((v - f * 12) * 8) / 8;
  if (f === 0) return `${i}"`;
  return i === 0 ? `${f}'` : `${f}' ${i}"`;
};
/* ---------- date helpers ---------- */
const MS_DAY = 86400000;
const addDays = (d, n) => new Date(d.getTime() + n * MS_DAY);
const addWeeks = (d, n) => addDays(d, n * 7);
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const fmtDate = (d) => `${MONTHS[d.getMonth()]} ${d.getDate()}`;
const toISO = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const fromISO = (s) => {
  const [y, m, dd] = s.split("-").map(Number);
  return new Date(y, m - 1, dd);
};
const dayOfYear = (d) => Math.floor((d - new Date(d.getFullYear(), 0, 0)) / MS_DAY);

/* Builds a downloadable .ics file from a list of {d, text, kind} tasks —
   opens in Apple Calendar, Google Calendar, Outlook, anything that reads iCal.
   All-day events, one alarm the morning of, in the browser's local time. */
function buildICS(tasks, calName) {
  const pad = (n) => String(n).padStart(2, "0");
  const stamp = (d) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
  const nowStamp = stamp(new Date()) + "T000000Z";
  const escapeText = (t) => String(t).replace(/([,;])/g, "\\$1");

  const events = tasks.map((t, i) => {
    const start = stamp(t.d);
    const endD = addDays(t.d, 1); // all-day events are exclusive of the end date in iCal
    const end = stamp(endD);
    return [
      "BEGIN:VEVENT",
      `UID:orto-${start}-${i}-${Math.random().toString(36).slice(2, 8)}@garden`,
      `DTSTAMP:${nowStamp}`,
      `DTSTART;VALUE=DATE:${start}`,
      `DTEND;VALUE=DATE:${end}`,
      `SUMMARY:${escapeText(t.text)}`,
      "END:VEVENT",
    ].join("\r\n");
  });

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Orto Garden Planner//EN",
    "CALSCALE:GREGORIAN",
    `X-WR-CALNAME:${escapeText(calName)}`,
    ...events,
    "END:VCALENDAR",
  ].join("\r\n");
}

function downloadICS(tasks, calName, filename) {
  const ics = buildICS(tasks, calName);
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const FROST_BUFFER = { hardy: 21, "half-hardy": 7, tender: 0 };

/* Work out every date that matters for one crop in a given season. */
function cropSchedule(crop, lastFrost, firstFrost) {
  const out = { crop, indoors: null, setOut: null, sow: null, harvestStart: null, harvestEnd: null, successions: [] };

  if (crop.fallPlanted) {
    const y = lastFrost.getFullYear();
    out.sow = new Date(y - 1, 9, 15);
    out.harvestStart = new Date(y, 6, 18);
    out.harvestEnd = new Date(y, 7, 2);
    out.fallPlanted = true;
    return out;
  }

  let anchor;
  if (crop.indoors != null) {
    out.indoors = addWeeks(lastFrost, crop.indoors);
    out.setOut = addWeeks(lastFrost, crop.transplant ?? 1);
    anchor = out.setOut;
  } else if (crop.direct != null) {
    out.sow = addWeeks(lastFrost, crop.direct);
    anchor = out.sow;
  } else {
    out.setOut = addWeeks(lastFrost, crop.transplant ?? 0);
    anchor = out.setOut;
  }

  const cutoff = addDays(firstFrost, FROST_BUFFER[crop.tender] ?? 0);

  if (crop.harvestWindow) {
    // Perennials crop on their own calendar, not from a sowing date.
    const y = lastFrost.getFullYear();
    const [[sm, sd], [em, ed]] = crop.harvestWindow;
    out.harvestStart = new Date(y, sm, sd);
    out.harvestEnd = new Date(y, em, ed);
    out.perennial = true;
  } else {
    out.harvestStart = addDays(anchor, crop.dtm);
    out.harvestEnd = addDays(out.harvestStart, crop.harvestSpan ?? 21);
    if (out.harvestEnd > cutoff) out.harvestEnd = cutoff;
  }

  if (crop.succession && crop.direct != null) {
    // Cool-season crops bolt in a Hamilton July, so skip that stretch.
    const y = lastFrost.getFullYear();
    const heatFrom = new Date(y, 5, 18), heatTo = new Date(y, 7, 1);
    let s = addDays(out.sow, crop.succession);
    let guard = 0;
    while (addDays(s, crop.dtm) <= cutoff && guard < 16) {
      if (!(crop.heatSensitive && s >= heatFrom && s <= heatTo)) out.successions.push(new Date(s));
      s = addDays(s, crop.succession);
      guard++;
    }
  }
  return out;
}

/* ---------- storage ---------- */
const LEGACY_KEY = "orto-garden-v1";       // the old single-garden save
const INDEX_KEY = "orto-designs-index";     // [{id, name, updatedAt, createdAt}]
const CURRENT_KEY = "orto-current-design";  // which design id was open last
const designKey = (id) => `orto-design:${id}`;
const newDesignId = () => "d" + Math.random().toString(36).slice(2, 10);

async function loadIndex() {
  try {
    const r = await window.storage.get(INDEX_KEY);
    return r && r.value ? JSON.parse(r.value) : [];
  } catch {
    return [];
  }
}
async function saveIndex(list) {
  try { await window.storage.set(INDEX_KEY, JSON.stringify(list)); return true; } catch { return false; }
}
async function loadDesignData(id) {
  try {
    const r = await window.storage.get(designKey(id));
    return r && r.value ? JSON.parse(r.value) : null;
  } catch {
    return null;
  }
}
async function saveDesignData(id, data) {
  try { await window.storage.set(designKey(id), JSON.stringify(data)); return true; } catch { return false; }
}
async function loadCurrentId() {
  try {
    const r = await window.storage.get(CURRENT_KEY);
    return r && r.value ? r.value : null;
  } catch {
    return null;
  }
}
async function saveCurrentId(id) {
  try { await window.storage.set(CURRENT_KEY, id); return true; } catch { return false; }
}
async function deleteDesignData(id) {
  try { await window.storage.delete(designKey(id)); return true; } catch { return false; }
}
/* The very first version of this app saved one garden under a fixed key.
   If that's all a person has, fold it into the new multi-design index once,
   under a name that says what it is rather than losing it silently. */
async function loadLegacy() {
  try {
    const r = await window.storage.get(LEGACY_KEY);
    return r && r.value ? JSON.parse(r.value) : null;
  } catch {
    return null;
  }
}

const blankCells = (w, l) => Array(w * l).fill(null);

/* A genuinely empty canvas — for "start from scratch," as opposed to
   makeInitialState() below, which seeds a first-time design with a
   working example layout so new users have something to look at. */
function makeBlankState() {
  return {
    beds: [],
    features: [],
    plantings: [],
    measures: [],
    yard: { w: 30, d: 30, edges: { north: "fence", east: "fence", south: "fence", west: "fence" }, northAngle: 0 },
    plans: { [new Date().getFullYear()]: {} },
    seeds: [],
    customCrops: [],
    taskDone: {},
    build: { board: "2x6", material: "cedar", posts: true, fabric: true, ppf: MATERIALS.cedar.ppf },
    frost: {},
  };
}

function makeInitialState() {
  const year = new Date().getFullYear();
  const plan = {};
  DEFAULT_BEDS.forEach((b) => {
    plan[b.id] = blankCells(b.w, b.l);
  });
  return {
    beds: DEFAULT_BEDS.map((b) => ({ ...b })),
    features: DEFAULT_FEATURES.map((f) => ({ ...f })),
    plantings: [],
    measures: [],
    yard: { ...DEFAULT_YARD, edges: { ...DEFAULT_YARD.edges } },
    plans: { [year]: plan },
    seeds: [],
    build: { board: "2x6", material: "cedar", posts: true, fabric: true, ppf: MATERIALS.cedar.ppf },
    frost: {},
  };
}

/* Plans saved before the yard view existed have no coordinates — lay them out. */
function migrate(s) {
  const next = { ...s };
  next.yard = { ...DEFAULT_YARD, ...(s.yard || {}), edges: { ...DEFAULT_YARD.edges, ...(s.yard?.edges || {}) }, northAngle: s.yard?.northAngle ?? 0 };
  next.features = s.features ?? DEFAULT_FEATURES.map((f) => ({ ...f }));
  next.seeds = s.seeds ?? [];
  next.plantings = s.plantings ?? [];
  next.measures = s.measures ?? [];
  next.build = { board: "2x6", material: "cedar", posts: true, fabric: true, ppf: MATERIALS.cedar.ppf, ...(s.build || {}) };
  next.customCrops = s.customCrops ?? [];
  next.taskDone = s.taskDone ?? {};
  let cursorX = 1, cursorY = 1, rowDeep = 0;
  next.beds = (s.beds || []).map((b) => {
    if (typeof b.x === "number" && typeof b.y === "number") {
      return { depth: 12, rot: 0, ...b };
    }
    const seed = DEFAULT_BEDS.find((d) => d.id === b.id);
    if (seed) return { depth: 12, ...b, x: seed.x, y: seed.y, rot: seed.rot };
    if (cursorX + b.w > next.yard.w - 1) { cursorX = 1; cursorY += rowDeep + 2; rowDeep = 0; }
    const placed = { depth: 12, rot: 0, ...b, x: cursorX, y: cursorY };
    cursorX += b.w + 2;
    rowDeep = Math.max(rowDeep, b.l);
    return placed;
  });
  return next;
}

const defaultFrost = (year) => ({ last: `${year}-05-08`, first: `${year}-10-10` });

/* ============================================================ */

export default function GardenPlanner() {
  const [state, setStateRaw] = useState(null);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  /* Every mutation in this file already calls `setState`, so wrapping it here
     gives history tracking for free without touching each call site.
     History is capped at 50 steps to keep it cheap — this data is small. */
  const setState = useCallback((updater) => {
    setStateRaw((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      if (prev) setUndoStack((u) => [...u, prev].slice(-50));
      setRedoStack([]);
      return next;
    });
  }, []);

  const undo = useCallback(() => {
    setUndoStack((u) => {
      if (!u.length) return u;
      const prevState = u[u.length - 1];
      setStateRaw((cur) => { setRedoStack((r) => [...r, cur].slice(-50)); return prevState; });
      return u.slice(0, -1);
    });
  }, []);

  const redo = useCallback(() => {
    setRedoStack((r) => {
      if (!r.length) return r;
      const nextState = r[r.length - 1];
      setStateRaw((cur) => { setUndoStack((u) => [...u, cur].slice(-50)); return nextState; });
      return r.slice(0, -1);
    });
  }, []);

  /* Cmd/Ctrl+Z undoes, Cmd/Ctrl+Shift+Z or Cmd/Ctrl+Y redoes — everywhere in the app,
     not just the Yard tab. Ignored while typing, so it never fights a text field. */
  useEffect(() => {
    const onKey = (e) => {
      const t = document.activeElement?.tagName;
      if (t === "INPUT" || t === "TEXTAREA" || t === "SELECT") return;
      const meta = e.metaKey || e.ctrlKey;
      if (!meta || e.key.toLowerCase() !== "z" && e.key.toLowerCase() !== "y") return;
      e.preventDefault();
      if (e.key.toLowerCase() === "y" || (e.key.toLowerCase() === "z" && e.shiftKey)) redo();
      else undo();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);
  const [status, setStatus] = useState("Opening your plan…");
  const [designs, setDesigns] = useState([]);
  const [currentDesignId, setCurrentDesignId] = useState(null);
  const [showDesigns, setShowDesigns] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear());
  const [tab, setTab] = useState("plot");
  const [activeBed, setActiveBed] = useState("b1");
  const [brush, setBrush] = useState("tomato");
  const [search, setSearch] = useState("");
  const [showBedForm, setShowBedForm] = useState(false);
  const [openCropInfo, setOpenCropInfo] = useState(null);
  const [showCropForm, setShowCropForm] = useState(false);
  const painting = useRef(false);
  const saveTimer = useRef(null);

  /* --- boot --- */
  useEffect(() => {
    let alive = true;
    (async () => {
      let index = await loadIndex();

      if (index.length === 0) {
        const legacy = await loadLegacy();
        const id = newDesignId();
        const now = Date.now();
        const data = legacy && legacy.beds ? migrate(legacy) : makeInitialState();
        await saveDesignData(id, data);
        index = [{ id, name: legacy ? "My Garden" : "My Garden", updatedAt: now, createdAt: now }];
        await saveIndex(index);
        await saveCurrentId(id);
      }
      if (!alive) return;

      let curId = await loadCurrentId();
      if (!curId || !index.find((d) => d.id === curId)) {
        curId = index.slice().sort((a, b) => b.updatedAt - a.updatedAt)[0]?.id ?? null;
      }
      const data = curId ? await loadDesignData(curId) : null;
      if (!alive) return;

      setDesigns(index);
      setCurrentDesignId(curId);
      const loaded = data ? migrate(data) : makeInitialState();
      (loaded.customCrops || []).forEach(registerCustomCrop);
      setState(loaded);
      setStatus("");
    })();
    return () => { alive = false; };
  }, []);

  /* --- debounced autosave --- */
  useEffect(() => {
    if (!state || !currentDesignId) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const ok = await saveDesignData(currentDesignId, state);
      if (ok) {
        setDesigns((ds) => {
          const next = ds.map((d) => (d.id === currentDesignId ? { ...d, updatedAt: Date.now() } : d));
          saveIndex(next);
          return next;
        });
      }
      setStatus(ok ? "Saved" : "Couldn't save — changes stay for this session only");
      if (ok) setTimeout(() => setStatus(""), 1400);
    }, 700);
    return () => clearTimeout(saveTimer.current);
  }, [state, currentDesignId]);

  useEffect(() => {
    const up = () => { painting.current = false; };
    window.addEventListener("pointerup", up);
    return () => window.removeEventListener("pointerup", up);
  }, []);

  const beds = state?.beds ?? [];
  const yard = state?.yard ?? DEFAULT_YARD;
  const plan = state?.plans?.[year] ?? {};
  const frost = state?.frost?.[year] ?? defaultFrost(year);
  const lastFrost = fromISO(frost.last);
  const firstFrost = fromISO(frost.first);
  const prevPlan = state?.plans?.[year - 1] ?? {};

  const ensureYear = useCallback((y) => {
    setState((s) => {
      if (s.plans[y]) return s;
      const p = {};
      s.beds.forEach((b) => { p[b.id] = blankCells(b.w, b.l); });
      return { ...s, plans: { ...s.plans, [y]: p } };
    });
  }, []);

  useEffect(() => { if (state) ensureYear(year); }, [year, state, ensureYear]);

  /* --- mutations --- */
  const paintCell = (bedId, idx) => {
    setState((s) => {
      const p = { ...(s.plans[year] || {}) };
      const bed = s.beds.find((b) => b.id === bedId);
      const cells = (p[bedId] || blankCells(bed.w, bed.l)).slice();
      const next = brush === "__erase" ? null : brush;
      if (cells[idx] === next) return s;
      cells[idx] = next;
      p[bedId] = cells;
      return { ...s, plans: { ...s.plans, [year]: p } };
    });
  };

  const fillBed = (bedId) => {
    setState((s) => {
      const bed = s.beds.find((b) => b.id === bedId);
      const p = { ...(s.plans[year] || {}) };
      p[bedId] = Array(bed.w * bed.l).fill(brush === "__erase" ? null : brush);
      return { ...s, plans: { ...s.plans, [year]: p } };
    });
  };

  const clearBed = (bedId) => {
    setState((s) => {
      const bed = s.beds.find((b) => b.id === bedId);
      const p = { ...(s.plans[year] || {}) };
      p[bedId] = blankCells(bed.w, bed.l);
      return { ...s, plans: { ...s.plans, [year]: p } };
    });
  };

  const addBed = (name, w, l, note) => {
    const id = "b" + Math.random().toString(36).slice(2, 8);
    setState((s) => {
      const plans = { ...s.plans };
      Object.keys(plans).forEach((y) => { plans[y] = { ...plans[y], [id]: blankCells(w, l) }; });
      // drop it in the first spot that doesn't sit on anything else
      let spot = { x: 1, y: 1 };
      outer: for (let yy = 1; yy <= s.yard.d - l; yy += 0.5) {
        for (let xx = 1; xx <= s.yard.w - w; xx += 0.5) {
          const cand = { x: xx, y: yy, w, d: l };
          const clash = s.beds.some((b) => gapBetween(cand, { ...bedFootprint(b), x: b.x, y: b.y }).overlap);
          if (!clash) { spot = { x: xx, y: yy }; break outer; }
        }
      }
      return { ...s, beds: [...s.beds, { id, name, w, l, note, depth: 12, rot: 0, ...spot }], plans };
    });
    setActiveBed(id);
    setShowBedForm(false);
  };

  const moveBed = (id, x, y) => setState((s) => ({ ...s, beds: s.beds.map((b) => (b.id === id ? { ...b, x, y } : b)) }));
  const rotateBed = (id) => setState((s) => ({ ...s, beds: s.beds.map((b) => (b.id === id ? { ...b, rot: b.rot === 90 ? 0 : 90 } : b)) }));
  const setYard = (patch) => setState((s) => ({ ...s, yard: { ...s.yard, ...patch } }));
  const setEdge = (side, kind) => setState((s) => ({ ...s, yard: { ...s.yard, edges: { ...s.yard.edges, [side]: kind } } }));
  const moveFeature = (id, x, y) => setState((s) => ({ ...s, features: s.features.map((f) => (f.id === id ? { ...f, x, y } : f)) }));
  const addFeature = (kind) => setState((s) => {
    const k = FEATURE_KINDS[kind];
    return {
      ...s,
      features: [...s.features, {
        id: "f" + Math.random().toString(36).slice(2, 8),
        kind, name: k.label, x: 1, y: 1, w: k.w ?? 6, d: k.d ?? 4,
      }],
    };
  });

  /* --- perennial fruit --- */
  const addPlanting = (speciesId) => setState((s) => {
    const sp = BUSHES[speciesId];
    return {
      ...s,
      plantings: [...(s.plantings || []), {
        id: "p" + Math.random().toString(36).slice(2, 8),
        speciesId, variety: "", planted: new Date().getFullYear(),
        x: 1, y: 1, w: sp.spread, notes: "",
      }],
    };
  });
  const updatePlanting = (id, patch) => setState((s) => ({ ...s, plantings: s.plantings.map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
  const removePlanting = (id) => setState((s) => ({ ...s, plantings: s.plantings.filter((x) => x.id !== id) }));
  const movePlanting = (id, x, y) => setState((s) => ({ ...s, plantings: s.plantings.map((p) => (p.id === id ? { ...p, x, y } : p)) }));

  /* --- kept measurements --- */
  const addMeasure = (points, label) => setState((s) => ({
    ...s,
    measures: [...(s.measures || []), { id: "m" + Math.random().toString(36).slice(2, 8), points, label: label || "" }],
  }));
  const removeMeasure = (id) => setState((s) => ({ ...s, measures: (s.measures || []).filter((m) => m.id !== id) }));

  /* --- design management: multiple saved gardens, switchable --- */
  const openDesign = async (id) => {
    if (id === currentDesignId) return;
    setStatus("Opening…");
    const data = await loadDesignData(id);
    setCurrentDesignId(id);
    const loaded = data ? migrate(data) : makeInitialState();
    (loaded.customCrops || []).forEach(registerCustomCrop);
    setStateRaw(loaded);
    setUndoStack([]); setRedoStack([]);      // undo history doesn't cross designs
    await saveCurrentId(id);
    setStatus("");
    setShowDesigns(false);
  };

  const createDesign = async (name, blank) => {
    const id = newDesignId();
    const now = Date.now();
    const data = blank ? makeBlankState() : (state ? JSON.parse(JSON.stringify(state)) : makeInitialState());
    await saveDesignData(id, data);
    const entry = { id, name: name.trim() || "New design", updatedAt: now, createdAt: now };
    const next = [...designs, entry];
    setDesigns(next);
    await saveIndex(next);
    await openDesign(id);
  };

  const renameDesign = async (id, name) => {
    const next = designs.map((d) => (d.id === id ? { ...d, name: name.trim() || d.name } : d));
    setDesigns(next);
    await saveIndex(next);
  };

  const deleteDesign = async (id) => {
    if (designs.length <= 1) return; // always keep at least one
    const next = designs.filter((d) => d.id !== id);
    setDesigns(next);
    await saveIndex(next);
    await deleteDesignData(id);
    if (id === currentDesignId) {
      const fallback = next.slice().sort((a, b) => b.updatedAt - a.updatedAt)[0];
      if (fallback) await openDesign(fallback.id);
    }
  };

  const updateMeasureLabel = (id, label) => setState((s) => ({
    ...s, measures: (s.measures || []).map((m) => (m.id === id ? { ...m, label } : m)),
  }));
  const updateMeasurePoint = (id, pointIndex, pt) => setState((s) => ({
    ...s,
    measures: (s.measures || []).map((m) =>
      m.id === id ? { ...m, points: m.points.map((p, i) => (i === pointIndex ? { x: pt.x, y: pt.y, on: pt.on } : p)) } : m
    ),
  }));

  /* --- duplicating things --- */
  const duplicateBed = (id) => setState((s) => {
    const src = s.beds.find((b) => b.id === id);
    if (!src) return s;
    const fp = bedFootprint(src);
    const nx = Math.min(Math.max(0, src.x + 1), Math.max(0, s.yard.w - fp.w));
    const ny = Math.min(Math.max(0, src.y + 1), Math.max(0, s.yard.d - fp.d));
    const newId = "b" + Math.random().toString(36).slice(2, 8);
    const beds = [...s.beds, { ...src, id: newId, name: src.name + " copy", x: nx, y: ny }];
    const plans = { ...s.plans };
    Object.keys(plans).forEach((y) => { plans[y] = { ...plans[y], [newId]: (plans[y][id] || blankCells(src.w, src.l)).slice() }; });
    return { ...s, beds, plans };
  });
  const duplicateFeature = (id) => setState((s) => {
    const src = s.features.find((f) => f.id === id);
    if (!src) return s;
    const nx = Math.min(Math.max(-src.w / 2, src.x + 1), s.yard.w - src.w / 2);
    const ny = Math.min(Math.max(-src.d / 2, src.y + 1), s.yard.d - src.d / 2);
    return { ...s, features: [...s.features, { ...src, id: "f" + Math.random().toString(36).slice(2, 8), name: src.name + " copy", x: nx, y: ny }] };
  });
  const duplicatePlanting = (id) => setState((s) => {
    const src = s.plantings.find((p) => p.id === id);
    if (!src) return s;
    const nx = Math.min(Math.max(-src.w / 2, src.x + 1), s.yard.w - src.w / 2);
    const ny = Math.min(Math.max(-src.w / 2, src.y + 1), s.yard.d - src.w / 2);
    return { ...s, plantings: [...s.plantings, { ...src, id: "p" + Math.random().toString(36).slice(2, 8), x: nx, y: ny }] };
  });
  const duplicateMeasure = (id) => setState((s) => {
    const src = (s.measures || []).find((m) => m.id === id);
    if (!src) return s;
    const points = src.points.map((pt) => ({ ...pt, x: pt.x + 1, y: pt.y + 1, on: null }));
    return { ...s, measures: [...(s.measures || []), { ...src, id: "m" + Math.random().toString(36).slice(2, 8), points }] };
  });
  const updateFeature = (id, patch) => setState((s) => ({ ...s, features: s.features.map((f) => (f.id === id ? { ...f, ...patch } : f)) }));
  const removeFeature = (id) => setState((s) => ({ ...s, features: s.features.filter((f) => f.id !== id) }));

  /* --- seed inventory --- */
  /* --- custom crops --- */
  const addCustomCrop = (crop) => {
    registerCustomCrop(crop);
    setState((s) => ({ ...s, customCrops: [...(s.customCrops || []).filter((c) => c.id !== crop.id), crop] }));
  };
  const removeCustomCrop = (id) => {
    setState((s) => ({ ...s, customCrops: (s.customCrops || []).filter((c) => c.id !== id) }));
    const idx = CROPS.findIndex((c) => c.id === id);
    if (idx >= 0) CROPS.splice(idx, 1);
    delete CROP_BY_ID[id];
  };

  /* --- task checklist --- */
  const toggleTaskDone = (yr, key) => setState((s) => {
    const yearMap = { ...(s.taskDone?.[yr] || {}) };
    if (yearMap[key]) delete yearMap[key]; else yearMap[key] = true;
    return { ...s, taskDone: { ...s.taskDone, [yr]: yearMap } };
  });

  const addSeed = (entry) => setState((s) => ({
    ...s,
    seeds: [...(s.seeds || []), { id: "s" + Math.random().toString(36).slice(2, 8), tests: [], ...entry }],
  }));
  const updateSeed = (id, patch) => setState((s) => ({ ...s, seeds: s.seeds.map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
  const removeSeed = (id) => setState((s) => ({ ...s, seeds: s.seeds.filter((x) => x.id !== id) }));
  const addSeedTest = (id, date, rate) => setState((s) => ({
    ...s,
    seeds: s.seeds.map((x) => (x.id === id ? { ...x, tests: [...(x.tests || []), { date, rate }] } : x)),
  }));

  const setBuild = (patch) => setState((s) => ({ ...s, build: { ...s.build, ...patch } }));

  const updateBed = (id, patch) => {
    setState((s) => {
      const beds = s.beds.map((b) => (b.id === id ? { ...b, ...patch } : b));
      const nb = beds.find((b) => b.id === id);
      const plans = { ...s.plans };
      Object.keys(plans).forEach((y) => {
        const old = plans[y][id] || [];
        const oldBed = s.beds.find((b) => b.id === id);
        const next = blankCells(nb.w, nb.l);
        for (let r = 0; r < Math.min(oldBed.l, nb.l); r++)
          for (let c = 0; c < Math.min(oldBed.w, nb.w); c++)
            next[r * nb.w + c] = old[r * oldBed.w + c] ?? null;
        plans[y] = { ...plans[y], [id]: next };
      });
      return { ...s, beds, plans };
    });
  };

  const removeBed = (id) => {
    setState((s) => {
      const beds = s.beds.filter((b) => b.id !== id);
      const plans = { ...s.plans };
      Object.keys(plans).forEach((y) => {
        const copy = { ...plans[y] };
        delete copy[id];
        plans[y] = copy;
      });
      return { ...s, beds, plans };
    });
    setActiveBed((cur) => (cur === id ? (beds.find((b) => b.id !== id)?.id ?? null) : cur));
  };

  const setFrost = (which, value) => {
    setState((s) => ({ ...s, frost: { ...s.frost, [year]: { ...(s.frost[year] ?? defaultFrost(year)), [which]: value } } }));
  };

  /* --- derived --- */
  const bed = beds.find((b) => b.id === activeBed) ?? beds[0];
  const cells = bed ? plan[bed.id] ?? blankCells(bed.w, bed.l) : [];

  const bedTally = useMemo(() => {
    const t = {};
    cells.forEach((c) => { if (c) t[c] = (t[c] || 0) + 1; });
    return Object.entries(t)
      .map(([id, sq]) => ({ crop: CROP_BY_ID[id], sqft: sq, plants: Math.max(1, Math.round(sq * CROP_BY_ID[id].perSqFt)) }))
      .sort((a, b) => b.sqft - a.sqft);
  }, [cells]);

  const pairNotes = useMemo(() => {
    const ids = bedTally.map((t) => t.crop.id);
    const bad = [], good = [];
    for (let i = 0; i < ids.length; i++)
      for (let j = i + 1; j < ids.length; j++) {
        const a = CROP_BY_ID[ids[i]], b = CROP_BY_ID[ids[j]];
        if (a.anti.includes(b.id) || b.anti.includes(a.id)) bad.push([a, b]);
        else if (a.comp.includes(b.id) || b.comp.includes(a.id)) good.push([a, b]);
      }
    return { bad, good };
  }, [bedTally]);

  /* A workable four-step rotation: nitrogen fixers, then heavy leaf feeders,
     then light feeders, then hungry fruiting crops, then back to the start.
     Matches the guidance already given in the Ledger tab. */
  const ROTATION_GROUPS = [
    { fams: ["legume"], label: "Legumes" },
    { fams: ["brassica"], label: "Brassicas" },
    { fams: ["allium", "umbellifer"], label: "Alliums or umbellifers" },
    { fams: ["nightshade", "cucurbit"], label: "Nightshades or cucurbits" },
  ];
  const groupOf = (fam) => ROTATION_GROUPS.find((g) => g.fams.includes(fam));

  const lastYear = useMemo(() => {
    if (!bed) return null;
    const prev = prevPlan[bed.id] ?? [];
    const names = [...new Set(prev.filter(Boolean).map((id) => CROP_BY_ID[id]?.name).filter(Boolean))];
    if (!names.length) return null;
    const fams = [...new Set(prev.filter(Boolean).map((id) => CROP_BY_ID[id]?.fam).filter(Boolean))];
    const groups = [...new Set(fams.map(groupOf).filter(Boolean))];
    const suggestion = groups.length === 1 ? ROTATION_GROUPS[(ROTATION_GROUPS.indexOf(groups[0]) + 1) % ROTATION_GROUPS.length] : null;
    return { names, suggestion };
  }, [bed, prevPlan]);

  const rotationNotes = useMemo(() => {
    if (!bed) return [];
    const prev = prevPlan[bed.id] ?? [];
    const prevFams = new Set(prev.filter(Boolean).map((id) => CROP_BY_ID[id]?.fam).filter(Boolean));
    const notes = [];
    const seen = new Set();
    bedTally.forEach(({ crop }) => {
      if (seen.has(crop.fam)) return;
      seen.add(crop.fam);
      if (prevFams.has(crop.fam) && crop.fam !== "perennial" && crop.fam !== "herb")
        notes.push({ fam: crop.fam, repeat: true });
    });
    return notes;
  }, [bed, prevPlan, bedTally]);

  const allPlanted = useMemo(() => {
    const set = new Set();
    Object.values(plan).forEach((arr) => (arr || []).forEach((c) => c && set.add(c)));
    return CROPS.filter((c) => set.has(c.id));
  }, [plan]);

  const gardenTally = useMemo(() => {
    const t = {};
    Object.values(plan).forEach((arr) => (arr || []).forEach((c) => { if (c) t[c] = (t[c] || 0) + 1; }));
    return t;
  }, [plan]);

  const schedules = useMemo(
    () => allPlanted.map((c) => cropSchedule(c, lastFrost, firstFrost)).sort((a, b) => {
      const ka = a.indoors ?? a.sow ?? a.setOut, kb = b.indoors ?? b.sow ?? b.setOut;
      return ka - kb;
    }),
    [allPlanted, frost.last, frost.first]
  );

  const filteredCrops = useMemo(() => {
    const q = search.trim().toLowerCase();
    return CROPS.filter((c) => !q || c.name.toLowerCase().includes(q));
  }, [search, state?.customCrops]);

  const years = useMemo(() => {
    const ys = new Set(Object.keys(state?.plans ?? {}).map(Number));
    ys.add(new Date().getFullYear());
    return [...ys].sort();
  }, [state]);

  if (!state) {
    return (
      <div className="orto min-h-screen flex items-center justify-center">
        <Styles />
        <p className="mono text-sm" style={{ color: "var(--ink-soft)" }}>{status}</p>
      </div>
    );
  }

  const totalSqFt = beds.reduce((n, b) => n + b.w * b.l, 0);
  const plantedSqFt = Object.values(plan).reduce((n, arr) => n + (arr || []).filter(Boolean).length, 0);

  return (
    <div className="orto min-h-screen">
      <Styles />

      {/* ---------- masthead ---------- */}
      <header className="orto-head">
        <div className="orto-head-inner">
          <div>
            <h1 className="orto-title">
              <svg className="orto-logo" viewBox="0 0 100 100" aria-hidden="true">
                <path d="M50 84 L50 46" stroke="currentColor" strokeWidth="7" strokeLinecap="round" fill="none" />
                <path d="M50 60 C 34 60, 26 48, 26 32 C 42 32, 50 44, 50 60 Z" fill="currentColor" />
                <path d="M50 52 C 66 52, 74 40, 74 24 C 58 24, 50 36, 50 52 Z" fill="currentColor" />
              </svg>
              Orto
            </h1>
            <button className="orto-designbtn" onClick={() => setShowDesigns((v) => !v)}>
              {designs.find((d) => d.id === currentDesignId)?.name || "My Garden"}
              <span className="mono orto-designcount">{designs.length > 1 ? `· ${designs.length} designs` : ""}</span>
              <span className="orto-caret">▾</span>
            </button>
            {showDesigns && (
              <DesignSwitcher
                designs={designs}
                currentId={currentDesignId}
                onOpen={openDesign}
                onCreate={createDesign}
                onRename={renameDesign}
                onDelete={deleteDesign}
                onClose={() => setShowDesigns(false)}
              />
            )}
            <p className="orto-sub">Kitchen garden plan · Hamilton, zone 6b</p>
          </div>
          <div className="orto-head-meta mono">
            <label className="orto-year">
              Season
              <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
                {!years.includes(Math.max(...years) + 1) && (
                  <option value={Math.max(...years) + 1}>{Math.max(...years) + 1}</option>
                )}
              </select>
            </label>
            <span className="orto-stat">{plantedSqFt}<i>/{totalSqFt} sq ft planted</i></span>
            <div className="orto-undoredo">
              <button onClick={undo} disabled={!undoStack.length} title="Undo (⌘/Ctrl+Z)">↶</button>
              <button onClick={redo} disabled={!redoStack.length} title="Redo (⌘/Ctrl+Shift+Z)">↷</button>
            </div>
            <span className="orto-save">{status}</span>
          </div>
        </div>
        <nav className="orto-tabs">
          {[["yard", "Yard"], ["build", "Build"], ["plot", "Plot"], ["season", "Season"], ["seeds", "Seeds"], ["ledger", "Ledger"], ["summary", "Summary"]].map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)} className={tab === k ? "on" : ""}>{label}</button>
          ))}
        </nav>
      </header>

      <main className="orto-main">
        {tab === "build" && (
          <BuildTab beds={beds} build={state.build} setBuild={setBuild} updateBed={updateBed} />
        )}

        {tab === "yard" && (
          <YardTab
            yard={state.yard}
            beds={beds}
            features={state.features}
            plantings={state.plantings || []}
            measures={state.measures || []}
            addMeasure={addMeasure}
            removeMeasure={removeMeasure}
            updateMeasureLabel={updateMeasureLabel}
            addPlanting={addPlanting}
            updatePlanting={updatePlanting}
            removePlanting={removePlanting}
            movePlanting={movePlanting}
            plan={plan}
            activeBed={activeBed}
            setActiveBed={setActiveBed}
            moveBed={moveBed}
            rotateBed={rotateBed}
            setYard={setYard}
            setEdge={setEdge}
            moveFeature={moveFeature}
            addFeature={addFeature}
            updateFeature={updateFeature}
            removeFeature={removeFeature}
            updateBed={updateBed}
            openPlot={() => setTab("plot")}
          />
        )}

        {tab === "plot" && bed && (
          <div className="orto-plot">
            {/* palette */}
            <aside className="orto-panel orto-palette">
              <h2 className="orto-h2">Plant palette</h2>
              <input
                className="orto-input"
                placeholder="Find a crop"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button className="orto-erase" style={{ borderStyle: "dashed" }} onClick={() => setShowCropForm((v) => !v)}>
                {showCropForm ? "Cancel" : "+ Add a crop not on the list"}
              </button>
              {showCropForm && (
                <CustomCropForm
                  onAdd={(crop) => { addCustomCrop(crop); setShowCropForm(false); setBrush(crop.id); }}
                  onCancel={() => setShowCropForm(false)}
                />
              )}
              <button
                className={"orto-erase " + (brush === "__erase" ? "on" : "")}
                onClick={() => setBrush("__erase")}
              >
                Clear squares
              </button>
              <div className="orto-palette-scroll">
                {Object.keys(FAMILY).map((famKey) => {
                  const list = filteredCrops.filter((c) => c.fam === famKey);
                  if (!list.length) return null;
                  return (
                    <div key={famKey} className="orto-famgroup">
                      <p className="orto-famlabel" style={{ color: FAMILY[famKey].color }}>
                        {FAMILY[famKey].label}
                      </p>
                      {list.map((c) => (
                        <div key={c.id}>
                          <div className="orto-chiprow">
                            <button
                              onClick={() => setBrush(c.id)}
                              className={"orto-chip " + (brush === c.id ? "on" : "")}
                              style={brush === c.id ? { borderColor: FAMILY[c.fam].color } : undefined}
                            >
                              <span className="orto-swatch" style={{ background: FAMILY[c.fam].color }} />
                              <span className="orto-chip-name">{c.name}</span>
                              <span className="mono orto-chip-n">{c.perSqFt >= 1 ? c.perSqFt : `1/${Math.round(1 / c.perSqFt)}`}</span>
                            </button>
                            <button
                              className={"orto-infobtn " + (openCropInfo === c.id ? "on" : "")}
                              onClick={() => setOpenCropInfo(openCropInfo === c.id ? null : c.id)}
                              title="Growing info"
                            >i</button>
                          </div>
                          {openCropInfo === c.id && (
                            <PlantInfoCard crop={c} schedule={cropSchedule(c, lastFrost, firstFrost)} />
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
              <p className="orto-fine">Number is plants per square foot.</p>
            </aside>

            {/* bed canvas */}
            <section className="orto-canvas">
              <div className="orto-bedbar">
                {beds.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setActiveBed(b.id)}
                    className={"orto-bedchip " + (b.id === activeBed ? "on" : "")}
                  >
                    {b.name}
                    <i className="mono">{b.w}×{b.l}</i>
                  </button>
                ))}
                <button className="orto-bedchip orto-add" onClick={() => setShowBedForm((v) => !v)}>+ Bed</button>
              </div>

              {showBedForm && <BedForm onAdd={addBed} onCancel={() => setShowBedForm(false)} />}

              <div className="orto-panel orto-bedwrap">
                <div className="orto-bedhead">
                  <div>
                    <h2 className="orto-h2">{bed.name}</h2>
                    <p className="orto-fine">{bed.note || "—"} · {bed.w} ft × {bed.l} ft · {bed.w * bed.l} sq ft</p>
                  </div>
                  <div className="orto-bedtools mono">
                    <button onClick={() => fillBed(bed.id)}>Fill bed</button>
                    <button onClick={() => clearBed(bed.id)}>Empty bed</button>
                    <BedEdit bed={bed} onSave={updateBed} onDelete={removeBed} canDelete={beds.length > 1} yard={yard} />
                  </div>
                </div>

                <div className="orto-gridscroll">
                  <div
                    className="orto-grid"
                    style={{ gridTemplateColumns: `repeat(${bed.w}, minmax(46px, 1fr))`, maxWidth: bed.w * 78 }}
                  >
                    {cells.map((cid, i) => {
                      const c = cid ? CROP_BY_ID[cid] : null;
                      return (
                        <button
                          key={i}
                          className="orto-cell"
                          style={c ? { background: FAMILY[c.fam].color, borderColor: FAMILY[c.fam].color } : undefined}
                          title={c ? `${c.name} — ${c.spacing}` : `Square ${i + 1}`}
                          onPointerDown={() => { painting.current = true; paintCell(bed.id, i); }}
                          onPointerEnter={() => { if (painting.current) paintCell(bed.id, i); }}
                        >
                          {c && (
                            <>
                              <span className="orto-cell-name">{c.name.split(" ")[0]}</span>
                              <span className="mono orto-cell-n">{c.perSqFt >= 1 ? c.perSqFt : "½"}</span>
                            </>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <p className="orto-fine">Each square is one square foot. Click or drag to plant.</p>
              </div>
            </section>

            {/* inspector */}
            <aside className="orto-panel orto-inspector">
              <h2 className="orto-h2">In this bed</h2>
              {lastYear && (
                <div className="orto-lastyear">
                  <p className="orto-fine"><strong>{year - 1}:</strong> {lastYear.names.join(", ")}</p>
                  {lastYear.suggestion ? (
                    <p className="orto-note ok">Rotate to {lastYear.suggestion.label.toLowerCase()} this year.</p>
                  ) : (
                    <p className="orto-fine">Mixed families last year — no single clean rotation step, just avoid repeating them here.</p>
                  )}
                </div>
              )}
              {bedTally.length === 0 && <p className="orto-empty">Nothing planted yet. Pick a crop on the left, then click squares.</p>}
              {bedTally.map(({ crop, sqft, plants }) => {
                const s = cropSchedule(crop, lastFrost, firstFrost);
                const open = openCropInfo === crop.id;
                return (
                  <div key={crop.id} className="orto-row">
                    <button className="orto-row-head orto-row-toggle" onClick={() => setOpenCropInfo(open ? null : crop.id)}>
                      <span className="orto-swatch" style={{ background: FAMILY[crop.fam].color }} />
                      <strong>{crop.name}</strong>
                      <span className="mono orto-count">{plants} {plants === 1 ? "plant" : "plants"}</span>
                      <span className="orto-chevron mono">{open ? "–" : "+"}</span>
                    </button>
                    <p className="orto-fine">{sqft} sq ft · {crop.spacing}</p>
                    <p className="mono orto-dates">
                      {s.fallPlanted
                        ? `Plant ${fmtDate(s.sow)} (fall) → harvest ${fmtDate(s.harvestStart)}`
                        : `${s.indoors ? `Start ${fmtDate(s.indoors)} → out ${fmtDate(s.setOut)}` : `Sow ${fmtDate(s.sow)}`} → ${crop.bloomer ? "bloom" : "pick"} ${fmtDate(s.harvestStart)}–${fmtDate(s.harvestEnd)}`}
                    </p>
                    {open && <PlantInfoCard crop={crop} schedule={s} />}
                  </div>
                );
              })}

              {(pairNotes.bad.length > 0 || pairNotes.good.length > 0 || rotationNotes.length > 0) && (
                <div className="orto-notes">
                  <h3 className="orto-h3">Worth knowing</h3>
                  {rotationNotes.map((n) => (
                    <p key={n.fam} className="orto-note warn">
                      {FAMILY[n.fam].label.toLowerCase()} grew here in {year - 1} too — move them if you can, or plan on feeding this bed.
                    </p>
                  ))}
                  {pairNotes.bad.map(([a, b], i) => (
                    <p key={"x" + i} className="orto-note warn">{a.name} and {b.name} are a poor pairing.</p>
                  ))}
                  {pairNotes.good.slice(0, 5).map(([a, b], i) => (
                    <p key={"o" + i} className="orto-note ok">{a.name} and {b.name} do well together.</p>
                  ))}
                  <p className="orto-fine orto-caveat">
                    Rotation advice is well supported. Companion pairings are traditional — treat them as a tiebreaker, not a rule.
                  </p>
                </div>
              )}
            </aside>
          </div>
        )}

        {tab === "season" && (
          <SeasonTab
            plantings={state.plantings || []}
            schedules={schedules}
            gardenTally={gardenTally}
            frost={frost}
            setFrost={setFrost}
            year={year}
            lastFrost={lastFrost}
            firstFrost={firstFrost}
            taskDone={state.taskDone?.[year] || {}}
            toggleTaskDone={(key) => toggleTaskDone(year, key)}
          />
        )}

        {tab === "seeds" && (
          <SeedsTab
            seeds={state.seeds || []}
            gardenTally={gardenTally}
            addSeed={addSeed}
            updateSeed={updateSeed}
            removeSeed={removeSeed}
            addSeedTest={addSeedTest}
            year={year}
            lastFrost={lastFrost}
            firstFrost={firstFrost}
          />
        )}

        {tab === "ledger" && (
          <LedgerTab beds={beds} plans={state.plans} year={year} />
        )}

        {tab === "summary" && (
          <SummaryTab
            beds={beds}
            yard={yard}
            build={state.build}
            seeds={state.seeds || []}
            gardenTally={gardenTally}
            schedules={schedules}
            plantings={state.plantings || []}
            year={year}
            frost={frost}
            lastFrost={lastFrost}
            firstFrost={firstFrost}
          />
        )}
      </main>
    </div>
  );
}

/* ============================================================
   Yard tab — the plot plan
   ============================================================ */

const SCALE = 22;   // px per foot in viewBox units
const PAD = 46;
const snapFt = (v) => Math.round(v * 2) / 2;

function YardTab({
  yard, beds, features, plantings, addPlanting, updatePlanting, removePlanting, movePlanting,
  measures, addMeasure, removeMeasure, updateMeasureLabel, updateMeasurePoint,
  duplicateBed, duplicateFeature, duplicatePlanting, duplicateMeasure, removeBed,
  plan, activeBed, setActiveBed, moveBed, rotateBed,
  setYard, setEdge, moveFeature, addFeature, updateFeature, removeFeature, updateBed, openPlot,
}) {
  const svgRef = useRef(null);
  const drag = useRef(null);
  const [selFeature, setSelFeature] = useState(null);
  const [selPlanting, setSelPlanting] = useState(null);
  const [selMeasure, setSelMeasure] = useState(null);
  const [confirmMeasureId, setConfirmMeasureId] = useState(null);
  const clipboard = useRef(null);
  const [showEdges, setShowEdges] = useState(false);
  const [palette, setPalette] = useState(null);
  const [tool, setTool] = useState("select");
  const [tape, setTape] = useState([]);          // committed points, in feet
  const [ghost, setGhost] = useState(null);      // live cursor point
  const today = new Date();

  /* Everything worth snapping a tape to: corners, centres, yard limits. */
  const snapTargets = useMemo(() => {
    const t = [];
    beds.forEach((b) => {
      const fp = bedFootprint(b);
      [[b.x, b.y], [b.x + fp.w, b.y], [b.x, b.y + fp.d], [b.x + fp.w, b.y + fp.d]].forEach(([x, y]) =>
        t.push({ x, y, what: b.name }));
    });
    features.forEach((f) => {
      const k = FEATURE_KINDS[f.kind] || {};
      if (k.shape === "circle") t.push({ x: f.x + f.w / 2, y: f.y + f.d / 2, what: f.name });
      else [[f.x, f.y], [f.x + f.w, f.y], [f.x, f.y + f.d], [f.x + f.w, f.y + f.d]].forEach(([x, y]) =>
        t.push({ x, y, what: f.name }));
    });
    plantings.forEach((p) => t.push({ x: p.x + p.w / 2, y: p.y + p.w / 2, what: BUSHES[p.speciesId]?.label ?? "planting" }));
    [[0, 0], [yard.w, 0], [0, yard.d], [yard.w, yard.d]].forEach(([x, y]) => t.push({ x, y, what: "yard corner" }));
    return t;
  }, [beds, features, plantings, yard]);

  const snap = useCallback((p) => {
    let best = null, bestD = 0.45;
    snapTargets.forEach((t) => {
      const d = Math.hypot(t.x - p.x, t.y - p.y);
      if (d < bestD) { bestD = d; best = t; }
    });
    if (best) return { x: best.x, y: best.y, on: best.what };
    return { x: snapFt(p.x), y: snapFt(p.y), on: null };
  }, [snapTargets]);

  /* Escape clears the tape, Enter finishes it. */
  useEffect(() => {
    if (tool !== "measure") return;
    const onKey = (e) => {
      if (e.key === "Escape") { setTape([]); setGhost(null); }
      if (e.key === "Enter" && tape.length > 1) setGhost(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tool, tape]);

  /* Delete removes whatever is selected. Cmd/Ctrl+C copies it, Cmd/Ctrl+V pastes a copy nearby.
     Ignored while typing in a field, so labels and notes stay editable as normal. */
  useEffect(() => {
    const typing = () => {
      const t = document.activeElement?.tagName;
      return t === "INPUT" || t === "TEXTAREA" || t === "SELECT";
    };
    const onKey = (e) => {
      if (typing()) return;
      const meta = e.metaKey || e.ctrlKey;

      if ((e.key === "Delete" || e.key === "Backspace")) {
        if (selFeature) { removeFeature(selFeature); setSelFeature(null); }
        else if (selPlanting) { removePlanting(selPlanting); setSelPlanting(null); }
        else if (selMeasure) { removeMeasure(selMeasure); setSelMeasure(null); }
        else if (activeBed && beds.length > 1) { removeBed(activeBed); }
        // undo (⌘/Ctrl+Z) covers an accidental press, so this no longer needs its own confirmation
      }
      if (meta && e.key.toLowerCase() === "c") {
        if (selFeature) clipboard.current = { kind: "feature", id: selFeature };
        else if (selPlanting) clipboard.current = { kind: "planting", id: selPlanting };
        else if (selMeasure) clipboard.current = { kind: "measure", id: selMeasure };
        else if (activeBed) clipboard.current = { kind: "bed", id: activeBed };
      }
      if (meta && e.key.toLowerCase() === "v" && clipboard.current) {
        e.preventDefault();
        const { kind, id } = clipboard.current;
        if (kind === "bed") duplicateBed(id);
        else if (kind === "feature") duplicateFeature(id);
        else if (kind === "planting") duplicatePlanting(id);
        else if (kind === "measure") duplicateMeasure(id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selFeature, selPlanting, selMeasure, activeBed, beds.length, removeFeature, removePlanting, removeMeasure, removeBed, duplicateBed, duplicateFeature, duplicatePlanting, duplicateMeasure]);

  const tapeSegments = useMemo(() => {
    const pts = ghost && tape.length ? [...tape, ghost] : tape;
    const segs = [];
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i];
      segs.push({ a, b, len: Math.hypot(b.x - a.x, b.y - a.y) });
    }
    return { pts, segs, total: segs.reduce((n, s2) => n + s2.len, 0) };
  }, [tape, ghost]);

  const VBW = PAD * 2 + yard.w * SCALE;
  const VBH = PAD * 2 + yard.d * SCALE;
  const px = (ft) => PAD + ft * SCALE;

  const pointerToFt = (e) => {
    const r = svgRef.current.getBoundingClientRect();
    const sx = ((e.clientX - r.left) / r.width) * VBW;
    const sy = ((e.clientY - r.top) / r.height) * VBH;
    return { x: (sx - PAD) / SCALE, y: (sy - PAD) / SCALE };
  };

  const onDown = (e, kind, item) => {
    if (tool === "measure") return;
    e.preventDefault();
    const p = pointerToFt(e);
    drag.current = { kind, id: item.id, dx: p.x - item.x, dy: p.y - item.y };
    if (kind === "bed") { setActiveBed(item.id); setSelFeature(null); setSelPlanting(null); setSelMeasure(null); }
    else if (kind === "planting") { setSelPlanting(item.id); setSelFeature(null); setSelMeasure(null); }
    else { setSelFeature(item.id); setSelPlanting(null); setSelMeasure(null); }
  };

  /* Grabbing one endpoint of the selected measurement to reshape it. */
  const onMeasurePointDown = (e, measureId, pointIndex) => {
    e.preventDefault();
    e.stopPropagation();
    drag.current = { kind: "measurePoint", measureId, pointIndex };
  };

  /* Clicking empty canvas: hit-test the kept measurements before falling through to deselect. */
  const onCanvasDown = (e) => {
    if (tool === "measure") {
      const pt = snap(pointerToFt(e));
      setTape((t) => [...t, pt]);
      setGhost(pt);
      return;
    }
    const raw = pointerToFt(e);
    const screenTol = 8 / SCALE; // ~8px hit radius, in feet
    let hit = null, hitD = screenTol;
    measures.forEach((m) => {
      for (let i = 1; i < m.points.length; i++) {
        const d = pointToSegment(raw, m.points[i - 1], m.points[i]);
        if (d < hitD) { hitD = d; hit = m.id; }
      }
    });
    if (hit) { setSelMeasure(hit); setSelFeature(null); setSelPlanting(null); }
    else { setSelMeasure(null); }
  };

  const onMove = (e) => {
    if (tool === "measure") {
      const raw = pointerToFt(e);
      setGhost(tape.length ? snap(raw) : null);
      return;
    }
    if (!drag.current) return;
    const p = pointerToFt(e);
    const { kind, id, dx, dy } = drag.current;
    if (kind === "bed") {
      const b = beds.find((x) => x.id === id);
      const fp = bedFootprint(b);
      const nx = Math.min(Math.max(0, snapFt(p.x - dx)), yard.w - fp.w);
      const ny = Math.min(Math.max(0, snapFt(p.y - dy)), yard.d - fp.d);
      moveBed(id, nx, ny);
    } else if (kind === "planting") {
      const pl = plantings.find((x) => x.id === id);
      const nx = Math.min(Math.max(-pl.w / 2, snapFt(p.x - dx)), yard.w - pl.w / 2);
      const ny = Math.min(Math.max(-pl.w / 2, snapFt(p.y - dy)), yard.d - pl.w / 2);
      movePlanting(id, nx, ny);
    } else if (kind === "measurePoint") {
      const { measureId, pointIndex } = drag.current;
      const pt = snap(p);
      updateMeasurePoint(measureId, pointIndex, pt);
    } else if (kind === "compass") {
      // angle from the compass hub (top-right of the plan) to the pointer
      const hub = { x: (VBW - 32 - PAD) / SCALE, y: (34 - PAD) / SCALE };
      let deg = (Math.atan2(p.x - hub.x, -(p.y - hub.y)) * 180) / Math.PI;
      deg = Math.round(deg / 5) * 5; // snap to 5 degree increments
      if (deg < 0) deg += 360;
      setYard({ northAngle: deg });
    } else {
      const f = features.find((x) => x.id === id);
      const nx = Math.min(Math.max(-f.w / 2, snapFt(p.x - dx)), yard.w - f.w / 2);
      const ny = Math.min(Math.max(-f.d / 2, snapFt(p.y - dy)), yard.d - f.d / 2);
      moveFeature(id, nx, ny);
    }
  };

  useEffect(() => {
    const up = () => { drag.current = null; };
    window.addEventListener("pointerup", up);
    return () => window.removeEventListener("pointerup", up);
  }, []);

  const sel = beds.find((b) => b.id === activeBed);
  const rects = beds.map((b) => ({ id: b.id, name: b.name, ...bedFootprint(b), x: b.x, y: b.y }));

  /* clearances from the selected bed to everything around it */
  const clearances = useMemo(() => {
    if (!sel) return { neighbours: [], edges: [], collisions: [] };
    const me = rects.find((r) => r.id === sel.id);
    const neighbours = rects
      .filter((r) => r.id !== sel.id)
      .map((r) => ({ name: r.name, ...gapBetween(me, r) }))
      .sort((a, b) => a.gap - b.gap);
    const edges = [
      { side: "north", gap: me.y },
      { side: "west", gap: me.x },
      { side: "south", gap: yard.d - (me.y + me.d) },
      { side: "east", gap: yard.w - (me.x + me.w) },
    ].sort((a, b) => a.gap - b.gap);
    return { neighbours: neighbours.slice(0, 4), edges, collisions: neighbours.filter((n) => n.overlap) };
  }, [sel, rects, yard]);

  /* every shade-casting thing in the yard, gathered once and reused for every bed */
  const obstructions = useMemo(
    () => gatherObstructions(beds, features, plantings, yard),
    [beds, features, plantings, yard]
  );
  const sunExposure = useMemo(() => {
    if (!sel) return null;
    // don't let a bed shade itself — drop obstructions that sit on the bed's own footprint
    const others = obstructions.filter((o) => !(Math.abs(o.x - (sel.x + bedFootprint(sel).w / 2)) < 1 && Math.abs(o.y - (sel.y + bedFootprint(sel).d / 2)) < 1));
    return bedSunExposure(sel, others, yard.northAngle || 0);
  }, [sel, obstructions, yard.northAngle]);

  const anyOverlap = useMemo(() => {
    const bad = new Set();
    for (let i = 0; i < rects.length; i++)
      for (let j = i + 1; j < rects.length; j++)
        if (gapBetween(rects[i], rects[j]).overlap) { bad.add(rects[i].id); bad.add(rects[j].id); }
    return bad;
  }, [rects]);

  /* what's growing in each bed, for the fill bands */
  const bedBands = useMemo(() => {
    const out = {};
    beds.forEach((b) => {
      const cells = plan[b.id] || [];
      const t = {};
      cells.forEach((c) => { if (c) t[c] = (t[c] || 0) + 1; });
      const total = Object.values(t).reduce((a, n) => a + n, 0);
      out[b.id] = total
        ? Object.entries(t).sort((a, b2) => b2[1] - a[1]).map(([id, n]) => ({ color: FAMILY[CROP_BY_ID[id].fam].color, frac: n / total }))
        : [];
    });
    return out;
  }, [beds, plan]);

  const soil = useMemo(() => {
    const cuft = beds.reduce((n, b) => n + b.w * b.l * ((b.depth ?? 12) / 12), 0);
    return { cuft, cuyd: cuft / 27, third: cuft / 3 };
  }, [beds]);

  const totalBedSqFt = beds.reduce((n, b) => n + b.w * b.l, 0);
  const yardSqFt = yard.w * yard.d;
  const selFeatureObj = features.find((f) => f.id === selFeature);
  const selPlantingObj = plantings.find((p) => p.id === selPlanting);
  const selMeasureObj = measures.find((m) => m.id === selMeasure);

  const edgeStyle = { fence: "var(--soil)", house: "var(--ink)", open: "var(--rule)" };

  return (
    <div className="orto-yard">
      <section className="orto-panel orto-yardcanvas">
        <div className="orto-bedhead">
          <div>
            <h2 className="orto-h2">Plot plan</h2>
            <p className="orto-fine">
              {yard.w} ft × {yard.d} ft · {Math.round(yardSqFt)} sq ft · {Math.round(totalBedSqFt)} sq ft in beds
              ({Math.round((totalBedSqFt / yardSqFt) * 100)}%)
            </p>
          </div>
          <div className="orto-bedtools mono">
            <label className="orto-inline">W<input type="number" min="6" max="120" step="0.5" value={yard.w} onChange={(e) => setYard({ w: Number(e.target.value) || yard.w })} /></label>
            <label className="orto-inline">D<input type="number" min="6" max="120" step="0.5" value={yard.d} onChange={(e) => setYard({ d: Number(e.target.value) || yard.d })} /></label>
            <label className="orto-inline" title="Degrees clockwise from up on the plan to true north">N<input type="number" min="0" max="359" step="5" value={Math.round(yard.northAngle || 0)} onChange={(e) => setYard({ northAngle: ((Number(e.target.value) % 360) + 360) % 360 })} />°</label>
            <button className={tool === "measure" ? "on" : ""}
              onClick={() => { setTool(tool === "measure" ? "select" : "measure"); setTape([]); setGhost(null); }}>
              {tool === "measure" ? "Done measuring" : "Measure"}
            </button>
            <button onClick={() => setShowEdges((v) => !v)}>Boundaries</button>
          </div>
        </div>

        {tool === "measure" && (
          <div className="orto-tapebar">
            <span className="orto-tapehint">
              {tape.length === 0
                ? "Click to start. It snaps to bed and object corners."
                : `${ftIn(tapeSegments.total)}${tapeSegments.segs.length > 1 ? ` across ${tapeSegments.segs.length} legs` : ""}${ghost?.on ? ` · on ${ghost.on}` : ""}`}
            </span>
            {tape.length > 0 && (
              <span className="mono orto-tapemetric">{(tapeSegments.total * 0.3048).toFixed(2)} m</span>
            )}
            <div className="orto-bedtools mono">
              <button disabled={tape.length < 2} onClick={() => { addMeasure(tape, ""); setTape([]); setGhost(null); }}>Pin to plan</button>
              <button disabled={!tape.length} onClick={() => { setTape([]); setGhost(null); }}>Clear</button>
            </div>
          </div>
        )}

        <div className="orto-addbar">
          {Object.entries(FEATURE_CATS).map(([cat, label]) => (
            <button key={cat} className={palette === cat ? "on" : ""} onClick={() => setPalette(palette === cat ? null : cat)}>{label}</button>
          ))}
          <button className={palette === "fruit" ? "on berry" : "berry"} onClick={() => setPalette(palette === "fruit" ? null : "fruit")}>Fruit</button>
        </div>

        {palette && palette !== "fruit" && (
          <div className="orto-palettedrawer">
            {Object.entries(FEATURE_KINDS).filter(([, v]) => v.cat === palette).map(([k, v]) => (
              <button key={k} onClick={() => { addFeature(k); setPalette(null); }}>
                <span className="orto-swatch" style={{ background: v.fill }} />
                {v.label}
                <i className="mono">{v.w}×{v.d}</i>
              </button>
            ))}
          </div>
        )}

        {palette === "fruit" && (
          <div className="orto-palettedrawer">
            {BUSH_GROUPS.map((g) => {
              const list = Object.entries(BUSHES).filter(([, v]) => v.group === g);
              if (!list.length) return null;
              return (
                <div key={g} className="orto-fruitgroup">
                  <p className="orto-famlabel" style={{ color: "var(--berry)" }}>{g}</p>
                  {list.map(([k, v]) => (
                    <button key={k} onClick={() => { addPlanting(k); setPalette(null); }}>
                      <span className="orto-swatch" style={{ background: "var(--berry)" }} />
                      {v.label}
                      <i className="mono">{v.spread} ft</i>
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        )}

        {showEdges && (
          <div className="orto-edgebar">
            {["north", "east", "south", "west"].map((side) => (
              <label key={side} className="mono">
                {side}
                <select value={yard.edges[side]} onChange={(e) => setEdge(side, e.target.value)}>
                  <option value="fence">fence</option>
                  <option value="house">house wall</option>
                  <option value="open">open</option>
                </select>
              </label>
            ))}
            {Object.values(yard.edges || {}).includes("house") && (
              <label className="mono" title="Used for the sun-exposure estimate on nearby beds">
                house height (ft)
                <input type="number" min="6" max="60" value={yard.houseHeight ?? 20}
                  onChange={(e) => setYard({ houseHeight: Number(e.target.value) || 20 })} style={{ width: 46 }} />
              </label>
            )}
          </div>
        )}

        <div className="orto-yardscroll">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${VBW} ${VBH}`}
            width="100%"
            onPointerMove={onMove}
            onPointerDown={onCanvasDown}
            onDoubleClick={() => setGhost(null)}
            style={{ minWidth: Math.min(VBW, 640), touchAction: "none", cursor: tool === "measure" ? "crosshair" : "default" }}
            role="img"
            aria-label="Top-down plan of the backyard"
          >
            <defs>
              <pattern id="ortoGrid" width={SCALE} height={SCALE} patternUnits="userSpaceOnUse">
                <path d={`M ${SCALE} 0 L 0 0 0 ${SCALE}`} fill="none" stroke="var(--rule-soft)" strokeWidth="0.6" />
              </pattern>
              <pattern id="ortoHouse" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <line x1="0" y1="0" x2="0" y2="7" stroke="var(--ink)" strokeWidth="1.6" opacity="0.5" />
              </pattern>
            </defs>

            {/* ground */}
            <rect x={PAD} y={PAD} width={yard.w * SCALE} height={yard.d * SCALE} fill="#EFF2E7" />
            <rect x={PAD} y={PAD} width={yard.w * SCALE} height={yard.d * SCALE} fill="url(#ortoGrid)" />

            {/* boundaries */}
            {[
              ["north", PAD, PAD, yard.w * SCALE, 0],
              ["east", PAD + yard.w * SCALE, PAD, 0, yard.d * SCALE],
              ["south", PAD, PAD + yard.d * SCALE, yard.w * SCALE, 0],
              ["west", PAD, PAD, 0, yard.d * SCALE],
            ].map(([side, x1, y1, w, h]) => {
              const kind = yard.edges[side];
              const vertical = w === 0;
              return (
                <g key={side}>
                  {kind === "house" && (
                    <rect
                      x={vertical ? x1 : x1} y={y1}
                      width={vertical ? 11 : w} height={vertical ? h : 11}
                      transform={side === "north" ? `translate(0,-11)` : side === "west" ? `translate(-11,0)` : undefined}
                      fill="url(#ortoHouse)" stroke="var(--ink)" strokeWidth="1"
                    />
                  )}
                  <line x1={x1} y1={y1} x2={x1 + w} y2={y1 + h}
                    stroke={edgeStyle[kind]} strokeWidth={kind === "open" ? 1 : 2.5}
                    strokeDasharray={kind === "open" ? "5 5" : undefined} />
                  {kind === "fence" && Array.from({ length: Math.floor((vertical ? h : w) / (SCALE * 4)) + 1 }).map((_, i) => (
                    <circle key={i} cx={vertical ? x1 : x1 + i * SCALE * 4} cy={vertical ? y1 + i * SCALE * 4 : y1} r="2" fill="var(--soil)" />
                  ))}
                </g>
              );
            })}

            {/* features */}
            {features.map((f) => {
              const k = FEATURE_KINDS[f.kind] || {};
              const isSel = f.id === selFeature;
              const cx = px(f.x + f.w / 2), cy = px(f.y + f.d / 2);
              const fill = k.fill ?? "#999";
              return (
                <g key={f.id} onPointerDown={(e) => onDown(e, "feature", f)} style={{ cursor: "grab" }}>
                  {k.clear > 0 && (
                    <rect x={px(f.x - k.clear)} y={px(f.y - k.clear)}
                      width={(f.w + k.clear * 2) * SCALE} height={(f.d + k.clear * 2) * SCALE}
                      rx="3" fill="none" stroke={fill} strokeWidth="1" strokeDasharray="3 4" opacity="0.55" />
                  )}
                  {k.shape === "circle" ? (
                    <circle cx={cx} cy={cy} r={(f.w / 2) * SCALE} fill={fill} opacity="0.22"
                      stroke={fill} strokeWidth={isSel ? 2.4 : 1} strokeDasharray={f.kind === "tree" ? "4 3" : undefined} />
                  ) : (
                    <rect x={px(f.x)} y={px(f.y)} width={f.w * SCALE} height={f.d * SCALE} rx="2"
                      fill={k.hatch ? "url(#ortoHouse)" : fill} opacity={k.hatch ? 0.5 : 0.22}
                      stroke={fill} strokeWidth={isSel ? 2.4 : 1} />
                  )}
                  {f.kind === "tree" && <circle cx={cx} cy={cy} r="4" fill="var(--soil)" />}
                  <text x={cx} y={cy + 4} textAnchor="middle" fontSize="10"
                    className="svg-mono" fill="var(--ink-soft)" pointerEvents="none">{f.name}</text>
                </g>
              );
            })}

            {/* perennial fruit */}
            {plantings.map((p) => {
              const sp = BUSHES[p.speciesId];
              if (!sp) return null;
              const isSel = p.id === selPlanting;
              const r = (p.w / 2) * SCALE;
              const cx = px(p.x + p.w / 2), cy = px(p.y + p.w / 2);
              const bearing = today.getFullYear() - Number(p.planted) >= sp.bear;
              return (
                <g key={p.id} onPointerDown={(e) => onDown(e, "planting", p)} style={{ cursor: "grab" }}>
                  <circle cx={cx} cy={cy} r={r} fill="var(--berry)" opacity={bearing ? 0.22 : 0.1}
                    stroke="var(--berry)" strokeWidth={isSel ? 2.4 : 1.2}
                    strokeDasharray={bearing ? undefined : "4 3"} />
                  <circle cx={cx} cy={cy} r="3.5" fill="var(--berry)" />
                  <text x={cx} y={cy + r - 4} textAnchor="middle" fontSize="9.5"
                    className="svg-mono" fill="var(--berry)" pointerEvents="none">
                    {p.variety || sp.label}
                  </text>
                </g>
              );
            })}

            {/* beds */}
            {beds.map((b) => {
              const fp = bedFootprint(b);
              const isSel = b.id === activeBed;
              const bad = anyOverlap.has(b.id);
              const bands = bedBands[b.id] || [];
              const X = px(b.x), Y = px(b.y), W = fp.w * SCALE, H = fp.d * SCALE;
              let acc = 0;
              return (
                <g key={b.id} onPointerDown={(e) => onDown(e, "bed", b)} style={{ cursor: "grab" }}>
                  <rect x={X} y={Y} width={W} height={H} rx="2" fill="#DFD6C6" stroke="var(--soil)" strokeWidth="1" />
                  {bands.map((band, i) => {
                    const bw = band.frac * W;
                    const bx = X + acc;
                    acc += bw;
                    return <rect key={i} x={bx} y={Y} width={bw} height={H} fill={band.color} opacity="0.62" />;
                  })}
                  <rect x={X} y={Y} width={W} height={H} rx="2" fill="none"
                    stroke={bad ? "var(--pomodoro)" : isSel ? "var(--ink)" : "var(--soil)"}
                    strokeWidth={bad || isSel ? 2.4 : 1} />
                  <text x={X + W / 2} y={Y + H / 2 - 1} textAnchor="middle" fontSize="10.5" className="svg-body" fill="var(--ink)">
                    {b.name.length > 18 ? b.name.slice(0, 17) + "…" : b.name}
                  </text>
                  <text x={X + W / 2} y={Y + H / 2 + 12} textAnchor="middle" fontSize="9.5" className="svg-mono" fill="var(--ink-soft)">
                    {b.w}×{b.l}
                  </text>
                </g>
              );
            })}

            {/* dimension callouts on the selected bed */}
            {sel && (() => {
              const fp = bedFootprint(sel);
              const X = px(sel.x), Y = px(sel.y), W = fp.w * SCALE, H = fp.d * SCALE;
              return (
                <g pointerEvents="none">
                  <line x1={X} y1={Y - 9} x2={X + W} y2={Y - 9} stroke="var(--chicory)" strokeWidth="1" />
                  <text x={X + W / 2} y={Y - 13} textAnchor="middle" fontSize="9.5" className="svg-mono" fill="var(--chicory)">{ftIn(fp.w)}</text>
                  <line x1={X - 9} y1={Y} x2={X - 9} y2={Y + H} stroke="var(--chicory)" strokeWidth="1" />
                  <text x={X - 13} y={Y + H / 2} textAnchor="end" fontSize="9.5" className="svg-mono" fill="var(--chicory)">{ftIn(fp.d)}</text>
                </g>
              );
            })()}

            {/* kept measurements */}
            {measures.map((m) => {
              const pts = m.points;
              const isSel = m.id === selMeasure;
              let total = 0;
              for (let i = 1; i < pts.length; i++) total += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
              const mid = pts[Math.floor(pts.length / 2)];
              return (
                <g key={m.id} opacity={isSel ? 1 : 0.75}>
                  {/* fat invisible line for an easy click target */}
                  <polyline points={pts.map((q) => `${px(q.x)},${px(q.y)}`).join(" ")}
                    fill="none" stroke="transparent" strokeWidth="14" style={{ cursor: "pointer" }} />
                  <polyline points={pts.map((q) => `${px(q.x)},${px(q.y)}`).join(" ")}
                    fill="none" stroke="var(--chicory)" strokeWidth={isSel ? 2 : 1.2}
                    strokeDasharray={isSel ? undefined : "2 3"} pointerEvents="none" />
                  {pts.map((q, i) => (
                    <circle key={i} cx={px(q.x)} cy={px(q.y)} r={isSel ? 5 : 2.5} fill="var(--chicory)"
                      stroke={isSel ? "var(--paper)" : "none"} strokeWidth="1.5"
                      style={{ cursor: isSel ? "grab" : "pointer" }}
                      onPointerDown={isSel ? (e) => onMeasurePointDown(e, m.id, i) : undefined} />
                  ))}
                  <rect x={px(mid.x) + 3} y={px(mid.y) - 17} width={((m.label ? m.label.length + 3 : 0) + ftIn(total).length) * 5.4 + 8} height="13" fill="var(--paper)" opacity="0.85" pointerEvents="none" />
                  <text x={px(mid.x) + 6} y={px(mid.y) - 7} fontSize="9.5" className="svg-mono" fill="var(--chicory)" pointerEvents="none">
                    {m.label ? `${m.label} · ${ftIn(total)}` : ftIn(total)}
                  </text>
                </g>
              );
            })}

            {/* live tape */}
            {tool === "measure" && tapeSegments.pts.length > 0 && (
              <g pointerEvents="none">
                {tapeSegments.segs.map((sg, i) => {
                  const mx = (px(sg.a.x) + px(sg.b.x)) / 2, my = (px(sg.a.y) + px(sg.b.y)) / 2;
                  return (
                    <g key={i}>
                      <line x1={px(sg.a.x)} y1={px(sg.a.y)} x2={px(sg.b.x)} y2={px(sg.b.y)}
                        stroke="var(--pomodoro)" strokeWidth="1.8" />
                      <rect x={mx - 26} y={my - 17} width="52" height="14" rx="2" fill="var(--paper)" opacity="0.92" />
                      <text x={mx} y={my - 6} textAnchor="middle" fontSize="10" className="svg-mono" fill="var(--pomodoro)">
                        {ftIn(sg.len)}
                      </text>
                    </g>
                  );
                })}
                {tapeSegments.pts.map((q, i) => (
                  <g key={"p" + i}>
                    <circle cx={px(q.x)} cy={px(q.y)} r="4" fill="var(--paper)" stroke="var(--pomodoro)" strokeWidth="2" />
                    {q.on && <circle cx={px(q.x)} cy={px(q.y)} r="8" fill="none" stroke="var(--pomodoro)" strokeWidth="1" opacity="0.5" />}
                  </g>
                ))}
              </g>
            )}

            {/* scale bar + compass */}
            <g pointerEvents="none">
              <line x1={PAD} y1={VBH - 18} x2={PAD + 5 * SCALE} y2={VBH - 18} stroke="var(--ink-soft)" strokeWidth="1.5" />
              <line x1={PAD} y1={VBH - 22} x2={PAD} y2={VBH - 14} stroke="var(--ink-soft)" strokeWidth="1.5" />
              <line x1={PAD + 5 * SCALE} y1={VBH - 22} x2={PAD + 5 * SCALE} y2={VBH - 14} stroke="var(--ink-soft)" strokeWidth="1.5" />
              <text x={PAD + 5 * SCALE + 7} y={VBH - 14} fontSize="10" className="svg-mono" fill="var(--ink-soft)">5 ft</text>
            </g>

            <g transform={`translate(${VBW - 32},34)`} style={{ cursor: "grab" }}
              onPointerDown={(e) => { e.stopPropagation(); drag.current = { kind: "compass" }; }}>
              <circle r="20" fill="var(--paper)" stroke="var(--rule)" strokeWidth="1" opacity="0.9" />
              <g transform={`rotate(${yard.northAngle || 0})`}>
                <path d="M 0,-15 L 5,4 L 0,0 L -5,4 Z" fill="var(--pomodoro)" />
                <line x1="0" y1="0" x2="0" y2="15" stroke="var(--ink-soft)" strokeWidth="1" opacity="0.5" />
                <text x="0" y="-17" textAnchor="middle" fontSize="10" className="svg-mono" fill="var(--pomodoro)">N</text>
              </g>
            </g>
          </svg>
        </div>
        <p className="orto-fine">Drag beds and features to reposition. Everything snaps to 6 inches.</p>
      </section>

      <aside className="orto-panel orto-yardside">
        {sel && !selPlantingObj && (
          <>
            <h2 className="orto-h2">{sel.name}</h2>
            <p className="orto-fine">{sel.w} ft × {sel.l} ft · sitting at {ftIn(sel.x)} across, {ftIn(sel.y)} down</p>
            <div className="orto-bedtools mono" style={{ marginTop: 8 }}>
              <button onClick={() => rotateBed(sel.id)}>Turn {sel.rot === 90 ? "lengthways" : "sideways"}</button>
              <button onClick={() => duplicateBed(sel.id)}>Duplicate</button>
              <button onClick={openPlot}>Plant this bed</button>
            </div>

            <p className="mono orto-dates">
              Diagonal {ftIn(Math.hypot(sel.w, sel.l))} — both should read the same when the frame is square.
            </p>

            {sunExposure && (() => {
              const avg = sunExposure.avg;
              const grade = avg >= 6 ? { label: "Full sun", cls: "ok" } : avg >= 4 ? { label: "Part sun", cls: "" } : { label: "Part shade", cls: "warn" };
              return (
                <div className="orto-sunbox">
                  <h3 className="orto-h3">Sun exposure</h3>
                  <p className={"orto-note " + grade.cls}>{grade.label} — averages {avg.toFixed(1)} hrs across the season.</p>
                  <div className="orto-sunrow mono">
                    {sunExposure.byDate.map((d) => (
                      <span key={d.label}>{d.label} <strong>{d.hours.toFixed(1)}h</strong></span>
                    ))}
                  </div>
                  <p className="orto-fine">
                    Estimated from real sun angles at Hamilton's latitude, your compass setting, and the height of
                    whatever's nearby — the house, trees, and other tall features, but not fences, which are usually
                    too short to matter for most of the day. Treats every obstruction as a simple block, so it's a
                    solid estimate, not a precise render.
                  </p>
                </div>
              );
            })()}

            <h3 className="orto-h3">Clearances</h3>
            {clearances.collisions.length > 0 && (
              <p className="orto-note warn">Overlapping {clearances.collisions.map((c) => c.name).join(", ")}.</p>
            )}
            <ul className="orto-clearlist">
              {clearances.neighbours.filter((n) => !n.overlap).map((n, i) => (
                <li key={i} className={n.axis === "joined" ? "" : n.gap < 1.5 ? "tight" : n.gap >= 2.33 ? "roomy" : ""}>
                  <span className="mono">{n.axis === "joined" ? "joined" : ftIn(n.gap)}</span>
                  <span>to {n.name}</span>
                  {n.axis === "diagonal" && <i>corner</i>}
                </li>
              ))}
              {clearances.edges.slice(0, 2).map((e, i) => (
                <li key={"e" + i} className={e.gap < 1 ? "tight" : ""}>
                  <span className="mono">{ftIn(e.gap)}</span>
                  <span>to the {e.side} {yard.edges[e.side] === "house" ? "house wall" : yard.edges[e.side]}</span>
                </li>
              ))}
            </ul>
            <p className="orto-fine">
              Under 1 ft 6 in is a squeeze. 2 ft 4 in or more takes a wheelbarrow — the clearance you used on your fence run.
            </p>

            <h3 className="orto-h3">Soil depth</h3>
            <label className="orto-inline mono">
              <input type="number" min="4" max="36" step="1" value={sel.depth ?? 12}
                onChange={(e) => updateBed(sel.id, { depth: Number(e.target.value) || 12 })} /> in
            </label>
            <p className="orto-fine">{(sel.w * sel.l * ((sel.depth ?? 12) / 12)).toFixed(1)} cu ft to fill this bed.</p>
          </>
        )}


        {selPlantingObj && (() => {
          const sp = BUSHES[selPlantingObj.speciesId];
          const age = today.getFullYear() - Number(selPlantingObj.planted);
          const bearing = age >= sp.bear;
          const sameSpecies = plantings.filter((x) => x.speciesId === selPlantingObj.speciesId);
          const distinctVarieties = new Set(sameSpecies.map((x) => (x.variety || "").trim().toLowerCase()).filter(Boolean));
          const partnerMissing = sp.partner && (sameSpecies.length < 2 || distinctVarieties.size < 2);
          const crowding = [...beds.map((b) => ({ name: b.name, ...bedFootprint(b), x: b.x, y: b.y })),
                            ...features.map((f) => ({ name: f.name, w: f.w, d: f.d, x: f.x, y: f.y }))]
            .map((o) => ({ name: o.name, ...gapBetween({ x: selPlantingObj.x, y: selPlantingObj.y, w: selPlantingObj.w, d: selPlantingObj.w }, o) }))
            .filter((o) => o.overlap || o.gap < 1);
          return (
            <div className="orto-plantpanel">
              <h2 className="orto-h2">{selPlantingObj.variety || sp.label}</h2>
              <p className="orto-fine">{sp.label} · {sp.group.toLowerCase()} · {sp.spread} ft spread, {sp.height} ft tall</p>

              <div className="orto-formrow">
                <label>Variety<input className="orto-input" value={selPlantingObj.variety} onChange={(e) => updatePlanting(selPlantingObj.id, { variety: e.target.value })} placeholder="e.g. Patriot" /></label>
                <label>Planted<input className="orto-input mono" type="number" min="1980" max="2100" value={selPlantingObj.planted} onChange={(e) => updatePlanting(selPlantingObj.id, { planted: e.target.value })} /></label>
                <label>Spread (ft)<input className="orto-input mono" type="number" min="1" max="30" step="0.5" value={selPlantingObj.w} onChange={(e) => updatePlanting(selPlantingObj.id, { w: Number(e.target.value) || sp.spread })} /></label>
              </div>

              <p className={"orto-note " + (bearing ? "ok" : "")}>
                {bearing
                  ? `Should be cropping — ${age} ${age === 1 ? "year" : "years"} in the ground, bears from year ${sp.bear}.`
                  : `Not bearing yet. Typically starts in year ${sp.bear}, so around ${Number(selPlantingObj.planted) + sp.bear}.`}
              </p>
              <p className="mono orto-dates">
                Picks {MONTHS[sp.harvest[0][0]]} {sp.harvest[0][1]} – {MONTHS[sp.harvest[1][0]]} {sp.harvest[1][1]}
              </p>
              <p className="orto-fine">{sp.sun} sun · soil pH {sp.ph}</p>

              {partnerMissing && <p className="orto-note warn">{sp.partner}</p>}
              {sp.selfFertile && <p className="orto-fine">Self-fertile — one plant will crop on its own.</p>}
              {crowding.length > 0 && (
                <p className="orto-note warn">
                  Mature spread runs into {crowding.map((c) => c.name).join(", ")}. Move it or expect to prune hard.
                </p>
              )}
              {sp.note && <p className="orto-note">{sp.note}</p>}

              <label className="orto-notefield">Notes
                <textarea className="orto-input" rows="2" value={selPlantingObj.notes || ""} onChange={(e) => updatePlanting(selPlantingObj.id, { notes: e.target.value })} placeholder="Where it came from, how it's doing" />
              </label>
              <div className="orto-bedtools mono">
                <button onClick={() => duplicatePlanting(selPlantingObj.id)}>Duplicate</button>
                <ConfirmButton onConfirm={() => { removePlanting(selPlantingObj.id); setSelPlanting(null); }} />
              </div>
            </div>
          );
        })()}

        {selFeatureObj && (
          <div className="orto-featedit">
            <h3 className="orto-h3">{selFeatureObj.name}</h3>
            <div className="orto-formrow">
              <label>Name<input className="orto-input" value={selFeatureObj.name} onChange={(e) => updateFeature(selFeatureObj.id, { name: e.target.value })} /></label>
              <label>{FEATURE_KINDS[selFeatureObj.kind]?.shape === "circle" ? "Diameter (ft)" : "Width (ft)"}
                <input className="orto-input mono" type="number" min="1" max="40" step="0.5" value={selFeatureObj.w}
                  onChange={(e) => { const v = Number(e.target.value) || 1; updateFeature(selFeatureObj.id, FEATURE_KINDS[selFeatureObj.kind]?.shape === "circle" ? { w: v, d: v } : { w: v }); }} /></label>
              {FEATURE_KINDS[selFeatureObj.kind]?.shape !== "circle" && (
                <label>Depth (ft)<input className="orto-input mono" type="number" min="1" max="40" step="0.5" value={selFeatureObj.d}
                  onChange={(e) => updateFeature(selFeatureObj.id, { d: Number(e.target.value) || 1 })} /></label>
              )}
              {(FEATURE_KINDS[selFeatureObj.kind]?.height ?? 0) > 0 && (
                <label title="Used for the sun-exposure estimate on nearby beds">Height (ft)
                  <input className="orto-input mono" type="number" min="0" max="80" step="0.5"
                    value={selFeatureObj.height ?? FEATURE_KINDS[selFeatureObj.kind].height}
                    onChange={(e) => updateFeature(selFeatureObj.id, { height: Number(e.target.value) || 0 })} /></label>
              )}
            </div>
            {FEATURE_KINDS[selFeatureObj.kind]?.note && (
              <p className="orto-note">{FEATURE_KINDS[selFeatureObj.kind].note}</p>
            )}
            {FEATURE_KINDS[selFeatureObj.kind]?.clear > 0 && (
              <p className="orto-fine">The dashed ring is {FEATURE_KINDS[selFeatureObj.kind].clear} ft of working clearance.</p>
            )}
            <div className="orto-bedtools mono">
              <button onClick={() => duplicateFeature(selFeatureObj.id)}>Duplicate</button>
              <ConfirmButton onConfirm={() => { removeFeature(selFeatureObj.id); setSelFeature(null); }} />
            </div>
          </div>
        )}

        {measures.length > 0 && (
          <>
            <h3 className="orto-h3">Pinned measurements</h3>
            <p className="orto-fine">Click a measurement on the plan to select it — drag its dots to reshape, Delete to remove, ⌘/Ctrl+C then ⌘/Ctrl+V to duplicate.</p>
            <ul className="orto-measlist">
              {measures.map((m) => {
                let total = 0;
                for (let i = 1; i < m.points.length; i++)
                  total += Math.hypot(m.points[i].x - m.points[i - 1].x, m.points[i].y - m.points[i - 1].y);
                const isSel = m.id === selMeasure;
                const confirming = confirmMeasureId === m.id;
                return (
                  <li key={m.id} className={isSel ? "sel" : ""} onClick={() => setSelMeasure(m.id)}>
                    <span className="mono">{ftIn(total)}</span>
                    <input className="orto-input" value={m.label} placeholder="label it"
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => updateMeasureLabel(m.id, e.target.value)} />
                    <button className="orto-linkbtn" onClick={(e) => { e.stopPropagation(); duplicateMeasure(m.id); }}>copy</button>
                    {confirming ? (
                      <>
                        <button className="orto-linkbtn danger" onClick={(e) => { e.stopPropagation(); removeMeasure(m.id); if (isSel) setSelMeasure(null); setConfirmMeasureId(null); }}>confirm</button>
                        <button className="orto-linkbtn" onClick={(e) => { e.stopPropagation(); setConfirmMeasureId(null); }}>cancel</button>
                      </>
                    ) : (
                      <button className="orto-linkbtn" onClick={(e) => { e.stopPropagation(); setConfirmMeasureId(m.id); }}>remove</button>
                    )}
                  </li>
                );
              })}
            </ul>
          </>
        )}

        <h3 className="orto-h3">Soil to fill every bed</h3>
        <p className="orto-soilbig mono">{soil.cuft.toFixed(0)}<i> cu ft</i></p>
        <p className="orto-fine">{soil.cuyd.toFixed(1)} cubic yards across {beds.length} beds.</p>
        <ul className="orto-mix">
          <li><span className="mono">{soil.third.toFixed(0)} cu ft</span> compost</li>
          <li><span className="mono">{soil.third.toFixed(0)} cu ft</span> peat or coir</li>
          <li><span className="mono">{soil.third.toFixed(0)} cu ft</span> coarse vermiculite</li>
        </ul>
        <p className="orto-fine">Mel's Mix in equal thirds by volume. Adjust each bed's depth above to change the total.</p>
      </aside>
    </div>
  );
}

/* ============================================================
   Season tab — the ribbon
   ============================================================ */

function SeasonTab({ schedules, plantings, gardenTally, frost, setFrost, year, lastFrost, firstFrost, taskDone, toggleTaskDone }) {
  const START = new Date(year, 1, 1);   // Feb 1
  const END = new Date(year, 10, 30);   // Nov 30
  const SPAN = (END - START) / MS_DAY;
  const W = 1000, ROW = 30, PAD_T = 34, LABEL = 168;
  const x = (d) => LABEL + ((d - START) / MS_DAY / SPAN) * (W - LABEL - 16);
  const fruitRows = (plantings || [])
    .map((p) => {
      const sp = BUSHES[p.speciesId];
      if (!sp) return null;
      const bearing = year - Number(p.planted) >= sp.bear;
      return {
        key: p.id,
        name: p.variety || sp.label,
        start: new Date(year, sp.harvest[0][0], sp.harvest[0][1]),
        end: new Date(year, sp.harvest[1][0], sp.harvest[1][1]),
        bearing,
        bearsIn: Number(p.planted) + sp.bear,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.start - b.start);
  const H = PAD_T + (schedules.length + fruitRows.length) * ROW + (fruitRows.length ? 26 : 0) + 16;

  const monthTicks = [];
  for (let m = 1; m <= 10; m++) monthTicks.push(new Date(year, m, 1));

  const taskKey = (t) => `${t.crop?.id ?? t.fam ?? "x"}-${t.kind}-${toISO(t.d)}`;

  const tasks = useMemo(() => {
    const list = [];
    schedules.forEach((s) => {
      if (s.indoors) list.push({ d: s.indoors, text: `Start ${s.crop.name} indoors`, kind: "indoors", crop: s.crop });
      if (s.setOut) list.push({ d: s.setOut, text: `Set out ${s.crop.name}`, kind: "out", crop: s.crop });
      if (s.sow && !s.fallPlanted) list.push({ d: s.sow, text: `Sow ${s.crop.name}`, kind: "sow", crop: s.crop });
      if (s.fallPlanted) list.push({ d: s.sow, text: `Plant ${s.crop.name} cloves`, kind: "sow", crop: s.crop });
      s.successions.forEach((d) => list.push({ d, text: `Sow more ${s.crop.name}`, kind: "succession", crop: s.crop }));
      if (s.harvestStart) list.push({ d: s.harvestStart, text: `${s.crop.name} should start ${s.crop.bloomer ? "blooming" : "coming in"}`, kind: "harvest", crop: s.crop });
    });
    fruitRows.forEach((f) => {
      if (f.bearing) list.push({ d: f.start, text: `${f.name} should start coming in`, kind: "harvest", fam: "perennial" });
    });
    return list.sort((a, b) => a.d - b.d).map((t) => ({ ...t, key: taskKey(t) }));
  }, [schedules, fruitRows]);

  const doneCount = tasks.filter((t) => taskDone[t.key]).length;

  const byMonth = useMemo(() => {
    const m = {};
    tasks.forEach((t) => {
      const k = `${t.d.getFullYear()}-${t.d.getMonth()}`;
      (m[k] = m[k] || []).push(t);
    });
    return m;
  }, [tasks]);

  if (!schedules.length && !fruitRows.length) {
    return (
      <div className="orto-panel orto-solo">
        <h2 className="orto-h2">Nothing scheduled yet</h2>
        <p className="orto-empty">Plant something in the Plot tab and the season builds itself from there.</p>
      </div>
    );
  }

  return (
    <div className="orto-season">
      <div className="orto-panel">
        <div className="orto-frostbar">
          <h2 className="orto-h2">Season {year}</h2>
          <label className="mono">Last spring frost
            <input type="date" value={frost.last} onChange={(e) => setFrost("last", e.target.value)} />
          </label>
          <label className="mono">First fall frost
            <input type="date" value={frost.first} onChange={(e) => setFrost("first", e.target.value)} />
          </label>
          <span className="mono orto-frostdays">
            {Math.round((firstFrost - lastFrost) / MS_DAY)} frost-free days
          </span>
          <button className="mono orto-calbtn" disabled={!tasks.length}
            onClick={() => downloadICS(tasks, `Garden ${year}`, `garden-${year}.ics`)}>
            Add to calendar
          </button>
        </div>
        <p className="orto-fine" style={{ margin: "0 0 10px" }}>
          Downloads every start, transplant, sow, and harvest date as one file — import it into Apple Calendar,
          Google Calendar, or Outlook and it'll set reminders on its own.
        </p>

        <div className="orto-ribbonscroll">
          <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ minWidth: 720 }} role="img" aria-label="Planting and harvest timeline">
            {monthTicks.map((d, i) => (
              <g key={i}>
                <line x1={x(d)} y1={PAD_T - 16} x2={x(d)} y2={H - 8} stroke="var(--rule)" strokeWidth="1" />
                <text x={x(d) + 5} y={PAD_T - 20} className="svg-mono" fill="var(--ink-soft)" fontSize="11">{MONTHS[d.getMonth()]}</text>
              </g>
            ))}
            <line x1={x(lastFrost)} y1={PAD_T - 26} x2={x(lastFrost)} y2={H - 8} stroke="var(--chicory)" strokeWidth="1.5" strokeDasharray="4 3" />
            <line x1={x(firstFrost)} y1={PAD_T - 26} x2={x(firstFrost)} y2={H - 8} stroke="var(--chicory)" strokeWidth="1.5" strokeDasharray="4 3" />
            <text x={x(lastFrost) + 4} y={PAD_T - 30} className="svg-mono" fill="var(--chicory)" fontSize="10">last frost</text>
            <text x={x(firstFrost) - 52} y={PAD_T - 30} className="svg-mono" fill="var(--chicory)" fontSize="10">first frost</text>

            {schedules.map((s, i) => {
              const y0 = PAD_T + i * ROW;
              const col = FAMILY[s.crop.fam].color;
              const growFrom = s.indoors ?? s.sow ?? s.setOut;
              return (
                <g key={s.crop.id}>
                  <text x="0" y={y0 + 14} fontSize="12" fill="var(--ink)" className="svg-body">{s.crop.name}</text>
                  <text x={LABEL - 26} y={y0 + 14} fontSize="10" fill="var(--ink-soft)" className="svg-mono" textAnchor="end">
                    {Math.max(1, Math.round((gardenTally[s.crop.id] || 0) * s.crop.perSqFt))}
                  </text>
                  {/* growing */}
                  <rect x={x(growFrom)} y={y0 + 4} width={Math.max(2, x(s.harvestStart) - x(growFrom))} height="12" rx="2" fill={col} opacity="0.18" />
                  {/* indoor leg */}
                  {s.indoors && (
                    <rect x={x(s.indoors)} y={y0 + 4} width={Math.max(2, x(s.setOut) - x(s.indoors))} height="12" rx="2" fill={col} opacity="0.42" />
                  )}
                  {/* harvest */}
                  <rect x={x(s.harvestStart)} y={y0 + 4} width={Math.max(3, x(s.harvestEnd) - x(s.harvestStart))} height="12" rx="2" fill={col} />
                  {/* sow / setout marks */}
                  {[s.sow, s.setOut].filter(Boolean).map((d, k) => (
                    <circle key={k} cx={x(d)} cy={y0 + 10} r="3.2" fill="var(--paper)" stroke={col} strokeWidth="1.8" />
                  ))}
                  {s.successions.map((d, k) => (
                    <circle key={"s" + k} cx={x(d)} cy={y0 + 10} r="2" fill={col} opacity="0.75" />
                  ))}
                </g>
              );
            })}
            {fruitRows.length > 0 && (() => {
              const y0 = PAD_T + schedules.length * ROW + 12;
              return (
                <g>
                  <line x1="0" y1={y0 - 2} x2={W - 16} y2={y0 - 2} stroke="var(--rule)" strokeWidth="1" />
                  <text x="0" y={y0 + 11} fontSize="9.5" className="svg-mono" fill="var(--berry)">PERENNIAL FRUIT</text>
                </g>
              );
            })()}
            {fruitRows.map((f, i) => {
              const y0 = PAD_T + (schedules.length + i) * ROW + 26;
              return (
                <g key={f.key}>
                  <text x="0" y={y0 + 14} fontSize="12" fill="var(--ink)" className="svg-body">{f.name}</text>
                  <rect x={x(f.start)} y={y0 + 4} width={Math.max(3, x(f.end) - x(f.start))} height="12" rx="2"
                    fill="var(--berry)" opacity={f.bearing ? 1 : 0.28} />
                  {!f.bearing && (
                    <text x={x(f.end) + 6} y={y0 + 14} fontSize="9.5" className="svg-mono" fill="var(--ink-soft)">
                      from {f.bearsIn}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        <div className="orto-legend mono">
          <span><i className="lg lg-a" /> started indoors</span>
          <span><i className="lg lg-b" /> growing</span>
          <span><i className="lg lg-c" /> harvest window</span>
          <span><i className="lg lg-d" /> sowing date</span>
          <span className="orto-fine">Number beside each name is total plants across all beds.</span>
        </div>
      </div>

      <div className="orto-panel">
        <div className="orto-bedhead">
          <h2 className="orto-h2">What to do, month by month</h2>
          <span className="mono orto-fine">{doneCount} of {tasks.length} done</span>
        </div>
        {Object.keys(byMonth).sort((a, b) => {
          const [ay, am] = a.split("-").map(Number), [by, bm] = b.split("-").map(Number);
          return ay - by || am - bm;
        }).map((k) => {
          const [yy, mm] = k.split("-").map(Number);
          return (
            <div key={k} className="orto-month">
              <h3 className="orto-h3">{MONTHS[mm]} {yy !== year ? yy : ""}</h3>
              <ul className="orto-tasklist">
                {byMonth[k].map((t) => {
                  const done = !!taskDone[t.key];
                  return (
                    <li key={t.key} className={"orto-task " + t.kind + (done ? " done" : "")}>
                      <input type="checkbox" className="orto-taskcheck" checked={done} onChange={() => toggleTaskDone(t.key)} />
                      <span className="mono orto-taskdate">{String(t.d.getDate()).padStart(2, "0")}</span>
                      <span className="orto-swatch sm" style={{ background: FAMILY[t.crop ? t.crop.fam : t.fam].color }} />
                      <span>{t.text}</span>
                      <button className="orto-caladd" title="Add just this date to your calendar"
                        onClick={() => downloadICS([t], t.text, "reminder.ics")}>+cal</button>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================
   Build tab — lumber, cut list, shopping list
   ============================================================ */

function BuildTab({ beds, build, setBuild, updateBed }) {
  const [openBed, setOpenBed] = useState(null);
  const board = BOARDS[build.board];
  const mat = MATERIALS[build.material];

  const builds = useMemo(() => beds.map((b) => bedBuild(b, build)), [beds, build]);

  /* every piece across every bed, packed together — buying in one go wastes less */
  const allPieces = useMemo(() => builds.flatMap((x) => x.pieces), [builds]);
  const pack = useMemo(() => bestPack(allPieces), [allPieces]);

  const posts = useMemo(() => {
    if (!build.posts) return null;
    const per = builds[0]?.postLenIn ?? 0;
    const each = builds.map((x) => ({ n: 4, len: x.postLenIn }));
    const total = each.reduce((n, e) => n + e.n, 0);
    const maxLen = Math.max(...builds.map((x) => x.postLenIn), 0);
    const perStock = Math.floor((8 * 12) / (maxLen + KERF));
    return { total, maxLen, per, stock8: Math.ceil(total / Math.max(perStock, 1)), perStock };
  }, [builds, build.posts]);

  const totals = useMemo(() => {
    const screws = builds.reduce((n, x) => n + x.screws, 0);
    const fabric = builds.reduce((n, x) => n + x.fabricSqFt, 0);
    const soil = builds.reduce((n, x) => n + x.soilCuFt, 0);
    const boardFt = pack ? pack.totalFt : 0;
    const lumberCost = boardFt * (build.ppf || 0) * board.priceMult;
    return { screws, fabric, soil, boardFt, lumberCost, bars: pack?.bars.length ?? 0 };
  }, [builds, pack, build.ppf, board.priceMult]);

  const oversize = pack?.oversize ?? [];

  return (
    <div className="orto-build">
      <section className="orto-panel">
        <div className="orto-bedhead">
          <div>
            <h2 className="orto-h2">Build the beds</h2>
            <p className="orto-fine">{beds.length} beds · {totals.bars} boards · {totals.boardFt} linear feet</p>
          </div>
        </div>

        <div className="orto-buildopts">
          <label>Board
            <select className="orto-input" value={build.board} onChange={(e) => setBuild({ board: e.target.value })}>
              {Object.entries(BOARDS).map(([k, v]) => <option key={k} value={k}>{v.label} ({v.h}″ tall)</option>)}
            </select>
          </label>
          <label>Material
            <select className="orto-input" value={build.material} onChange={(e) => setBuild({ material: e.target.value, ppf: MATERIALS[e.target.value].ppf })}>
              {Object.entries(MATERIALS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </label>
          <label>Your price per linear ft
            <input className="orto-input mono" type="number" min="0" step="0.05" value={build.ppf}
              onChange={(e) => setBuild({ ppf: Number(e.target.value) || 0 })} />
          </label>
          <div className="orto-toggles mono">
            <button className={build.posts ? "on" : ""} onClick={() => setBuild({ posts: !build.posts })}>Corner posts</button>
            <button className={build.fabric ? "on" : ""} onClick={() => setBuild({ fabric: !build.fabric })}>Ground fabric</button>
          </div>
        </div>

        <p className="orto-note ok">{mat.label} · {mat.life} · {mat.note}</p>

        {oversize.length > 0 && (
          <p className="orto-note warn">
            {oversize.length} {oversize.length === 1 ? "piece is" : "pieces are"} longer than a 16 ft board and will need splicing over a post.
          </p>
        )}

        <h3 className="orto-h3">Cut list</h3>
        <p className="orto-fine">
          {board.label} boards, {builds[0]?.courses ?? 1} {(builds[0]?.courses ?? 1) === 1 ? "course" : "courses"} high.
          Long sides run the full length; ends fit between them
          {build.posts ? ", screwed into corner posts." : ", butted inside the long boards."}
        </p>

        <div className="orto-cutlist">
          {builds.map((x) => {
            const open = openBed === x.bed.id;
            return (
              <div key={x.bed.id} className="orto-cutbed">
                <button className="orto-cuthead" onClick={() => setOpenBed(open ? null : x.bed.id)}>
                  <strong>{x.bed.name}</strong>
                  <span className="mono">{x.bed.w}×{x.bed.l}</span>
                  <span className="mono orto-cutwall">{inchesToFtIn(x.wallIn)} tall</span>
                  <span className="mono orto-cutn">{x.pieces.length} pieces</span>
                </button>
                {open && (
                  <div className="orto-cutdetail">
                    <table className="orto-cuttable">
                      <tbody>
                        <tr>
                          <td className="mono">{x.courses * 2}</td>
                          <td>sides</td>
                          <td className="mono">{inchesToFtIn(x.longIn)}</td>
                          <td className="orto-fine">full length, no cut needed on a matching board</td>
                        </tr>
                        <tr>
                          <td className="mono">{x.courses * 2}</td>
                          <td>ends</td>
                          <td className="mono">{inchesToFtIn(x.shortIn)}</td>
                          <td className="orto-fine">{build.posts ? "full inside width" : `${Math.min(x.bed.w, x.bed.l)} ft less two board thicknesses`}</td>
                        </tr>
                        {build.posts && (
                          <tr>
                            <td className="mono">4</td>
                            <td>corner posts</td>
                            <td className="mono">{inchesToFtIn(x.postLenIn)}</td>
                            <td className="orto-fine">4×4, wall height plus 10″ driven in</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                    <p className="orto-fine">
                      {x.screws} screws · {x.fabricSqFt} sq ft fabric · {x.soilCuFt.toFixed(1)} cu ft soil
                    </p>
                    <label className="orto-inline mono">
                      depth <input type="number" min="4" max="36" value={x.bed.depth ?? 12}
                        onChange={(e) => updateBed(x.bed.id, { depth: Number(e.target.value) || 12 })} /> in
                    </label>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {pack && (
          <>
            <h3 className="orto-h3">How the boards get cut</h3>
            <p className="orto-fine">
              {pack.wasteIn < 6
                ? `${pack.bars.length} boards at ${pack.stockFt} ft covers it with essentially nothing left over.`
                : `Buying ${pack.bars.length} boards at ${pack.stockFt} ft wastes the least — about ${inchesToFtIn(pack.wasteIn)} of offcut in total.`}
            </p>

            <table className="orto-stocktable">
              <thead>
                <tr><th>Stock</th><th>Boards</th><th>Linear ft</th><th>Offcut</th><th></th></tr>
              </thead>
              <tbody>
                {STOCK_LENGTHS.map((L) => {
                  const r = packPieces(allPieces, L);
                  const chosen = L === pack.stockFt;
                  return (
                    <tr key={L} className={chosen ? "cur" : ""}>
                      <td className="mono">{L} ft</td>
                      <td className="mono">{r.oversize.length ? "—" : r.bars.length}</td>
                      <td className="mono">{r.oversize.length ? "—" : r.totalFt}</td>
                      <td className="mono">{r.oversize.length ? "—" : inchesToFtIn(r.wasteIn)}</td>
                      <td className="orto-fine">
                        {r.oversize.length
                          ? `${r.oversize.length} ${r.oversize.length === 1 ? "piece is" : "pieces are"} too long`
                          : chosen ? "least material" : ""}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="orto-fine">
              Fewer, longer boards mean fewer joins but a harder load to get home. Shorter stock with no waste is
              usually the better buy if the numbers come out even.
            </p>

            <div className="orto-barlist">
              {pack.bars.map((bar, i) => (
                <div key={i} className="orto-bar">
                  <span className="mono orto-barno">{String(i + 1).padStart(2, "0")}</span>
                  <div className="orto-bargraph">
                    {bar.cuts.map((c, j) => (
                      <span key={j} className="orto-barseg" style={{ flexGrow: c.len }} title={c.label}>
                        <i className="mono">{inchesToFtIn(c.len)}</i>
                      </span>
                    ))}
                    {pack.stockFt * 12 - bar.used > 1 && (
                      <span className="orto-barwaste" style={{ flexGrow: pack.stockFt * 12 - bar.used }}>
                        <i className="mono">{inchesToFtIn(pack.stockFt * 12 - bar.used)}</i>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      <aside className="orto-panel orto-buildside">
        <h2 className="orto-h2">Shopping list</h2>

        <div className="orto-buyrow">
          <span className="mono orto-buyn">{pack?.bars.length ?? 0}</span>
          <span>
            <strong>{board.label} × {pack?.stockFt ?? 8} ft</strong>
            <i>{mat.label}</i>
          </span>
        </div>

        {build.posts && posts && (
          <div className="orto-buyrow">
            <span className="mono orto-buyn">{posts.stock8}</span>
            <span>
              <strong>4×4 × 8 ft</strong>
              <i>{posts.total} posts at {inchesToFtIn(posts.maxLen)}, {posts.perStock} from each board</i>
            </span>
          </div>
        )}

        <div className="orto-buyrow">
          <span className="mono orto-buyn">{Math.ceil((totals.screws * 1.15) / 100) * 100}</span>
          <span>
            <strong>3″ exterior screws</strong>
            <i>{totals.screws} needed, rounded up with spares</i>
          </span>
        </div>

        {build.fabric && (
          <div className="orto-buyrow">
            <span className="mono orto-buyn">{Math.ceil(totals.fabric * 1.1)}</span>
            <span>
              <strong>sq ft ground fabric</strong>
              <i>bed footprints plus 10% overlap</i>
            </span>
          </div>
        )}

        <div className="orto-buyrow">
          <span className="mono orto-buyn">{(totals.soil / 27).toFixed(1)}</span>
          <span>
            <strong>cubic yards of soil</strong>
            <i>{totals.soil.toFixed(0)} cu ft — {(totals.soil / 3).toFixed(0)} cu ft each of compost, peat, vermiculite</i>
          </span>
        </div>

        <h3 className="orto-h3">Soil, if you buy it bagged</h3>
        <ul className="orto-mix">
          <li><span className="mono">{Math.ceil(((totals.soil / 3) * 28.32) / 25)}</span> bags compost, 25 L</li>
          <li><span className="mono">{Math.ceil((totals.soil / 3) / 3.8)}</span> bales peat, 3.8 cu ft</li>
          <li><span className="mono">{Math.ceil((totals.soil / 3) / 4)}</span> bags vermiculite, 4 cu ft</li>
        </ul>
        <p className="orto-fine">
          That's {Math.ceil(((totals.soil / 3) * 28.32) / 25) + Math.ceil((totals.soil / 3) / 3.8) + Math.ceil((totals.soil / 3) / 4)} bags
          to carry. At {(totals.soil / 27).toFixed(1)} cubic yards you're well past the point where bulk delivery of a
          triple mix is cheaper and far less work — bagged only really makes sense for the vermiculite.
        </p>

        <h3 className="orto-h3">Rough cost</h3>
        <p className="orto-costbig mono">
          ${totals.lumberCost.toFixed(0)}<i> lumber</i>
        </p>
        <p className="orto-fine">
          {totals.boardFt} linear ft at ${(build.ppf * board.priceMult).toFixed(2)}/ft for {board.label}.
          Posts, screws, fabric and soil are on top — soil is usually the bigger line once you're buying by the yard.
        </p>
        <p className="orto-fine orto-caveat">
          The price is a placeholder until you put your own in. Check a local mill for hemlock before the big box
          stores; rough-sawn full-dimension boards are often cheaper and thicker than dressed lumber.
        </p>

        <h3 className="orto-h3">Order of work</h3>
        <ol className="orto-worklist">
          <li>Mark the footprints and check the diagonals match before you cut anything.</li>
          <li>Strip sod, or lay cardboard and let it smother over winter.</li>
          <li>Cut ends first, assemble each course flat on the ground, then stack.</li>
          <li>Level each frame in place before filling — much harder afterwards.</li>
          <li>Fill, water it down, top up. It settles more than you expect.</li>
        </ol>
      </aside>
    </div>
  );
}

/* ============================================================
   Seeds tab — the seed box
   ============================================================ */

/* Shared by the Seeds tab and the Summary tab, so "what to order" is computed
   exactly once and can never drift between the two views. */
function computeSeedNeeds(gardenTally) {
  const out = {};
  Object.entries(gardenTally).forEach(([cid, sq]) => {
    const crop = CROP_BY_ID[cid];
    if (!crop) return;
    const plants = Math.max(1, Math.round(sq * crop.perSqFt));
    out[cid] = { crop, sqft: sq, plants, seedsWanted: Math.ceil(plants * sowFactor(crop)) };
  });
  return out;
}
function computeSeedOrder(needs, seeds, today) {
  const byCrop = {};
  seeds.forEach((s) => { (byCrop[s.cropId] = byCrop[s.cropId] || []).push(s); });
  const out = [];
  Object.values(needs).forEach(({ crop, plants, seedsWanted }) => {
    const held = (byCrop[crop.id] || []).filter((s) => {
      const st = seedStanding(s, crop, today);
      return s.fullness !== "empty" && st.key !== "spent";
    });
    const onHand = held.reduce((n, s) => n + Math.round(packetSeeds(crop) * (FULLNESS[s.fullness]?.frac ?? 0) * (s.packets ?? 1)), 0);
    if (!held.length) out.push({ crop, why: "none on hand", plants, need: seedsWanted, propagule: propaguleOf(crop) });
    else if (isTruePacket(crop) && onHand < seedsWanted) out.push({ crop, why: `about ${onHand} on hand, plan wants ~${seedsWanted}`, plants, need: seedsWanted, propagule: propaguleOf(crop) });
  });
  return out.sort((a, b) => a.crop.name.localeCompare(b.crop.name));
}

function SeedsTab({ seeds, gardenTally, addSeed, updateSeed, removeSeed, addSeedTest, year, lastFrost, firstFrost }) {
  const today = new Date();
  const [adding, setAdding] = useState(false);
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState(null);

  /* what the plan asks for, crop by crop */
  const needs = useMemo(() => computeSeedNeeds(gardenTally), [gardenTally]);

  /* seed on hand, grouped by crop */
  const byCrop = useMemo(() => {
    const m = {};
    seeds.forEach((s) => { (m[s.cropId] = m[s.cropId] || []).push(s); });
    return m;
  }, [seeds]);

  const rows = useMemo(() => {
    const list = seeds.map((s) => {
      const crop = CROP_BY_ID[s.cropId];
      const stand = seedStanding(s, crop, today);
      const est = crop ? Math.round(packetSeeds(crop) * (FULLNESS[s.fullness]?.frac ?? 0) * (s.packets ?? 1)) : 0;
      const lastTest = (s.tests || []).slice(-1)[0] || null;
      return { seed: s, crop, stand, est, lastTest, inPlan: !!needs[s.cropId] };
    });
    const needle = q.trim().toLowerCase();
    return list
      .filter((r) => {
        if (needle && !((r.crop?.name || "") + " " + (r.seed.variety || "") + " " + (r.seed.supplier || "")).toLowerCase().includes(needle)) return false;
        if (filter === "attention") return ["test", "spent", "undated"].includes(r.stand.key) || r.seed.fullness === "empty" || r.seed.fullness === "low";
        if (filter === "planned") return r.inPlan;
        return true;
      })
      .sort((a, b) => (a.crop?.name || "").localeCompare(b.crop?.name || "") || (a.seed.variety || "").localeCompare(b.seed.variety || ""));
  }, [seeds, q, filter, needs]);

  /* order list: planned crops with no usable seed, plus packets running out */
  const order = useMemo(() => computeSeedOrder(needs, seeds, today), [needs, seeds]);

  /* seed you hold that this year's plan has no room for */
  const unplanned = useMemo(
    () => Object.keys(byCrop).filter((cid) => CROP_BY_ID[cid] && !needs[cid]).map((cid) => CROP_BY_ID[cid]),
    [byCrop, needs]
  );

  const counts = useMemo(() => {
    const c = { total: seeds.length, attention: 0, spent: 0 };
    seeds.forEach((s) => {
      const st = seedStanding(s, CROP_BY_ID[s.cropId], today);
      if (st.key === "spent") c.spent++;
      if (["test", "spent", "undated"].includes(st.key) || s.fullness === "low" || s.fullness === "empty") c.attention++;
    });
    return c;
  }, [seeds]);

  return (
    <div className="orto-seeds">
      <section className="orto-panel">
        <div className="orto-bedhead">
          <div>
            <h2 className="orto-h2">Seed box</h2>
            <p className="orto-fine">
              {counts.total} {counts.total === 1 ? "packet" : "packets"} recorded
              {counts.attention > 0 && ` · ${counts.attention} needing a look`}
            </p>
          </div>
          <div className="orto-bedtools mono">
            <button onClick={() => setAdding((v) => !v)}>{adding ? "Close" : "+ Add seed"}</button>
          </div>
        </div>

        {adding && <SeedForm onAdd={(e) => { addSeed(e); }} onClose={() => setAdding(false)} year={year} />}

        <div className="orto-seedfilters">
          <input className="orto-input" placeholder="Find a crop, variety, or supplier" value={q} onChange={(e) => setQ(e.target.value)} />
          <div className="orto-segmented mono">
            {[["all", "All"], ["planned", "In the plan"], ["attention", "Needs a look"]].map(([k, l]) => (
              <button key={k} className={filter === k ? "on" : ""} onClick={() => setFilter(k)}>{l}</button>
            ))}
          </div>
        </div>

        {seeds.length === 0 && (
          <p className="orto-empty">
            Nothing recorded yet. Add what's in the seed box — crop, variety, roughly how full the packet is,
            and the year on the front. The date matters more than the count.
          </p>
        )}

        {seeds.length > 0 && rows.length === 0 && <p className="orto-empty">No packets match that.</p>}

        <div className="orto-seedlist">
          {rows.map(({ seed, crop, stand, est, lastTest, inPlan }) => {
            const open = openId === seed.id;
            const need = needs[seed.cropId];
            return (
              <div key={seed.id} className={"orto-seedcard " + stand.key}>
                <button className="orto-seedmain" onClick={() => setOpenId(open ? null : seed.id)}>
                  <span className="orto-swatch" style={{ background: crop ? FAMILY[crop.fam].color : "#999" }} />
                  <span className="orto-seedname">
                    <strong>{seed.variety || (crop ? crop.name : "Unknown")}</strong>
                    {seed.variety && crop && <i>{crop.name}</i>}
                  </span>
                  <span className="mono orto-seedfull">{FULLNESS[seed.fullness]?.label ?? "—"}</span>
                  <span className={"orto-standing " + stand.key}>{stand.label}</span>
                  {inPlan && <span className="orto-inplan mono">in plan</span>}
                </button>

                {open && (
                  <div className="orto-seeddetail">
                    <div className="orto-formrow">
                      <label>Variety<input className="orto-input" value={seed.variety || ""} onChange={(e) => updateSeed(seed.id, { variety: e.target.value })} placeholder="e.g. San Marzano" /></label>
                      <label>Supplier<input className="orto-input" value={seed.supplier || ""} onChange={(e) => updateSeed(seed.id, { supplier: e.target.value })} placeholder="e.g. Veseys" /></label>
                      <label>Packed for<input className="orto-input mono" type="number" min="2000" max="2100" value={seed.year || ""} onChange={(e) => updateSeed(seed.id, { year: e.target.value })} /></label>
                      <label>Packets<input className="orto-input mono" type="number" min="1" max="99" value={seed.packets ?? 1} onChange={(e) => updateSeed(seed.id, { packets: Number(e.target.value) || 1 })} /></label>
                    </div>

                    <div className="orto-fullpick mono">
                      {Object.entries(FULLNESS).map(([k, v]) => (
                        <button key={k} className={seed.fullness === k ? "on" : ""} onClick={() => updateSeed(seed.id, { fullness: k })}>{v.label}</button>
                      ))}
                    </div>

                    <div className="orto-seedfacts">
                      {crop && isTruePacket(crop) && (
                        <p className="orto-fine">
                          Roughly {est} seeds on hand, if a full packet holds about {packetSeeds(crop)}.
                          {need && ` The plan wants ~${need.seedsWanted} for ${need.plants} ${need.plants === 1 ? "plant" : "plants"}.`}
                        </p>
                      )}
                      {crop && !isTruePacket(crop) && (
                        <p className="orto-fine">Grown from {propaguleOf(crop)}, not seed — the count above is a rough stand-in.</p>
                      )}
                      {crop && isTruePacket(crop) && <p className="orto-fine">{crop.name} keeps about {seedLife(crop)} {seedLife(crop) === 1 ? "year" : "years"} stored cool and dry.</p>}
                    </div>

                    <VarietyLookup seed={seed} crop={crop} onSave={(info) => updateSeed(seed.id, { aiInfo: info })} />

                    <label className="orto-notefield">Notes
                      <textarea className="orto-input" rows="2" value={seed.notes || ""} onChange={(e) => updateSeed(seed.id, { notes: e.target.value })} placeholder="Where it came from, how it did, what to try next" />
                    </label>

                    <GermTest seed={seed} onTest={addSeedTest} lastTest={lastTest} />

                    <div className="orto-bedtools mono">
                      <ConfirmButton label="Remove packet" onConfirm={() => { removeSeed(seed.id); setOpenId(null); }} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <aside className="orto-panel orto-seedside">
        <h2 className="orto-h2">To order</h2>
        {Object.keys(needs).length === 0 && (
          <p className="orto-empty">Plant something in the Plot tab and the order list works itself out from what you hold.</p>
        )}
        {Object.keys(needs).length > 0 && order.length === 0 && (
          <p className="orto-note ok">You have seed for everything in the {year} plan.</p>
        )}
        {order.map(({ crop, why, plants, propagule }) => (
          <div key={crop.id} className="orto-orderrow">
            <div className="orto-row-head">
              <span className="orto-swatch" style={{ background: FAMILY[crop.fam].color }} />
              <strong>{crop.name}</strong>
              <span className="mono orto-count">{plants} {plants === 1 ? "plant" : "plants"}</span>
            </div>
            <p className="orto-fine">{why} · {propagule}</p>
          </div>
        ))}

        {unplanned.length > 0 && (
          <>
            <h3 className="orto-h3">Held but not planted</h3>
            <p className="orto-fine">Seed in the box with no square assigned in {year}.</p>
            <div className="orto-pillwrap">
              {unplanned.map((c) => (
                <span key={c.id} className="orto-fampill" style={{ borderColor: FAMILY[c.fam].color, color: FAMILY[c.fam].color }}>{c.name}</span>
              ))}
            </div>
          </>
        )}

        <h3 className="orto-h3">Keeping seed</h3>
        <p className="orto-fine">
          Cool, dark, dry, in a sealed tin. Onion, leek, parsnip and corn go off fastest — treat anything over a
          year old as suspect. Tomato, brassicas and squash hold four or five years easily. When a packet is past
          its span, run a germination test rather than binning it: ten seeds on damp paper towel in a bag, count
          what sprouts, and sow proportionally thicker.
        </p>
      </aside>
    </div>
  );
}

/* ============================================================
   VarietyLookup — asks Claude (with web search) what a specific
   variety looks like, how it grows, and finds a couple of real photos.
   Result is cached on the seed entry so it doesn't refetch every open.
   ============================================================ */

async function fetchVarietyInfo(cropName, variety) {
  const query = variety ? `${variety} ${cropName}` : cropName;
  const prompt = `Search the web for "${query}" as a specific plant variety a home gardener would grow.
Respond with ONLY a JSON object, no markdown fences, no prose before or after:
{
  "summary": "2-3 sentences in your own words on flavor, appearance, and what makes this variety distinct. Never copy marketing copy verbatim.",
  "growingNotes": "1-2 sentences on anything variety-specific worth knowing — disease resistance, plant size, quirks, why a gardener would pick this over a standard variety.",
  "daysToMaturity": <number or null, if you find a specific figure for this variety>,
  "imageUrls": [<0 to 3 direct image URLs (ending in .jpg/.jpeg/.png/.webp or clearly an image resource) from seed catalogs, nurseries, or gardening sites — only include ones you're confident are real, working, direct image links. Leave empty rather than guess.>],
  "sourceUrls": [{"title": "short site name", "url": "..."}]  // up to 3, sites you actually drew from
}
If you can't find anything specific to this exact variety, describe the general species instead and say so in the summary.`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
      tools: [{ type: "web_search_20250305", name: "web_search" }],
    }),
  });
  if (!response.ok) throw new Error(`API returned ${response.status}`);
  const data = await response.json();
  const text = (data.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
  const clean = text.replace(/```json|```/g, "").trim();
  const jsonStart = clean.indexOf("{");
  const jsonEnd = clean.lastIndexOf("}");
  if (jsonStart === -1 || jsonEnd === -1) throw new Error("No JSON in response");
  const parsed = JSON.parse(clean.slice(jsonStart, jsonEnd + 1));
  return {
    summary: parsed.summary || "",
    growingNotes: parsed.growingNotes || "",
    daysToMaturity: typeof parsed.daysToMaturity === "number" ? parsed.daysToMaturity : null,
    imageUrls: Array.isArray(parsed.imageUrls) ? parsed.imageUrls.slice(0, 3) : [],
    sourceUrls: Array.isArray(parsed.sourceUrls) ? parsed.sourceUrls.slice(0, 3) : [],
    fetchedAt: Date.now(),
  };
}

function VarietyLookup({ seed, crop, onSave }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const info = seed.aiInfo;
  const label = seed.variety ? `${seed.variety} ${crop?.name ?? ""}` : crop?.name;

  const run = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchVarietyInfo(crop?.name ?? "vegetable", seed.variety);
      onSave(result);
    } catch (err) {
      setError("Couldn't look that up — try again in a moment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="orto-lookup">
      <div className="orto-lookuphead">
        <h4 className="orto-h4">What is it?</h4>
        {!loading && (
          <button className="orto-linkbtn" onClick={run}>
            {info ? "look up again" : `look up "${label}"`}
          </button>
        )}
        {loading && <span className="orto-fine">Searching…</span>}
      </div>

      {error && <p className="orto-note warn">{error}</p>}

      {info && !loading && (
        <div className="orto-lookupresult">
          {info.imageUrls.length > 0 && (
            <div className="orto-lookupimages">
              {info.imageUrls.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt={label}
                  onError={(e) => { e.target.style.display = "none"; }}
                />
              ))}
            </div>
          )}
          <p className="orto-fine">{info.summary}</p>
          {info.growingNotes && <p className="orto-fine">{info.growingNotes}</p>}
          {info.daysToMaturity && (
            <p className="orto-fine">
              This variety runs about {info.daysToMaturity} days to maturity
              {crop && Math.abs(info.daysToMaturity - crop.dtm) >= 7
                ? ` — ${info.daysToMaturity > crop.dtm ? "slower" : "faster"} than the ${crop.dtm}-day default this app uses for ${crop.name.toLowerCase()}.`
                : "."}
            </p>
          )}
          {info.sourceUrls.length > 0 && (
            <p className="orto-fine orto-lookupsources">
              {info.sourceUrls.map((s, i) => (
                <span key={i}>
                  {i > 0 && " · "}
                  <a href={s.url} target="_blank" rel="noopener noreferrer">{s.title}</a>
                </span>
              ))}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* A delete button that asks once, inline, before it acts. Not a native
   confirm() — those aren't reliable inside a sandboxed artifact frame. */
function ConfirmButton({ onConfirm, label = "Remove", className = "danger" }) {
  const [armed, setArmed] = useState(false);
  useEffect(() => { setArmed(false); }, [onConfirm]);
  if (armed) {
    return (
      <span className="orto-confirmpair">
        <button className={className} onClick={onConfirm}>Confirm</button>
        <button onClick={() => setArmed(false)}>Cancel</button>
      </span>
    );
  }
  return <button className={className} onClick={() => setArmed(true)}>{label}</button>;
}

function GermTest({ seed, onTest, lastTest }) {
  const [open, setOpen] = useState(false);
  const [n, setN] = useState(10);
  const [up, setUp] = useState("");
  const rate = lastTest ? lastTest.rate : null;
  return (
    <div className="orto-germ">
      <div className="orto-germhead">
        <h4 className="orto-h4">Germination test</h4>
        {rate != null && <span className={"mono orto-rate " + (rate >= 70 ? "ok" : rate >= 40 ? "mid" : "bad")}>{rate}% · {lastTest.date}</span>}
        <button className="mono orto-linkbtn" onClick={() => setOpen((v) => !v)}>{open ? "Cancel" : "Record a test"}</button>
      </div>
      {open && (
        <div className="orto-germform">
          <label className="mono">Seeds set<input type="number" min="1" max="100" value={n} onChange={(e) => setN(Number(e.target.value) || 1)} /></label>
          <label className="mono">Came up<input type="number" min="0" max={n} value={up} onChange={(e) => setUp(e.target.value)} /></label>
          <button
            className="mono"
            disabled={up === ""}
            onClick={() => {
              const r = Math.round((Number(up) / n) * 100);
              onTest(seed.id, toISO(new Date()), r);
              setUp(""); setOpen(false);
            }}
          >Save</button>
        </div>
      )}
      {rate != null && rate < 70 && (
        <p className="orto-fine">At {rate}%, sow about {Math.round(100 / Math.max(rate, 5))}× as thick as normal to land the stand you want.</p>
      )}
    </div>
  );
}

function SeedForm({ onAdd, onClose, year }) {
  const [cropId, setCropId] = useState("tomato");
  const [variety, setVariety] = useState("");
  const [supplier, setSupplier] = useState("");
  const [yr, setYr] = useState(String(year));
  const [fullness, setFullness] = useState("full");
  const [packets, setPackets] = useState(1);
  const [showInfo, setShowInfo] = useState(false);
  const crop = CROP_BY_ID[cropId];

  const submit = (keepOpen) => {
    onAdd({ cropId, variety: variety.trim(), supplier: supplier.trim(), year: yr, fullness, packets });
    setVariety(""); 
    if (!keepOpen) onClose();
  };

  return (
    <div className="orto-seedform">
      <div className="orto-formrow">
        <label>Crop
          <select className="orto-input" value={cropId} onChange={(e) => setCropId(e.target.value)}>
            {Object.keys(FAMILY).map((f) => {
              const list = CROPS.filter((c) => c.fam === f);
              if (!list.length) return null;
              return (
                <optgroup key={f} label={FAMILY[f].label}>
                  {list.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </optgroup>
              );
            })}
          </select>
        </label>
        <label>Variety<input className="orto-input" value={variety} onChange={(e) => setVariety(e.target.value)} placeholder="e.g. Sungold" /></label>
        <label>Supplier<input className="orto-input" value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="Optional" /></label>
        <label>Packed for<input className="orto-input mono" type="number" min="2000" max="2100" value={yr} onChange={(e) => setYr(e.target.value)} /></label>
        <label>Packets<input className="orto-input mono" type="number" min="1" max="99" value={packets} onChange={(e) => setPackets(Number(e.target.value) || 1)} /></label>
      </div>
      <div className="orto-fullpick mono">
        {Object.entries(FULLNESS).map(([k, v]) => (
          <button key={k} className={fullness === k ? "on" : ""} onClick={() => setFullness(k)}>{v.label}</button>
        ))}
      </div>
      {crop && (
        <p className="orto-fine">
          {crop.name} comes as {propaguleOf(crop)}
          {isTruePacket(crop) ? ` and keeps about ${seedLife(crop)} ${seedLife(crop) === 1 ? "year" : "years"}.` : " — replanted each season rather than stored."}
          {" "}<button className="orto-linkbtn" onClick={() => setShowInfo((v) => !v)}>{showInfo ? "hide growing info" : "growing info"}</button>
        </p>
      )}
      {showInfo && crop && <PlantInfoCard crop={crop} schedule={null} />}
      <div className="orto-bedtools mono">
        <button onClick={() => submit(true)}>Add and keep going</button>
        <button onClick={() => submit(false)}>Add and close</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}

/* ============================================================
   Ledger tab — rotation history
   ============================================================ */

function LedgerTab({ beds, plans, year }) {
  const years = Object.keys(plans).map(Number).sort();
  const famsIn = (arr) => {
    const t = {};
    (arr || []).forEach((id) => { if (id) { const f = CROP_BY_ID[id]?.fam; if (f) t[f] = (t[f] || 0) + 1; } });
    return Object.entries(t).sort((a, b) => b[1] - a[1]);
  };
  const cropsIn = (arr) => {
    const t = {};
    (arr || []).forEach((id) => { if (id) t[id] = (t[id] || 0) + 1; });
    return Object.entries(t).sort((a, b) => b[1] - a[1]).map(([id]) => CROP_BY_ID[id]?.name).filter(Boolean);
  };

  return (
    <div className="orto-panel orto-solo">
      <h2 className="orto-h2">Bed ledger</h2>
      <p className="orto-fine">What each bed has grown, season by season. A repeated family in the same bed is the thing to watch.</p>
      <div className="orto-ledgerscroll">
        <table className="orto-table">
          <thead>
            <tr>
              <th>Bed</th>
              {years.map((y) => <th key={y} className={y === year ? "cur" : ""}>{y}</th>)}
            </tr>
          </thead>
          <tbody>
            {beds.map((b) => (
              <tr key={b.id}>
                <th scope="row">
                  {b.name}
                  <i className="mono">{b.w}×{b.l}</i>
                </th>
                {years.map((y) => {
                  const arr = plans[y]?.[b.id];
                  const fams = famsIn(arr);
                  const prevFams = new Set(famsIn(plans[y - 1]?.[b.id]).map(([f]) => f));
                  return (
                    <td key={y} className={y === year ? "cur" : ""}>
                      {fams.length === 0 && <span className="orto-fine">—</span>}
                      {fams.map(([f, n]) => (
                        <span
                          key={f}
                          className={"orto-fampill " + (prevFams.has(f) ? "repeat" : "")}
                          style={{ borderColor: FAMILY[f].color, color: FAMILY[f].color }}
                          title={prevFams.has(f) ? `Also grown here in ${y - 1}` : ""}
                        >
                          {FAMILY[f].label}<i className="mono">{n}</i>
                        </span>
                      ))}
                      {fams.length > 0 && <p className="orto-fine">{cropsIn(arr).join(", ")}</p>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="orto-rotationkey">
        <h3 className="orto-h3">A workable rotation order</h3>
        <p className="orto-fine">
          Legumes → brassicas → alliums or umbellifers → nightshades or cucurbits, then back to legumes.
          Roughly: the nitrogen fixers feed the heavy leaf feeders, the light feeders follow, and the hungry
          fruiting crops come last before the bed rests or starts over. Aim for a three-year gap before a
          family returns to the same bed.
        </p>
      </div>
    </div>
  );
}

/* ============================================================
   Summary tab — one printable page: what to build, what to buy,
   what to plant when. Reuses the exact same math as Build/Seeds/Season
   so nothing here can drift out of sync with those tabs.
   ============================================================ */

function SummaryTab({ beds, yard, build, seeds, gardenTally, schedules, plantings, year, frost, lastFrost, firstFrost }) {
  const today = new Date();
  const board = BOARDS[build.board];
  const mat = MATERIALS[build.material];

  const builds = useMemo(() => beds.map((b) => bedBuild(b, build)), [beds, build]);
  const allPieces = useMemo(() => builds.flatMap((x) => x.pieces), [builds]);
  const pack = useMemo(() => bestPack(allPieces), [allPieces]);
  const soilCuFt = builds.reduce((n, x) => n + x.soilCuFt, 0);
  const fabricSqFt = builds.reduce((n, x) => n + x.fabricSqFt, 0);
  const screws = builds.reduce((n, x) => n + x.screws, 0);
  const lumberCost = pack ? pack.totalFt * (build.ppf || 0) * board.priceMult : 0;
  const totalSqFt = beds.reduce((n, b) => n + b.w * b.l, 0);

  const needs = useMemo(() => computeSeedNeeds(gardenTally), [gardenTally]);
  const order = useMemo(() => computeSeedOrder(needs, seeds, today), [needs, seeds]);

  /* Same task derivation as the Season tab — every date that matters,
     in one printable table instead of a month-by-month scroll. */
  const calendar = useMemo(() => {
    const list = [];
    schedules.forEach((s) => {
      if (s.indoors) list.push({ d: s.indoors, task: "Start indoors", crop: s.crop.name });
      if (s.setOut) list.push({ d: s.setOut, task: "Set out / transplant", crop: s.crop.name });
      if (s.sow && !s.fallPlanted) list.push({ d: s.sow, task: "Direct sow", crop: s.crop.name });
      if (s.fallPlanted) list.push({ d: s.sow, task: "Plant (fall)", crop: s.crop.name });
      s.successions.forEach((d) => list.push({ d, task: "Succession sow", crop: s.crop.name }));
      if (s.harvestStart) list.push({ d: s.harvestStart, task: s.crop.bloomer ? "Bloom starts" : "Harvest starts", crop: s.crop.name });
    });
    (plantings || []).forEach((p) => {
      const sp = BUSHES[p.speciesId];
      if (!sp) return;
      if (year - Number(p.planted) >= sp.bear) {
        list.push({ d: new Date(year, sp.harvest[0][0], sp.harvest[0][1]), task: "Harvest starts", crop: p.variety || sp.label });
      }
    });
    return list.sort((a, b) => a.d - b.d);
  }, [schedules, plantings, year]);

  const handlePrint = () => window.print();

  return (
    <div className="orto-summary">
      <div className="orto-summary-toolbar no-print">
        <p className="orto-fine">One page — the frost dates, the materials list, what to order, and every planting date for {year}.</p>
        <button className="orto-calbtn" onClick={handlePrint}>Print this page</button>
      </div>

      <div className="orto-printsheet">
        <header className="orto-printhead">
          <h1>Orto — {year} Garden Plan</h1>
          <p className="mono">
            Last frost {fmtDate(lastFrost)} · First frost {fmtDate(firstFrost)} ·
            {" "}{Math.round((firstFrost - lastFrost) / MS_DAY)} frost-free days
          </p>
        </header>

        <section className="orto-printsection">
          <h2>Project</h2>
          <div className="orto-printgrid">
            <div><span>Yard</span><p>{yard.w} ft × {yard.d} ft</p></div>
            <div><span>Beds</span><p>{beds.length}, {totalSqFt} sq ft total</p></div>
            <div><span>Soil needed</span><p>{soilCuFt.toFixed(0)} cu ft ({(soilCuFt / 27).toFixed(1)} cu yd)</p></div>
            <div><span>Compost / peat / vermiculite</span><p>{(soilCuFt / 3).toFixed(0)} cu ft each</p></div>
          </div>
        </section>

        <section className="orto-printsection">
          <h2>Materials to buy</h2>
          {pack ? (
            <div className="orto-printgrid">
              <div><span>Lumber</span><p>{pack.bars.length} × {pack.stockFt} ft {board.label}, {mat.label.toLowerCase()}</p></div>
              <div><span>Board feet</span><p>{pack.totalFt} lin ft{lumberCost > 0 ? ` · ~$${lumberCost.toFixed(0)}` : ""}</p></div>
              {build.posts && <div><span>Corner posts</span><p>{builds.length * 4} × 2×4</p></div>}
              {build.fabric && <div><span>Landscape fabric</span><p>{fabricSqFt.toFixed(0)} sq ft</p></div>}
              <div><span>Screws</span><p>~{screws}</p></div>
            </div>
          ) : (
            <p className="orto-fine">No beds to build yet — add some in the Yard tab.</p>
          )}
        </section>

        <section className="orto-printsection">
          <h2>Seeds to order</h2>
          {order.length === 0 ? (
            <p className="orto-fine">Everything in the {year} plan is already on hand.</p>
          ) : (
            <table className="orto-printtable">
              <thead><tr><th>Crop</th><th>Why</th><th>Comes as</th></tr></thead>
              <tbody>
                {order.map((o) => (
                  <tr key={o.crop.id}><td>{o.crop.name}</td><td>{o.why}</td><td>{o.propagule}</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="orto-printsection orto-printcalendar">
          <h2>Planting calendar</h2>
          {calendar.length === 0 ? (
            <p className="orto-fine">Plant something in the Plot tab and this fills in on its own.</p>
          ) : (
            <table className="orto-printtable">
              <thead><tr><th>Date</th><th>Task</th><th>Crop</th></tr></thead>
              <tbody>
                {calendar.map((c, i) => (
                  <tr key={i}><td className="mono">{fmtDate(c.d)}</td><td>{c.task}</td><td>{c.crop}</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <p className="orto-printfoot">Generated by Orto · {fmtDate(today)}</p>
      </div>
    </div>
  );
}

/* ============================================================
   Small pieces
   ============================================================ */

/* ============================================================
   PlantInfoCard — the full growing detail for one crop.
   Reused wherever a crop shows up: bed inspector, palette, seed form.
   ============================================================ */

function PlantInfoCard({ crop, schedule }) {
  const s = schedule;
  const compNames = crop.comp.map((id) => CROP_BY_ID[id]?.name).filter(Boolean);
  const antiNames = crop.anti.map((id) => CROP_BY_ID[id]?.name).filter(Boolean);
  return (
    <div className="orto-plantcard">
      <div className="orto-plantgrid">
        <div><span className="orto-plantlabel">Sow depth</span><p>{depthLabel(crop)}</p></div>
        <div><span className="orto-plantlabel">Spacing</span><p>{crop.spacing}</p></div>
        <div><span className="orto-plantlabel">Sun</span><p>{crop.sun}</p></div>
        <div><span className="orto-plantlabel">Water</span><p>{crop.water}</p></div>
        <div><span className="orto-plantlabel">Days to maturity</span><p>{crop.dtm}</p></div>
        <div><span className="orto-plantlabel">Family</span><p>{FAMILY[crop.fam].label}</p></div>
      </div>

      {s && (
        <div className="orto-plantdates">
          <span className="orto-plantlabel">This season</span>
          <p className="mono">
            {s.fallPlanted
              ? `Plant ${fmtDate(s.sow)} (fall) → harvest ${fmtDate(s.harvestStart)}`
              : s.indoors
              ? `Start indoors ${fmtDate(s.indoors)} → set out ${fmtDate(s.setOut)} → ${crop.bloomer ? "bloom" : "pick"} ${fmtDate(s.harvestStart)}–${fmtDate(s.harvestEnd)}`
              : `Sow ${fmtDate(s.sow)} → ${crop.bloomer ? "bloom" : "pick"} ${fmtDate(s.harvestStart)}–${fmtDate(s.harvestEnd)}`}
          </p>
          {s.successions.length > 0 && (
            <p className="orto-fine">Succession sow again: {s.successions.map(fmtDate).join(", ")}</p>
          )}
        </div>
      )}

      {compNames.length > 0 && (
        <p className="orto-fine"><strong>Grows well with</strong> {compNames.join(", ")}</p>
      )}
      {antiNames.length > 0 && (
        <p className="orto-fine orto-antitext"><strong>Avoid near</strong> {antiNames.join(", ")}</p>
      )}
      <p className="orto-fine orto-caveat">
        Rotation guidance is well supported. Companion pairings are traditional — treat them as a tiebreaker, not a rule.
      </p>
    </div>
  );
}

/* ============================================================
   DesignSwitcher — open, create, rename, delete saved gardens
   ============================================================ */

function relTime(ms) {
  const days = Math.floor((Date.now() - ms) / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 60) return `${Math.round(days / 7)} wk ago`;
  return `${Math.round(days / 30)} mo ago`;
}

function DesignSwitcher({ designs, currentId, onOpen, onCreate, onRename, onDelete, onClose }) {
  const [mode, setMode] = useState("list"); // list | newBlank | newCopy
  const [name, setName] = useState("");
  const [renamingId, setRenamingId] = useState(null);
  const [renameText, setRenameText] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const sorted = designs.slice().sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div className="orto-designpop">
      {mode === "list" && (
        <>
          <ul className="orto-designlist">
            {sorted.map((d) => (
              <li key={d.id} className={d.id === currentId ? "cur" : ""}>
                {renamingId === d.id ? (
                  <input
                    className="orto-input"
                    autoFocus
                    value={renameText}
                    onChange={(e) => setRenameText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { onRename(d.id, renameText); setRenamingId(null); }
                      if (e.key === "Escape") setRenamingId(null);
                    }}
                    onBlur={() => { onRename(d.id, renameText); setRenamingId(null); }}
                  />
                ) : (
                  <button className="orto-designopen" onClick={() => onOpen(d.id)}>
                    <span>{d.name}</span>
                    <i className="mono">{d.id === currentId ? "current" : relTime(d.updatedAt)}</i>
                  </button>
                )}
                {confirmDeleteId === d.id ? (
                  <>
                    <button className="orto-linkbtn danger" onClick={() => { onDelete(d.id); setConfirmDeleteId(null); }}>confirm</button>
                    <button className="orto-linkbtn" onClick={() => setConfirmDeleteId(null)}>cancel</button>
                  </>
                ) : (
                  <>
                    <button className="orto-linkbtn" onClick={() => { setRenamingId(d.id); setRenameText(d.name); }}>rename</button>
                    {designs.length > 1 && (
                      <button className="orto-linkbtn danger" onClick={() => setConfirmDeleteId(d.id)}>delete</button>
                    )}
                  </>
                )}
              </li>
            ))}
          </ul>
          <div className="orto-bedtools mono">
            <button onClick={() => { setMode("newCopy"); setName(""); }}>Duplicate current</button>
            <button onClick={() => { setMode("newBlank"); setName(""); }}>Start blank</button>
            <button onClick={onClose}>Close</button>
          </div>
        </>
      )}

      {(mode === "newBlank" || mode === "newCopy") && (
        <>
          <p className="orto-fine">
            {mode === "newBlank"
              ? "A new garden with no beds, no yard shape, nothing carried over — a clean start."
              : "A copy of the current garden, beds and all, that you can change independently."}
          </p>
          <input
            className="orto-input"
            autoFocus
            placeholder="Name this design"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && name.trim()) { onCreate(name, mode === "newBlank"); setMode("list"); } }}
          />
          <div className="orto-bedtools mono">
            <button disabled={!name.trim()} onClick={() => { onCreate(name, mode === "newBlank"); setMode("list"); }}>Create</button>
            <button onClick={() => setMode("list")}>Back</button>
          </div>
        </>
      )}
    </div>
  );
}

/* ============================================================
   CustomCropForm — for anything not on the built-in list.
   Produces a crop object in the exact same shape as CROPS entries,
   so it works everywhere in the app without a separate code path.
   ============================================================ */

function CustomCropForm({ onAdd, onCancel }) {
  const [name, setName] = useState("");
  const [fam, setFam] = useState("other");
  const [perSqFt, setPerSqFt] = useState(1);
  const [spacing, setSpacing] = useState("12 in");
  const [dtm, setDtm] = useState(60);
  const [timing, setTiming] = useState("direct"); // direct | indoors | perennial
  const [direct, setDirect] = useState(0);
  const [indoors, setIndoors] = useState(-6);
  const [transplant, setTransplant] = useState(1);
  const [tender, setTender] = useState("half-hardy");
  const [harvestSpan, setHarvestSpan] = useState(21);
  const [succession, setSuccession] = useState("");
  const [bloomStart, setBloomStart] = useState("2001-05-15");
  const [bloomEnd, setBloomEnd] = useState("2001-06-15");
  const [sowDepth, setSowDepth] = useState(0.25);
  const [sun, setSun] = useState("Full sun");
  const [water, setWater] = useState("1 in/week");
  const [companionNotes, setCompanionNotes] = useState("");
  const [bloomer, setBloomer] = useState(false);

  const valid = name.trim().length > 0 && dtm > 0;

  const submit = () => {
    const crop = {
      id: newCropId(name),
      name: name.trim(),
      fam,
      perSqFt: Number(perSqFt) || 1,
      spacing: spacing.trim() || "12 in",
      dtm: Number(dtm) || 60,
      sowDepth: timing === "perennial" ? null : (sowDepth === "" ? null : Number(sowDepth)),
      sun: sun.trim() || "Full sun",
      water: water.trim() || "1 in/week",
      tender,
      harvestSpan: Number(harvestSpan) || 21,
      comp: [], anti: [],
      custom: true,
      companionNotes: companionNotes.trim() || undefined,
      bloomer: bloomer || undefined,
    };
    if (timing === "direct") crop.direct = Number(direct) || 0;
    if (timing === "indoors") { crop.indoors = Number(indoors) || -6; crop.transplant = Number(transplant) || 1; }
    if (timing === "perennial") {
      crop.perennialPlant = true;
      crop.transplant = Number(transplant) || 0;
      // Perennials crop on their own calendar, not from days-to-maturity —
      // dtm for a perennial is often a year or more, which breaks that math.
      const s = new Date(bloomStart + "T00:00:00"), e = new Date(bloomEnd + "T00:00:00");
      crop.harvestWindow = [[s.getMonth(), s.getDate()], [e.getMonth(), e.getDate()]];
    }
    if (succession !== "" && timing === "direct") crop.succession = Number(succession);
    onAdd(crop);
  };

  return (
    <div className="orto-panel orto-cropform">
      <h3 className="orto-h3">Add a crop</h3>
      <div className="orto-formrow">
        <label>Name<input className="orto-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ground cherry" /></label>
        <label>Family
          <select className="orto-input" value={fam} onChange={(e) => setFam(e.target.value)}>
            {Object.entries(FAMILY).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </label>
        <label>Plants per sq ft<input className="orto-input mono" type="number" min="0.1" step="0.1" value={perSqFt} onChange={(e) => setPerSqFt(e.target.value)} /></label>
        <label>Spacing<input className="orto-input" value={spacing} onChange={(e) => setSpacing(e.target.value)} placeholder="e.g. 12 in" /></label>
        <label>Days to maturity<input className="orto-input mono" type="number" min="1" value={dtm} onChange={(e) => setDtm(e.target.value)} /></label>
        <label>Harvest span (days)<input className="orto-input mono" type="number" min="1" value={harvestSpan} onChange={(e) => setHarvestSpan(e.target.value)} /></label>
      </div>

      <p className="orto-fine" style={{ marginTop: 8 }}>How it gets started</p>
      <div className="orto-fullpick mono">
        <button className={timing === "direct" ? "on" : ""} onClick={() => setTiming("direct")}>Direct sow</button>
        <button className={timing === "indoors" ? "on" : ""} onClick={() => setTiming("indoors")}>Start indoors</button>
        <button className={timing === "perennial" ? "on" : ""} onClick={() => setTiming("perennial")}>Perennial / crown</button>
      </div>
      <div className="orto-formrow">
        {timing === "direct" && (
          <>
            <label>Weeks from last frost to sow<input className="orto-input mono" type="number" value={direct} onChange={(e) => setDirect(e.target.value)} /></label>
            <label>Succession, every N days (optional)<input className="orto-input mono" type="number" placeholder="—" value={succession} onChange={(e) => setSuccession(e.target.value)} /></label>
          </>
        )}
        {timing === "indoors" && (
          <>
            <label>Weeks from frost to start indoors<input className="orto-input mono" type="number" value={indoors} onChange={(e) => setIndoors(e.target.value)} /></label>
            <label>Weeks from frost to set out<input className="orto-input mono" type="number" value={transplant} onChange={(e) => setTransplant(e.target.value)} /></label>
          </>
        )}
        {timing === "perennial" && (
          <>
            <label>Weeks from frost to plant<input className="orto-input mono" type="number" value={transplant} onChange={(e) => setTransplant(e.target.value)} /></label>
            <label>Typically harvests from<input className="orto-input mono" type="date" value={bloomStart} onChange={(e) => setBloomStart(e.target.value)} /></label>
            <label>Through<input className="orto-input mono" type="date" value={bloomEnd} onChange={(e) => setBloomEnd(e.target.value)} /></label>
          </>
        )}
      </div>

      <div className="orto-formrow" style={{ marginTop: 8 }}>
        <label>Cold tolerance
          <select className="orto-input" value={tender} onChange={(e) => setTender(e.target.value)}>
            <option value="hardy">Hardy — shrugs off frost</option>
            <option value="half-hardy">Half-hardy — light frost only</option>
            <option value="tender">Tender — dies at first frost</option>
          </select>
        </label>
        <label>Sow depth, inches{timing === "perennial" && <i className="orto-fine"> (set at soil level instead)</i>}
          <input className="orto-input mono" type="number" step="0.125" min="0" disabled={timing === "perennial"} value={timing === "perennial" ? "" : sowDepth} onChange={(e) => setSowDepth(e.target.value)} />
        </label>
        <label>Sun<input className="orto-input" value={sun} onChange={(e) => setSun(e.target.value)} /></label>
        <label>Water<input className="orto-input" value={water} onChange={(e) => setWater(e.target.value)} /></label>
      </div>

      <label className="orto-notefield">Companion notes (optional — free text, not linked to specific crops yet)
        <textarea className="orto-input" rows="2" value={companionNotes} onChange={(e) => setCompanionNotes(e.target.value)} placeholder="e.g. Does well near tomatoes and basil" />
      </label>

      <label className="orto-checkline">
        <input type="checkbox" checked={bloomer} onChange={(e) => setBloomer(e.target.checked)} />
        This is a flower, not something you'd eat
      </label>

      <div className="orto-bedtools mono">
        <button disabled={!valid} onClick={submit}>Add to palette</button>
        <button onClick={onCancel}>Cancel</button>
      </div>
      <p className="orto-fine">
        It'll show up under {FAMILY[fam].label.toLowerCase()} in the palette, right alongside the built-in crops —
        same planting math, same rotation tracking, same seed-box entry.
      </p>
    </div>
  );
}

function BedForm({ onAdd, onCancel }) {
  const [name, setName] = useState("");
  const [w, setW] = useState(4);
  const [l, setL] = useState(8);
  const [note, setNote] = useState("");
  const valid = name.trim() && w >= 1 && l >= 1 && w <= 20 && l <= 30;
  return (
    <div className="orto-panel orto-bedform">
      <h3 className="orto-h3">Add a bed</h3>
      <div className="orto-formrow">
        <label>Name<input className="orto-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Side bed" /></label>
        <label>Width (ft)<input className="orto-input mono" type="number" min="1" max="20" value={w} onChange={(e) => setW(Number(e.target.value))} /></label>
        <label>Length (ft)<input className="orto-input mono" type="number" min="1" max="30" value={l} onChange={(e) => setL(Number(e.target.value))} /></label>
        <label>Note<input className="orto-input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Where it sits" /></label>
      </div>
      <div className="orto-bedtools mono">
        <button disabled={!valid} onClick={() => onAdd(name.trim(), w, l, note.trim())}>Add bed</button>
        <button onClick={onCancel}>Cancel</button>
      </div>
      <p className="orto-fine">For an L or U shaped bed, add each straight section as its own rectangle.</p>
    </div>
  );
}

function BedEdit({ bed, onSave, onDelete, canDelete, yard }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(bed.name);
  const [w, setW] = useState(bed.w);
  const [l, setL] = useState(bed.l);
  const [x, setX] = useState(bed.x);
  const [y, setY] = useState(bed.y);
  useEffect(() => { setName(bed.name); setW(bed.w); setL(bed.l); setX(bed.x); setY(bed.y); }, [bed.id]);
  if (!open) return <button onClick={() => setOpen(true)}>Resize / move</button>;

  const nudge = (dx, dy) => { setX((v) => Math.round((v + dx) * 2) / 2); setY((v) => Math.round((v + dy) * 2) / 2); };

  return (
    <div className="orto-editpop">
      <label>Name<input className="orto-input" value={name} onChange={(e) => setName(e.target.value)} /></label>
      <div className="orto-formrow" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <label>Width<input className="orto-input mono" type="number" min="1" max="20" value={w} onChange={(e) => setW(Number(e.target.value))} /></label>
        <label>Length<input className="orto-input mono" type="number" min="1" max="30" value={l} onChange={(e) => setL(Number(e.target.value))} /></label>
      </div>
      <p className="orto-fine" style={{ marginTop: 8 }}>Position — feet from the yard's top-left corner</p>
      <div className="orto-formrow" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <label>X (right)<input className="orto-input mono" type="number" step="0.5" min="0" value={x} onChange={(e) => setX(Number(e.target.value))} /></label>
        <label>Y (down)<input className="orto-input mono" type="number" step="0.5" min="0" value={y} onChange={(e) => setY(Number(e.target.value))} /></label>
      </div>
      <div className="orto-nudge mono">
        <button onClick={() => nudge(0, -0.5)}>↑ 6in</button>
        <button onClick={() => nudge(-0.5, 0)}>← 6in</button>
        <button onClick={() => nudge(0.5, 0)}>→ 6in</button>
        <button onClick={() => nudge(0, 0.5)}>↓ 6in</button>
      </div>
      <div className="orto-bedtools mono">
        <button onClick={() => {
          const fp = bed.rot === 90 ? { w: l, d: w } : { w, d: l };
          const cx = yard ? Math.min(Math.max(0, x), Math.max(0, yard.w - fp.w)) : x;
          const cy = yard ? Math.min(Math.max(0, y), Math.max(0, yard.d - fp.d)) : y;
          onSave(bed.id, { name: name.trim() || bed.name, w, l, x: cx, y: cy });
          setOpen(false);
        }}>Save</button>
        <button onClick={() => setOpen(false)}>Cancel</button>
        {canDelete && <ConfirmButton label="Remove bed" onConfirm={() => { onDelete(bed.id); setOpen(false); }} />}
      </div>
      <p className="orto-fine">Shrinking a bed drops the squares that fall outside it. Dragging on the plan works too — this is for exact numbers.</p>
    </div>
  );
}

/* ============================================================
   Styles
   ============================================================ */

function Styles() {
  return (
    <style>{`
@import url('https://fonts.googleapis.com/css2?family=Alegreya:ital,wght@0,500;0,700;0,800;1,500&family=Archivo:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

.orto {
  --limewash:#F1F3EB; --paper:#FDFEFC; --ink:#1E241B; --ink-soft:#5A6455;
  --rule:#DEE3D5; --rule-soft:#EAEDE4;
  --olive:#2C843E; --pomodoro:#A32E27; --chicory:#3B5A73; --soil:#6B5344; --berry:#8A3A5B;
  --headdark:#1B3729; --headlight:#2B5037; --gold:#CC9E11;
  background:var(--limewash); color:var(--ink);
  font-family:'Archivo', system-ui, sans-serif; font-size:14px; line-height:1.55;
}
.orto *{box-sizing:border-box;}
.orto .mono, .orto .svg-mono{font-family:'IBM Plex Mono', ui-monospace, monospace;}
.orto .svg-body{font-family:'Archivo', system-ui, sans-serif;}
.orto button{font-family:inherit; cursor:pointer;}
.orto button:focus-visible, .orto input:focus-visible, .orto select:focus-visible{
  outline:2px solid var(--chicory); outline-offset:1px;
}

/* masthead */
.orto-head{background:linear-gradient(120deg, var(--headdark) 0%, var(--headlight) 100%);}
.orto-head-inner{max-width:1400px; margin:0 auto; padding:30px 24px 22px; display:flex; flex-wrap:wrap; gap:20px; align-items:flex-end; justify-content:space-between;}
.orto-title{display:flex; align-items:center; gap:9px; font-family:'Alegreya',Georgia,serif; font-weight:800; font-size:34px; line-height:1; letter-spacing:-0.01em; margin:0; color:#FBFBF6;}
.orto-logo{width:30px; height:30px; flex:none; color:var(--gold);}
.orto-sub{margin:4px 0 0; font-size:12.5px; color:rgba(255,255,255,.62); letter-spacing:0.03em; text-transform:uppercase;}
.orto-head-meta{display:flex; align-items:center; gap:16px; font-size:12px; color:rgba(255,255,255,.72); flex-wrap:wrap;}
.orto-year{display:flex; align-items:center; gap:7px; text-transform:uppercase; letter-spacing:0.06em;}
.orto-year select{font-family:'IBM Plex Mono',monospace; font-size:14px; font-weight:600; color:#FBFBF6; background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.28); border-radius:6px; padding:3px 6px;}
.orto-stat i{font-style:normal; color:rgba(255,255,255,.6); opacity:.85;}
.orto-save{min-width:70px; color:var(--gold);}
.orto-undoredo{display:flex; gap:2px;}
.orto-undoredo button{width:24px; height:24px; border:1px solid rgba(255,255,255,.28); border-radius:6px; background:transparent; color:rgba(255,255,255,.75); font-size:14px; line-height:1; display:flex; align-items:center; justify-content:center;}
.orto-undoredo button:hover:not(:disabled){border-color:#fff; color:#fff;}
.orto-undoredo button:disabled{opacity:.3; cursor:not-allowed;}

.orto-tabs{max-width:1400px; margin:0 auto; padding:0 24px; display:flex; gap:6px;}
.orto-tabs button{background:none; border:none; border-bottom:2px solid transparent; padding:12px 16px; font-size:13px; letter-spacing:0.08em; text-transform:uppercase; color:rgba(255,255,255,.68);}
.orto-tabs button:hover{color:#fff;}
.orto-tabs button.on{color:#fff; border-bottom-color:var(--gold);}

.orto-main{max-width:1400px; margin:0 auto; padding:28px 24px 72px;}
.orto-panel{background:var(--paper); border:1px solid var(--rule); border-radius:8px; padding:22px; box-shadow:0 1px 3px rgba(30,36,27,.04);}
.orto-solo{max-width:1100px;}
.orto-h2{font-family:'Alegreya',Georgia,serif; font-size:19px; font-weight:700; margin:0 0 4px;}
.orto-h3{font-family:'Alegreya',Georgia,serif; font-size:15px; font-weight:700; margin:14px 0 6px;}
.orto-fine{font-size:11.5px; color:var(--ink-soft); margin:4px 0 0;}
.orto-empty{font-size:13px; color:var(--ink-soft); margin:8px 0 0; max-width:34ch;}
.orto-input{width:100%; background:#fff; border:1px solid var(--rule); border-radius:6px; padding:6px 8px; font-family:inherit; font-size:13px; color:var(--ink);}

/* yard */
.orto-yard{display:grid; gap:20px; grid-template-columns:1fr;}
@media(min-width:1080px){ .orto-yard{grid-template-columns:minmax(0,1fr) 300px; align-items:start;} }
.orto-yardscroll{overflow-x:auto; padding:2px 0;}
.orto-yardside{max-height:82vh; overflow-y:auto;}
.orto-inline{display:inline-flex; align-items:center; gap:4px; font-size:11px; color:var(--ink-soft); border:1px solid var(--rule); border-radius:6px; padding:2px 7px;}
.orto-inline input{width:52px; border:none; background:transparent; font-family:'IBM Plex Mono',monospace; font-size:12.5px; color:var(--ink); text-align:right;}
.orto-edgebar{display:flex; flex-wrap:wrap; gap:12px; align-items:flex-end; padding:10px 0 12px; margin-bottom:8px; border-bottom:1px solid var(--rule-soft);}
.orto-edgebar label{display:flex; flex-direction:column; gap:3px; font-size:10px; letter-spacing:0.07em; text-transform:uppercase; color:var(--ink-soft);}
.orto-edgebar select{border:1px solid var(--rule); border-radius:6px; padding:3px 5px; font-family:'IBM Plex Mono',monospace; font-size:12px; background:#fff; color:var(--ink);}
.orto-featadd{display:flex; flex-wrap:wrap; gap:5px; margin-left:auto;}
.orto-featadd button{background:transparent; border:1px dashed var(--rule); border-radius:6px; padding:3px 8px; font-size:11px; color:var(--ink-soft);}
.orto-featadd button:hover{border-style:solid; color:var(--ink);}
.orto-clearlist{list-style:none; margin:6px 0 0; padding:0;}
.orto-clearlist li{display:flex; align-items:baseline; gap:8px; font-size:12.5px; padding:4px 0; border-bottom:1px solid var(--rule-soft);}
.orto-clearlist li span:first-child{width:66px; flex:none; font-size:11.5px; color:var(--ink-soft);}
.orto-clearlist li i{font-style:normal; font-size:10px; color:var(--ink-soft); opacity:.7;}
.orto-clearlist li.tight span:first-child{color:var(--pomodoro); font-weight:600;}
.orto-clearlist li.roomy span:first-child{color:var(--olive);}
.orto-soilbig{font-family:'IBM Plex Mono',monospace; font-size:28px; font-weight:600; margin:4px 0 0; color:var(--soil);}
.orto-soilbig i{font-style:normal; font-size:13px; color:var(--ink-soft); margin-left:5px;}
.orto-mix{list-style:none; margin:8px 0 0; padding:0;}
.orto-mix li{display:flex; gap:9px; font-size:12.5px; padding:3px 0; border-bottom:1px solid var(--rule-soft);}
.orto-mix li span{width:70px; flex:none; font-size:11.5px; color:var(--ink-soft);}
.orto-featedit{margin-top:14px; border-top:1px solid var(--rule); padding-top:4px;}

.orto-stocktable{border-collapse:collapse; width:100%; max-width:520px; margin:10px 0 6px;}
.orto-stocktable th{font-family:'IBM Plex Mono',monospace; font-size:10px; letter-spacing:0.06em; text-transform:uppercase; color:var(--ink-soft); font-weight:500; text-align:left; padding:5px 9px; border-bottom:1px solid var(--rule);}
.orto-stocktable td{padding:5px 9px; font-size:12.5px; border-bottom:1px solid var(--rule-soft);}
.orto-stocktable tr.cur td{background:rgba(85,107,69,.09); font-weight:600;}
.orto-stocktable td.orto-fine{font-weight:400;}

.orto-addbar{display:flex; flex-wrap:wrap; gap:5px; margin:10px 0 0;}
.orto-addbar button{background:transparent; border:1px solid var(--rule); border-radius:6px; padding:4px 11px; font-size:11.5px; color:var(--ink-soft); font-family:'IBM Plex Mono',monospace;}
.orto-addbar button.on{background:var(--ink); color:var(--paper); border-color:var(--ink);}
.orto-addbar button.berry{color:var(--berry); border-color:#D9BECB;}
.orto-addbar button.on.berry{background:var(--berry); color:var(--paper); border-color:var(--berry);}
.orto-palettedrawer{display:flex; flex-wrap:wrap; gap:4px; padding:11px 0 4px; margin-top:8px; border-top:1px solid var(--rule-soft);}
.orto-palettedrawer button{display:flex; align-items:center; gap:6px; background:var(--limewash); border:1px solid var(--rule); border-radius:6px; padding:4px 9px; font-size:12px; color:var(--ink);}
.orto-palettedrawer button:hover{border-color:var(--ink);}
.orto-palettedrawer button i{font-style:normal; font-size:9.5px; color:var(--ink-soft);}
.orto-fruitgroup{width:100%; margin-bottom:6px;}
.orto-fruitgroup .orto-famlabel{margin-bottom:4px;}
.orto-fruitgroup button{margin:0 4px 4px 0;}
.orto-plantpanel{border-bottom:1px solid var(--rule); padding-bottom:12px; margin-bottom:12px;}
.orto-plantpanel .orto-formrow{display:grid; gap:8px; grid-template-columns:repeat(auto-fit,minmax(110px,1fr)); margin:8px 0;}
.orto-plantpanel label{display:block; font-size:10.5px; letter-spacing:0.06em; text-transform:uppercase; color:var(--ink-soft);}

.orto-tapebar{display:flex; align-items:center; gap:14px; flex-wrap:wrap; padding:9px 11px; margin:10px 0 0;
  background:rgba(163,46,39,.06); border:1px solid #E0BEBB; border-radius:6px;}
.orto-tapehint{font-size:12.5px; color:var(--ink);}
.orto-tapemetric{font-size:11.5px; color:var(--ink-soft);}
.orto-tapebar .orto-bedtools{margin-left:auto;}
.orto-measlist{list-style:none; margin:6px 0 0; padding:0;}
.orto-measlist li{display:flex; align-items:center; gap:8px; padding:4px 6px; margin:0 -6px; border-bottom:1px solid var(--rule-soft); border-radius:6px; cursor:pointer;}
.orto-measlist li:hover{background:var(--limewash);}
.orto-measlist li.sel{background:rgba(59,90,115,.1);}
.orto-measlist li span{width:66px; flex:none; font-size:11.5px; color:var(--chicory);}
.orto-measlist li input{flex:1; min-width:0; font-size:12px; padding:3px 6px;}
.orto-measlist li button{flex:none; font-size:10.5px;}

.orto-nudge{display:grid; grid-template-columns:repeat(3,28px); grid-template-rows:repeat(2,26px); gap:3px; margin:8px 0; justify-content:start;}
.orto-nudge button{font-size:9px; padding:0; border:1px solid var(--rule); background:transparent; border-radius:6px; color:var(--ink-soft);}
.orto-nudge button:nth-child(1){grid-column:2;}
.orto-nudge button:nth-child(2){grid-column:1; grid-row:2;}
.orto-nudge button:nth-child(3){grid-column:3; grid-row:2;}
.orto-nudge button:nth-child(4){grid-column:2; grid-row:2;}
.orto-nudge button:hover{border-color:var(--ink); color:var(--ink);}

/* seeds */
.orto-seeds{display:grid; gap:20px; grid-template-columns:1fr;}
@media(min-width:1080px){ .orto-seeds{grid-template-columns:minmax(0,1fr) 300px; align-items:start;} }
.orto-h4{font-family:'Alegreya',Georgia,serif; font-size:13.5px; font-weight:700; margin:0;}
.orto-seedfilters{display:flex; gap:10px; align-items:center; flex-wrap:wrap; margin:10px 0 12px;}
.orto-seedfilters .orto-input{flex:1; min-width:180px;}
.orto-segmented{display:flex; border:1px solid var(--rule); border-radius:6px; overflow:hidden;}
.orto-segmented button{background:transparent; border:none; padding:5px 11px; font-size:11px; color:var(--ink-soft); border-right:1px solid var(--rule);}
.orto-segmented button:last-child{border-right:none;}
.orto-segmented button.on{background:var(--ink); color:var(--paper);}
.orto-seedform{border:1px solid var(--rule); border-radius:6px; padding:12px; margin:8px 0 4px; background:var(--limewash);}
.orto-seedform .orto-formrow{display:grid; gap:8px; grid-template-columns:repeat(auto-fit,minmax(130px,1fr)); margin-bottom:10px;}
.orto-seedform label, .orto-seeddetail label{display:block; font-size:10.5px; letter-spacing:0.06em; text-transform:uppercase; color:var(--ink-soft);}
.orto-seedform select{height:31px;}
.orto-fullpick{display:flex; gap:5px; flex-wrap:wrap; margin-bottom:8px;}
.orto-fullpick button{background:transparent; border:1px solid var(--rule); border-radius:6px; padding:4px 10px; font-size:11px; color:var(--ink-soft);}
.orto-fullpick button.on{background:var(--soil); border-color:var(--soil); color:var(--paper);}
.orto-seedlist{display:flex; flex-direction:column; gap:5px;}
.orto-seedcard{border:1px solid var(--rule); border-radius:6px; background:#fff; overflow:hidden;}
.orto-seedcard.spent{border-left:3px solid var(--pomodoro);}
.orto-seedcard.test{border-left:3px solid #C58A2E;}
.orto-seedcard.undated{border-left:3px solid var(--rule);}
.orto-seedcard.good, .orto-seedcard.fresh{border-left:3px solid var(--olive);}
.orto-seedmain{display:flex; align-items:center; gap:9px; width:100%; text-align:left; background:none; border:none; padding:9px 11px; font-size:13px; color:var(--ink);}
.orto-seedmain:hover{background:var(--limewash);}
.orto-seedname{display:flex; flex-direction:column; min-width:0; flex:1;}
.orto-seedname i{font-style:normal; font-size:10.5px; color:var(--ink-soft);}
.orto-seedfull{font-size:11px; color:var(--ink-soft); white-space:nowrap;}
.orto-standing{font-size:10.5px; white-space:nowrap; font-family:'IBM Plex Mono',monospace;}
.orto-standing.good, .orto-standing.fresh{color:var(--olive);}
.orto-standing.test{color:#8A6318;}
.orto-standing.spent{color:var(--pomodoro);}
.orto-standing.undated{color:var(--ink-soft);}
.orto-inplan{font-size:9.5px; letter-spacing:0.06em; text-transform:uppercase; color:var(--chicory); border:1px solid var(--chicory); border-radius:9px; padding:1px 6px;}
.orto-seeddetail{border-top:1px solid var(--rule-soft); padding:11px; background:var(--paper);}
.orto-seeddetail .orto-formrow{display:grid; gap:8px; grid-template-columns:repeat(auto-fit,minmax(120px,1fr)); margin-bottom:9px;}
.orto-seedfacts{margin:6px 0 8px; padding-left:10px; border-left:2px solid var(--rule);}
.orto-notefield textarea{resize:vertical; font-size:12.5px; margin-top:3px;}
.orto-germ{margin:10px 0; border-top:1px solid var(--rule-soft); padding-top:8px;}
.orto-germhead{display:flex; align-items:center; gap:10px; flex-wrap:wrap;}
.orto-rate{font-size:11px;}
.orto-rate.ok{color:var(--olive);} .orto-rate.mid{color:#8A6318;} .orto-rate.bad{color:var(--pomodoro);}
.orto-linkbtn{margin-left:auto; background:none; border:none; font-size:11px; color:var(--chicory); text-decoration:underline; padding:0;}
.orto-germform{display:flex; gap:10px; align-items:flex-end; margin-top:8px; flex-wrap:wrap;}
.orto-germform label{display:flex; flex-direction:column; gap:3px; font-size:10px; letter-spacing:0.06em; text-transform:uppercase; color:var(--ink-soft);}
.orto-germform input{width:70px; border:1px solid var(--rule); border-radius:6px; padding:4px 6px; font-family:'IBM Plex Mono',monospace; font-size:12.5px; background:#fff; color:var(--ink);}
.orto-germform button{border:1px solid var(--rule); background:transparent; border-radius:6px; padding:5px 12px; font-size:11px; color:var(--ink-soft);}
.orto-germform button:disabled{opacity:.4; cursor:not-allowed;}
.orto-seedside{max-height:82vh; overflow-y:auto;}
.orto-orderrow{padding:8px 0; border-bottom:1px solid var(--rule-soft);}
.orto-pillwrap{display:flex; flex-wrap:wrap; gap:4px; margin-top:6px;}

/* build */
.orto-build{display:grid; gap:20px; grid-template-columns:1fr;}
@media(min-width:1080px){ .orto-build{grid-template-columns:minmax(0,1fr) 300px; align-items:start;} }
.orto-buildopts{display:flex; flex-wrap:wrap; gap:12px; align-items:flex-end; margin:10px 0 12px; padding-bottom:12px; border-bottom:1px solid var(--rule-soft);}
.orto-buildopts label{display:flex; flex-direction:column; gap:3px; font-size:10.5px; letter-spacing:0.06em; text-transform:uppercase; color:var(--ink-soft);}
.orto-buildopts .orto-input{min-width:130px;}
.orto-toggles{display:flex; gap:5px; margin-left:auto;}
.orto-toggles button{background:transparent; border:1px solid var(--rule); border-radius:6px; padding:6px 11px; font-size:11px; color:var(--ink-soft);}
.orto-toggles button.on{background:var(--soil); border-color:var(--soil); color:var(--paper);}
.orto-cutlist{display:flex; flex-direction:column; gap:4px; margin-top:8px;}
.orto-cutbed{border:1px solid var(--rule); border-radius:6px; background:#fff; overflow:hidden;}
.orto-cuthead{display:flex; align-items:center; gap:12px; width:100%; text-align:left; background:none; border:none; padding:8px 11px; font-size:13px; color:var(--ink);}
.orto-cuthead:hover{background:var(--limewash);}
.orto-cuthead strong{flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;}
.orto-cuthead span{font-size:11px; color:var(--ink-soft); white-space:nowrap;}
.orto-cutwall{color:var(--soil) !important;}
.orto-cutdetail{border-top:1px solid var(--rule-soft); padding:10px 11px; background:var(--paper);}
.orto-cuttable{border-collapse:collapse; width:100%; margin-bottom:6px;}
.orto-cuttable td{padding:3px 8px 3px 0; font-size:12.5px; vertical-align:baseline;}
.orto-cuttable td:first-child{width:28px; color:var(--soil); font-weight:600;}
.orto-cuttable td:nth-child(3){color:var(--chicory); white-space:nowrap;}
.orto-barlist{display:flex; flex-direction:column; gap:3px; margin-top:8px;}
.orto-bar{display:flex; align-items:center; gap:8px;}
.orto-barno{font-size:10px; color:var(--ink-soft); width:20px; flex:none;}
.orto-bargraph{display:flex; flex:1; height:22px; border:1px solid var(--rule); border-radius:2px; overflow:hidden; background:#fff;}
.orto-barseg{display:flex; align-items:center; justify-content:center; background:rgba(107,83,68,.28); border-right:1px solid var(--paper); min-width:0; overflow:hidden;}
.orto-barseg i{font-style:normal; font-size:9.5px; color:var(--ink); white-space:nowrap;}
.orto-barwaste{display:flex; align-items:center; justify-content:center; background:repeating-linear-gradient(45deg,transparent 0 3px,var(--rule-soft) 3px 6px); min-width:0; overflow:hidden;}
.orto-barwaste i{font-style:normal; font-size:9.5px; color:var(--ink-soft);}
.orto-buildside{max-height:82vh; overflow-y:auto;}
.orto-buyrow{display:flex; gap:11px; align-items:baseline; padding:9px 0; border-bottom:1px solid var(--rule-soft);}
.orto-buyn{font-size:17px; font-weight:600; color:var(--soil); width:42px; flex:none; text-align:right;}
.orto-buyrow strong{display:block; font-size:13px; font-weight:500;}
.orto-buyrow i{display:block; font-style:normal; font-size:11px; color:var(--ink-soft); margin-top:1px;}
.orto-costbig{font-family:'IBM Plex Mono',monospace; font-size:28px; font-weight:600; margin:4px 0 0; color:var(--soil);}
.orto-costbig i{font-style:normal; font-size:13px; color:var(--ink-soft); margin-left:5px;}
.orto-worklist{margin:6px 0 0; padding-left:18px; font-size:12.5px;}
.orto-worklist li{padding:3px 0;}

/* plant info card */
.orto-plantcard{border:1px solid var(--rule); border-radius:6px; background:#fff; padding:10px; margin:6px 0 10px;}
.orto-plantgrid{display:grid; grid-template-columns:1fr 1fr; gap:8px 12px; margin-bottom:8px;}
.orto-plantlabel{font-size:9.5px; letter-spacing:0.06em; text-transform:uppercase; color:var(--ink-soft); display:block;}
.orto-plantgrid p{font-size:12px; margin:1px 0 0; color:var(--ink);}
.orto-plantdates{border-top:1px solid var(--rule-soft); padding-top:7px; margin-bottom:7px;}
.orto-plantdates p{margin:2px 0 0; font-size:12px;}
.orto-antitext{color:var(--pomodoro);}
.orto-row-toggle{width:100%; text-align:left; background:none; border:none; padding:0; cursor:pointer;}
.orto-chevron{margin-left:auto; color:var(--ink-soft); font-size:13px;}
.orto-chiprow{display:flex; align-items:center; gap:3px;}
.orto-chiprow .orto-chip{flex:1;}
.orto-infobtn{flex:none; width:20px; height:20px; border-radius:50%; border:1px solid var(--rule); background:transparent; color:var(--ink-soft); font-size:10.5px; font-style:italic; font-family:Georgia,serif; display:flex; align-items:center; justify-content:center;}
.orto-infobtn:hover, .orto-infobtn.on{border-color:var(--chicory); color:var(--chicory);}

.orto-designbtn{display:flex; align-items:center; gap:6px; background:none; border:none; padding:0; margin-top:2px; font-family:'Archivo',sans-serif; font-size:13px; color:rgba(255,255,255,.7); cursor:pointer;}
.orto-designbtn:hover{color:#fff;}
.orto-designcount{color:rgba(255,255,255,.55); opacity:.9; font-size:10.5px;}
.orto-caret{font-size:9px;}
.orto-designpop{position:absolute; z-index:30; margin-top:6px; background:var(--paper); border:1px solid var(--ink); border-radius:8px; padding:12px; width:300px; box-shadow:0 8px 24px rgba(30,36,27,.16);}
.orto-designlist{list-style:none; margin:0 0 8px; padding:0; max-height:260px; overflow-y:auto;}
.orto-designlist li{display:flex; align-items:center; gap:6px; padding:5px 0; border-bottom:1px solid var(--rule-soft);}
.orto-designlist li.cur{background:rgba(85,107,69,.07); margin:0 -6px; padding:5px 6px; border-radius:6px; border-bottom-color:transparent;}
.orto-designopen{flex:1; min-width:0; display:flex; flex-direction:column; align-items:flex-start; gap:1px; background:none; border:none; text-align:left; padding:0; cursor:pointer;}
.orto-designopen span{font-size:13px; color:var(--ink); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:100%;}
.orto-designopen i{font-style:normal; font-size:10px; color:var(--ink-soft);}
.orto-linkbtn.danger{color:var(--pomodoro);}

.orto-lastyear{margin-bottom:10px; padding-bottom:10px; border-bottom:1px solid var(--rule);}

.orto-lookup{margin:10px 0; border-top:1px solid var(--rule-soft); padding-top:8px;}
.orto-lookuphead{display:flex; align-items:center; gap:10px; flex-wrap:wrap;}
.orto-lookupresult{margin-top:8px;}
.orto-lookupimages{display:flex; gap:6px; margin-bottom:8px; flex-wrap:wrap;}
.orto-lookupimages img{width:88px; height:88px; object-fit:cover; border-radius:6px; border:1px solid var(--rule); background:var(--limewash);}
.orto-lookupsources a{color:var(--chicory);}

.orto-confirmpair{display:inline-flex; gap:5px;}
.orto-confirmpair button{font-size:11px; padding:4px 9px; border-radius:6px; border:1px solid var(--rule);}
.orto-confirmpair button.danger{background:var(--pomodoro); color:#fff; border-color:var(--pomodoro);}

.orto-cropform{margin-top:10px;}
.orto-cropform .orto-formrow{display:grid; gap:8px; grid-template-columns:repeat(auto-fit,minmax(140px,1fr)); margin:8px 0;}
.orto-cropform label{display:block; font-size:10.5px; letter-spacing:0.06em; text-transform:uppercase; color:var(--ink-soft);}
.orto-cropform select{height:31px;}
.orto-checkline{display:flex; align-items:center; gap:7px; font-size:12.5px; color:var(--ink); margin:8px 0; text-transform:none; letter-spacing:0;}
.orto-checkline input{width:auto;}

/* plot layout */
.orto-plot{display:grid; gap:20px; grid-template-columns:1fr;}
@media(min-width:1080px){ .orto-plot{grid-template-columns:222px minmax(0,1fr) 290px; align-items:start;} }

/* palette */
.orto-palette{display:flex; flex-direction:column; gap:8px; max-height:78vh;}
.orto-palette-scroll{overflow-y:auto; padding-right:2px; flex:1; min-height:180px;}
.orto-famgroup{margin-bottom:10px;}
.orto-famlabel{font-size:10px; letter-spacing:0.1em; text-transform:uppercase; margin:0 0 4px; font-weight:600;}
.orto-chip{display:flex; align-items:center; gap:7px; width:100%; text-align:left; background:transparent; border:1px solid transparent; border-radius:6px; padding:3px 5px; font-size:12.5px; color:var(--ink);}
.orto-chip:hover{background:var(--limewash);}
.orto-chip.on{background:var(--limewash); border-style:solid;}
.orto-chip-name{flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;}
.orto-chip-n{font-size:10px; color:var(--ink-soft);}
.orto-swatch{width:10px; height:10px; border-radius:2px; flex:none; display:inline-block;}
.orto-swatch.sm{width:7px; height:7px;}
.orto-erase{background:transparent; border:1px dashed var(--rule); border-radius:6px; padding:5px; font-size:12px; color:var(--ink-soft);}
.orto-erase.on{border-color:var(--pomodoro); color:var(--pomodoro); border-style:solid;}

/* bed bar */
.orto-canvas{display:flex; flex-direction:column; gap:10px; min-width:0;}
.orto-bedbar{display:flex; flex-wrap:wrap; gap:5px;}
.orto-bedchip{background:var(--paper); border:1px solid var(--rule); border-radius:6px; padding:5px 9px; font-size:12.5px; color:var(--ink-soft); display:flex; align-items:center; gap:6px;}
.orto-bedchip i{font-style:normal; font-size:10px; opacity:.65; font-family:'IBM Plex Mono',monospace;}
.orto-bedchip.on{background:var(--ink); color:var(--paper); border-color:var(--ink);}
.orto-bedchip.orto-add{border-style:dashed;}

.orto-bedhead{display:flex; justify-content:space-between; align-items:flex-start; gap:12px; flex-wrap:wrap; margin-bottom:12px;}
.orto-bedtools{display:flex; gap:6px; flex-wrap:wrap;}
.orto-bedtools button{background:transparent; border:1px solid var(--rule); border-radius:6px; padding:4px 9px; font-size:11px; letter-spacing:0.04em; color:var(--ink-soft);}
.orto-bedtools button:hover:not(:disabled){border-color:var(--ink); color:var(--ink);}
.orto-bedtools button:disabled{opacity:.4; cursor:not-allowed;}
.orto-bedtools button.danger{color:var(--pomodoro); border-color:#E0BEBB;}

/* the grid */
.orto-gridscroll{overflow-x:auto; padding:2px;}
.orto-grid{display:grid; gap:3px;
  background:
    repeating-linear-gradient(0deg, var(--rule-soft) 0 1px, transparent 1px 12px),
    repeating-linear-gradient(90deg, var(--rule-soft) 0 1px, transparent 1px 12px),
    #FDFDFA;
  padding:6px; border:1px solid var(--rule); border-radius:6px;}
.orto-cell{aspect-ratio:1; border:1px solid var(--rule); border-radius:2px; background:rgba(255,255,255,.72);
  display:flex; flex-direction:column; align-items:center; justify-content:center; gap:1px; padding:2px; overflow:hidden; transition:transform .08s ease;}
.orto-cell:hover{transform:scale(1.04); z-index:2;}
.orto-cell-name{font-size:9.5px; line-height:1.05; color:#fff; text-align:center; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:100%;}
.orto-cell-n{font-size:8.5px; color:rgba(255,255,255,.82);}

/* inspector */
.orto-inspector{max-height:78vh; overflow-y:auto;}
.orto-row{padding:9px 0; border-bottom:1px solid var(--rule-soft);}
.orto-row-head{display:flex; align-items:center; gap:7px; font-size:13.5px;}
.orto-count{margin-left:auto; font-size:11.5px; color:var(--olive); font-weight:600;}
.orto-dates{font-size:10.5px; color:var(--chicory); margin:3px 0 0;}
.orto-notes{margin-top:12px; border-top:1px solid var(--rule); padding-top:6px;}
.orto-note{font-size:12px; margin:5px 0; padding-left:11px; border-left:2px solid var(--rule);}
.orto-note.warn{border-left-color:var(--pomodoro);}
.orto-note.ok{border-left-color:var(--olive);}
.orto-caveat{margin-top:10px; font-style:italic;}

/* bed form */
.orto-bedform .orto-formrow{display:grid; gap:8px; grid-template-columns:repeat(auto-fit,minmax(120px,1fr)); margin:8px 0 10px;}
.orto-bedform label, .orto-editpop label{display:block; font-size:10.5px; letter-spacing:0.06em; text-transform:uppercase; color:var(--ink-soft);}
.orto-editpop{position:absolute; right:16px; z-index:20; background:var(--paper); border:1px solid var(--ink); border-radius:8px; padding:12px; width:220px; display:flex; flex-direction:column; gap:7px; box-shadow:0 6px 20px rgba(30,36,27,.14);}

/* season */
.orto-season{display:flex; flex-direction:column; gap:14px;}
.orto-frostbar{display:flex; flex-wrap:wrap; align-items:center; gap:16px; margin-bottom:12px;}
.orto-frostbar label{display:flex; flex-direction:column; gap:3px; font-size:10px; letter-spacing:0.07em; text-transform:uppercase; color:var(--ink-soft);}
.orto-frostbar input{border:1px solid var(--rule); border-radius:6px; padding:4px 6px; font-family:'IBM Plex Mono',monospace; font-size:12.5px; background:#fff; color:var(--ink);}
.orto-frostdays{margin-left:auto; font-size:12px; color:var(--olive);}
.orto-calbtn{border:1px solid var(--olive); border-radius:6px; padding:4px 10px; font-size:11px; color:var(--olive); background:transparent;}
.orto-calbtn:hover:not(:disabled){background:var(--olive); color:var(--paper);}
.orto-calbtn:disabled{opacity:.4; cursor:not-allowed;}
.orto-caladd{margin-left:auto; flex:none; background:transparent; border:1px solid var(--rule); border-radius:6px; padding:1px 6px; font-size:9.5px; color:var(--ink-soft); font-family:'IBM Plex Mono',monospace; opacity:0;}
.orto-task:hover .orto-caladd{opacity:1;}
.orto-caladd:hover{border-color:var(--olive); color:var(--olive);}
.orto-ribbonscroll{overflow-x:auto; padding:6px 0 2px;}
.orto-legend{display:flex; flex-wrap:wrap; gap:16px; align-items:center; font-size:10.5px; color:var(--ink-soft); border-top:1px solid var(--rule-soft); padding-top:10px; margin-top:6px;}
.orto-legend span{display:flex; align-items:center; gap:5px;}
.orto-legend .lg{width:15px; height:9px; border-radius:2px; display:inline-block; background:var(--olive);}
.orto-legend .lg-a{opacity:.42;} .orto-legend .lg-b{opacity:.18;} .orto-legend .lg-c{opacity:1;}
.orto-legend .lg-d{width:9px; height:9px; border-radius:50%; background:var(--paper); border:1.8px solid var(--olive);}
.orto-month{margin-top:6px;}
.orto-tasklist{list-style:none; margin:0; padding:0;}
.orto-task{display:flex; align-items:center; gap:9px; font-size:12.5px; padding:3px 0; border-bottom:1px solid var(--rule-soft);}
.orto-taskdate{font-size:10.5px; color:var(--ink-soft); width:20px; flex:none;}
.orto-task.harvest{color:var(--olive);}
.orto-taskcheck{width:14px; height:14px; flex:none; accent-color:var(--olive); cursor:pointer;}
.orto-task.done{opacity:0.5;}
.orto-task.done span:not(.mono):not(.orto-swatch){text-decoration:line-through;}
.orto-task.succession{color:var(--ink-soft);}

/* ledger */
.orto-ledgerscroll{overflow-x:auto; margin-top:10px;}
.orto-table{border-collapse:collapse; width:100%; min-width:560px;}
.orto-table th, .orto-table td{border:1px solid var(--rule-soft); padding:8px 10px; text-align:left; vertical-align:top;}
.orto-table thead th{font-family:'IBM Plex Mono',monospace; font-size:11px; letter-spacing:0.06em; color:var(--ink-soft); font-weight:500; background:var(--limewash);}
.orto-table thead th.cur, .orto-table td.cur{background:rgba(85,107,69,.07);}
.orto-table tbody th{font-size:12.5px; font-weight:500; white-space:nowrap;}
.orto-table tbody th i{display:block; font-style:normal; font-size:10px; color:var(--ink-soft);}
.orto-fampill{display:inline-flex; align-items:center; gap:4px; border:1px solid; border-radius:10px; padding:1px 7px; font-size:10.5px; margin:0 3px 3px 0;}
.orto-fampill i{font-style:normal; opacity:.6; font-size:9.5px;}
.orto-fampill.repeat{background:rgba(163,46,39,.08); font-weight:600;}
.orto-rotationkey{margin-top:16px; border-top:1px solid var(--rule); padding-top:4px; max-width:66ch;}

.orto-sunbox{margin-bottom:10px; border-bottom:1px solid var(--rule); padding-bottom:10px;}
.orto-sunrow{display:flex; gap:14px; font-size:12px; margin:4px 0;}
.orto-sunrow span{color:var(--ink-soft);}
.orto-sunrow strong{color:var(--ink); font-weight:600;}

/* summary / print */
.orto-summary-toolbar{display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:12px;}
.orto-printsheet{background:#fff; border:1px solid var(--rule); border-radius:8px; padding:28px; max-width:800px; margin:0 auto;}
.orto-printhead{border-bottom:2px solid var(--ink); padding-bottom:10px; margin-bottom:18px;}
.orto-printhead h1{font-family:'Alegreya',Georgia,serif; font-size:24px; font-weight:800; margin:0 0 4px;}
.orto-printhead p{font-size:12px; color:var(--ink-soft); margin:0;}
.orto-printsection{margin-bottom:20px; break-inside:avoid;}
.orto-printsection h2{font-family:'Alegreya',Georgia,serif; font-size:15px; font-weight:700; border-bottom:1px solid var(--rule); padding-bottom:4px; margin:0 0 10px;}
.orto-printgrid{display:grid; grid-template-columns:repeat(auto-fit,minmax(160px,1fr)); gap:10px 20px;}
.orto-printgrid span{display:block; font-size:9.5px; letter-spacing:0.06em; text-transform:uppercase; color:var(--ink-soft);}
.orto-printgrid p{margin:1px 0 0; font-size:13px;}
.orto-printtable{border-collapse:collapse; width:100%;}
.orto-printtable th{text-align:left; font-size:10px; letter-spacing:0.05em; text-transform:uppercase; color:var(--ink-soft); padding:4px 8px 4px 0; border-bottom:1px solid var(--ink);}
.orto-printtable td{font-size:12.5px; padding:4px 8px 4px 0; border-bottom:1px solid var(--rule-soft);}
.orto-printcalendar{break-inside:auto;}
.orto-printfoot{text-align:center; font-size:10px; color:var(--ink-soft); margin-top:20px; border-top:1px solid var(--rule-soft); padding-top:8px;}

@media print {
  body * { visibility: hidden; }
  .orto-printsheet, .orto-printsheet * { visibility: visible; }
  .orto-printsheet { position: absolute; left: 0; top: 0; width: 100%; max-width: none; border: none; padding: 0; }
  .no-print { display: none !important; }
  .orto-printsection { break-inside: avoid; }
}

@media (prefers-reduced-motion: reduce){ .orto *{transition:none !important;} }
@media (max-width:1079px){ .orto-palette, .orto-inspector{max-height:none;} }
`}</style>
  );
}
