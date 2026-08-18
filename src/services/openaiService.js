import { NUTRITION_DB, NUTRIENT_KEYS, findDbKey, scaleEntry } from './nutritionDB.js';
import { findCachedKey, getCachedEntry, cacheFood } from './foodCache.js';
import { getServerStatus } from './serverStatus.js';
import { round2 } from '../utils/format.js';

// Both functions below fall back to deterministic mock/local data whenever
// the deployed server has no OpenAI key configured (see api/status.js).
// When it is configured, unrecognized foods get looked up once through the
// server-side proxy (api/parse-food.js, api/nutrition-lookup.js) - which
// holds the real key - then cached locally (foodCache.js) so the same food
// never needs a second call.
export const isOpenAIConfigured = async () => (await getServerStatus()).openaiConfigured;

const NUMBER_PATTERN = /^(\d+(?:\.\d+)?)\s*(.*)$/;
// leading word, optional "of", rest is the food name. Trailing group is `*`
// (not `+`) so a single-word remainder (e.g. "idli") isn't forced to give
// up a character to satisfy the group - that bug used to turn "2 idli"
// into item "idl i", which then failed to match the food database.
const UNIT_PATTERN = /^([a-zA-Z]+)\s*(?:of\s+)?(.*)$/i;

const UNIT_ALIASES = {
  ml: 'ml', millilitre: 'ml', millilitres: 'ml', milliliter: 'ml', milliliters: 'ml',
  l: 'l', litre: 'l', litres: 'l', liter: 'l', liters: 'l',
  g: 'g', gram: 'g', grams: 'g',
  kg: 'kg', kilogram: 'kg', kilograms: 'kg'
};

const parsePhrase = (phrase) => {
  const trimmed = phrase.trim();
  const numMatch = trimmed.match(NUMBER_PATTERN);
  if (!numMatch) return { item: trimmed, quantity: 1, amount: null };

  const [, numStr, remainder] = numMatch;
  const num = parseFloat(numStr);

  const unitMatch = remainder.match(UNIT_PATTERN);
  if (!unitMatch) return { item: remainder.trim(), quantity: num, amount: null };

  const [, unitRaw, rest] = unitMatch;
  const normalizedUnit = UNIT_ALIASES[unitRaw.toLowerCase()];

  if (normalizedUnit) {
    let value = num;
    if (normalizedUnit === 'kg' || normalizedUnit === 'l') value = num * 1000;
    const unit = normalizedUnit === 'ml' || normalizedUnit === 'l' ? 'ml' : 'g';
    return { item: rest.trim() || remainder.trim(), quantity: num, amount: { value, unit } };
  }

  // unitRaw isn't a weight/volume unit (e.g. "eggs", "bowl", "cup") - fold it back into the item text
  const item = `${unitRaw} ${rest}`.trim();
  return { item, quantity: num, amount: null };
};

// Known locally (built-in DB or previously learned from OpenAI) - no API call needed.
const findKnownEntry = (itemName) => {
  const dbKey = findDbKey(itemName);
  if (dbKey) return { entry: NUTRITION_DB[dbKey], key: dbKey, learned: false };
  const cacheKey = findCachedKey(itemName);
  if (cacheKey) return { entry: getCachedEntry(cacheKey), key: cacheKey, learned: true };
  return null;
};

const buildAmbiguity = (parsedItem) => {
  if (parsedItem.amount) return null;
  const known = findKnownEntry(parsedItem.item);
  if (!known || known.entry.unitType === 'count') return null;

  const unit = known.entry.unitType === 'volume' ? 'ml' : 'g';
  return {
    item: parsedItem.item,
    question: `How many ${unit === 'ml' ? 'milliliters' : 'grams'} of ${known.key}?`,
    unit,
    placeholder: known.entry.baseAmount
  };
};

const mockParseFoodInput = (userInput) => {
  const phrases = userInput
    .toLowerCase()
    .split(/[,+\n]| and /)
    .map((p) => p.trim())
    .filter(Boolean);

  const parsed_items = phrases.map(parsePhrase);
  const ambiguities = parsed_items.map(buildAmbiguity).filter(Boolean);

  return { parsed_items, ambiguities, mocked: true };
};

const resolveAmount = (entry, item) => {
  if (item.amount) return item.amount;
  if (entry.unitType === 'count') return { value: item.quantity || 1, unit: 'count' };
  return null;
};

const genericEstimate = (item) => {
  const servings = item.quantity || 1;
  return {
    food_name: item.item || 'unknown food',
    portion: `${servings} serving${servings === 1 ? '' : 's'} (estimated)`,
    dbKey: null,
    unitType: 'count',
    amount: { value: servings, unit: 'serving' },
    calories: round2(150 * servings),
    protein_g: round2(5 * servings),
    carbs_g: round2(20 * servings),
    fat_g: round2(5 * servings),
    fiber_g: round2(2 * servings),
    calcium_mg: round2(20 * servings),
    zinc_mg: round2(0.5 * servings),
    iron_mg: round2(1 * servings),
    magnesium_mg: round2(20 * servings),
    potassium_mg: round2(150 * servings),
    sodium_mg: round2(50 * servings),
    vitamin_d_mcg: 0,
    vitamin_b12_mcg: 0,
    vitamin_c_mg: round2(2 * servings),
    folate_mcg: round2(10 * servings),
    source: 'mock_estimate'
  };
};

const mockGetNutritionData = (foodItems) =>
  foodItems.map((entry) => {
    const item = typeof entry === 'string' ? { item: entry, quantity: 1, amount: null } : entry;
    const known = findKnownEntry(item.item || '');
    if (known) {
      const amount = resolveAmount(known.entry, item);
      return { ...scaleEntry({ ...known.entry, source: known.learned ? 'learned_cache' : 'local_fallback' }, amount), dbKey: known.key };
    }
    return genericEstimate(item);
  });

const extractJson = (content, isArray) => {
  const pattern = isArray ? /\[[\s\S]*\]/ : /\{[\s\S]*\}|\[[\s\S]*\]/;
  const match = content.match(pattern);
  if (!match) throw new Error('No JSON found in OpenAI response');
  return JSON.parse(match[0]);
};

const callProxy = async (endpoint, body) => {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Server error');
  return data.content;
};

export const parseFoodInput = async (userInput) => {
  if (!(await isOpenAIConfigured())) {
    return mockParseFoodInput(userInput);
  }
  const content = await callProxy('/api/parse-food', { userInput });
  return extractJson(content, false);
};

// Learns an unrecognized item from a real OpenAI nutrition lookup and caches
// it (keyed by what the user typed) so it resolves locally next time.
const learnAndCache = (item, nutrition) => {
  const amount = item.amount || { value: item.quantity || 1, unit: 'count' };
  const unitType = amount.unit === 'ml' ? 'volume' : amount.unit === 'g' ? 'weight' : 'count';
  const learnedEntry = {
    food_name: nutrition.food_name || item.item,
    portion: nutrition.portion,
    unitType,
    baseAmount: amount.value,
    ...NUTRIENT_KEYS.reduce((acc, key) => ({ ...acc, [key]: Number(nutrition[key]) || 0 }), {})
  };
  const cacheKey = (item.item || nutrition.food_name || '').toLowerCase().trim();
  cacheFood(cacheKey, learnedEntry);
  return { ...learnedEntry, source: 'openai', amount, dbKey: cacheKey };
};

export const getNutritionData = async (foodItems) => {
  const items = foodItems.map((entry) => (typeof entry === 'string' ? { item: entry, quantity: 1, amount: null } : entry));

  if (!(await isOpenAIConfigured())) {
    return mockGetNutritionData(items);
  }

  const results = new Array(items.length);
  const toFetch = [];

  items.forEach((item, index) => {
    const known = findKnownEntry(item.item || '');
    if (known) {
      const amount = resolveAmount(known.entry, item);
      results[index] = { ...scaleEntry({ ...known.entry, source: known.learned ? 'learned_cache' : 'local_fallback' }, amount), dbKey: known.key };
    } else {
      toFetch.push({ item, index });
    }
  });

  if (toFetch.length > 0) {
    const content = await callProxy('/api/nutrition-lookup', { items: toFetch.map((t) => t.item) });
    const fetched = extractJson(content, true);
    fetched.forEach((nutrition, i) => {
      const { item, index } = toFetch[i];
      results[index] = learnAndCache(item, nutrition);
    });
  }

  return results;
};
