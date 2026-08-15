// Foods looked up via a real OpenAI call get remembered here so the same
// food never needs a second (paid) API call - a simple stand-in for the
// "prompt caching" idea from the original spec, scoped to nutrition lookups
// instead of system prompts.
const CACHE_KEY = 'nutrition_food_cache';

const readCache = () => {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY)) || {};
  } catch {
    return {};
  }
};

const writeCache = (cache) => localStorage.setItem(CACHE_KEY, JSON.stringify(cache));

export const findCachedKey = (itemName) => {
  const name = (itemName || '').toLowerCase();
  const matches = Object.keys(readCache()).filter((k) => name.includes(k));
  if (!matches.length) return undefined;
  return matches.reduce((longest, k) => (k.length > longest.length ? k : longest));
};

export const getCachedEntry = (key) => readCache()[key];

export const cacheFood = (key, entry) => {
  const cache = readCache();
  cache[key] = entry;
  writeCache(cache);
};

export const getAllCachedFoods = () => readCache();
