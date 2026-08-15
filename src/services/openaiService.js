import { NUTRITION_DB, NUTRIENT_KEYS, findDbKey, scaleEntry } from './nutritionDB.js';
import { findCachedKey, getCachedEntry, cacheFood } from './foodCache.js';
import { getConnections } from './connectionConfig.js';
import { round2 } from '../utils/format.js';

// Both functions below fall back to deterministic mock/local data whenever
// no key is set. Add a key via Settings -> Connections and the real fetch
// path below takes over with no other code changes: unrecognized foods get
// looked up once via OpenAI, then cached locally (foodCache.js) so the same
// food never needs a second paid API call.
export const isOpenAIConfigured = () => Boolean(getConnections().OPENAI_API_KEY);

const SYSTEM_PROMPT_PARSE = `You are a nutrition data validator, not a guesser.
Your job is to:
1. Parse food items mentioned, extracting any quantity/weight/volume already stated (e.g. "200ml milk", "2 eggs", "50g paneer")
2. Only flag an item as ambiguous if its amount genuinely cannot be determined (e.g. "a cup of dal", "some rice") - never ask again when a specific amount/unit was already given
3. When asking, always ask for a precise amount in grams or milliliters - never vague sizes like "small/medium/large"

Do NOT estimate calories or macros. Your job is to clarify intent only.

Return ONLY valid JSON with no markdown:
{
  "parsed_items": [
    { "item": "milk", "quantity": 200, "amount": { "value": 200, "unit": "ml" }, "confidence": "high" },
    { "item": "dal", "quantity": 1, "amount": null, "confidence": "low" }
  ],
  "ambiguities": [
    { "item": "dal", "question": "How many grams of dal?", "unit": "g", "placeholder": 200 }
  ]
}`;

const SYSTEM_PROMPT_NUTRITION = `You are a nutrition lookup service. Given confirmed food items with amounts, return accurate nutrition data scaled to the stated amount.
Use USDA FoodData Central estimates. Be conservative - don't inflate numbers.

Return ONLY valid JSON array with no markdown, including all of these nutrient fields for every item:
[
  { "food_name": "egg, medium, boiled", "portion": "1 medium (50g)", "calories": 78, "protein_g": 6.3, "carbs_g": 0.6, "fat_g": 5.3, "fiber_g": 0, "calcium_mg": 28, "zinc_mg": 0.6, "iron_mg": 0.9, "magnesium_mg": 5, "potassium_mg": 63, "sodium_mg": 62, "vitamin_d_mcg": 1, "vitamin_b12_mcg": 0.35, "vitamin_c_mg": 0, "folate_mcg": 12, "source": "USDA" }
]`;

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

const callOpenAI = async (systemPrompt, userMessage, maxTokens, temperature) => {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getConnections().OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      temperature,
      max_tokens: maxTokens
    })
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || 'OpenAI API error');
  return data.choices[0].message.content;
};

export const parseFoodInput = async (userInput) => {
  if (!isOpenAIConfigured()) {
    return mockParseFoodInput(userInput);
  }
  const content = await callOpenAI(SYSTEM_PROMPT_PARSE, `Parse this food input: "${userInput}"`, 500, 0.7);
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

  if (!isOpenAIConfigured()) {
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
    const content = await callOpenAI(
      SYSTEM_PROMPT_NUTRITION,
      `Get nutrition for: ${JSON.stringify(toFetch.map((t) => t.item))}`,
      800,
      0.5
    );
    const fetched = extractJson(content, true);
    fetched.forEach((nutrition, i) => {
      const { item, index } = toFetch[i];
      results[index] = learnAndCache(item, nutrition);
    });
  }

  return results;
};
