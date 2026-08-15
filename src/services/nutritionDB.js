import { round2 } from '../utils/format.js';

// Small offline nutrition lookup used as a fallback when OpenAI is not
// configured, or to skip a paid API call for foods we already know (see
// openaiService.js). Values are rough per-baseAmount estimates, not a
// substitute for a real USDA/IFCT lookup.
//
// unitType: 'count' foods scale by piece count (baseAmount = pieces the
// listed values are for). 'weight'/'volume' foods scale by grams/ml
// against baseAmount.
export const NUTRITION_DB = {
  egg: { food_name: 'egg, medium, boiled', portion: '1 medium (50g)', unitType: 'count', baseAmount: 1, calories: 78, protein_g: 6.3, carbs_g: 0.6, fat_g: 5.3, fiber_g: 0, calcium_mg: 28, zinc_mg: 0.6, iron_mg: 0.9, magnesium_mg: 5, potassium_mg: 63, sodium_mg: 62, vitamin_d_mcg: 1, vitamin_b12_mcg: 0.35, vitamin_c_mg: 0, folate_mcg: 12 },
  rice: { food_name: 'rice, white, cooked', portion: '150g', unitType: 'weight', baseAmount: 150, calories: 205, protein_g: 4.3, carbs_g: 45, fat_g: 0.4, fiber_g: 0.6, calcium_mg: 16, zinc_mg: 0.8, iron_mg: 0.3, magnesium_mg: 9, potassium_mg: 30, sodium_mg: 1, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, vitamin_c_mg: 0, folate_mcg: 3 },
  roti: { food_name: 'roti, whole wheat', portion: '1 piece (40g)', unitType: 'count', baseAmount: 1, calories: 120, protein_g: 3.6, carbs_g: 20, fat_g: 3.5, fiber_g: 2.5, calcium_mg: 20, zinc_mg: 0.5, iron_mg: 1, magnesium_mg: 20, potassium_mg: 70, sodium_mg: 150, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, vitamin_c_mg: 0, folate_mcg: 10 },
  dal: { food_name: 'dal, lentils, cooked', portion: '200g', unitType: 'weight', baseAmount: 200, calories: 230, protein_g: 18, carbs_g: 40, fat_g: 1, fiber_g: 16, calcium_mg: 60, zinc_mg: 2.5, iron_mg: 3.3, magnesium_mg: 36, potassium_mg: 365, sodium_mg: 4, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, vitamin_c_mg: 1.5, folate_mcg: 180 },
  banana: { food_name: 'banana, medium', portion: '1 medium (118g)', unitType: 'count', baseAmount: 1, calories: 105, protein_g: 1.3, carbs_g: 27, fat_g: 0.4, fiber_g: 3.1, calcium_mg: 6, zinc_mg: 0.2, iron_mg: 0.3, magnesium_mg: 32, potassium_mg: 422, sodium_mg: 1, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, vitamin_c_mg: 10, folate_mcg: 24 },
  chicken: { food_name: 'chicken breast, grilled', portion: '100g', unitType: 'weight', baseAmount: 100, calories: 165, protein_g: 31, carbs_g: 0, fat_g: 3.6, fiber_g: 0, calcium_mg: 15, zinc_mg: 1, iron_mg: 1, magnesium_mg: 29, potassium_mg: 256, sodium_mg: 74, vitamin_d_mcg: 0.1, vitamin_b12_mcg: 0.3, vitamin_c_mg: 0, folate_mcg: 4 },
  milk: { food_name: 'milk, whole', portion: '240ml', unitType: 'volume', baseAmount: 240, calories: 149, protein_g: 8, carbs_g: 12, fat_g: 8, fiber_g: 0, calcium_mg: 276, zinc_mg: 1, iron_mg: 0.1, magnesium_mg: 24, potassium_mg: 322, sodium_mg: 105, vitamin_d_mcg: 3.2, vitamin_b12_mcg: 1.1, vitamin_c_mg: 0, folate_mcg: 12 },
  paneer: { food_name: 'paneer, raw', portion: '100g', unitType: 'weight', baseAmount: 100, calories: 265, protein_g: 18, carbs_g: 1.2, fat_g: 21, fiber_g: 0, calcium_mg: 208, zinc_mg: 1.2, iron_mg: 0.2, magnesium_mg: 20, potassium_mg: 138, sodium_mg: 18, vitamin_d_mcg: 0, vitamin_b12_mcg: 0.5, vitamin_c_mg: 0, folate_mcg: 20 },
  apple: { food_name: 'apple, medium', portion: '1 medium (182g)', unitType: 'count', baseAmount: 1, calories: 95, protein_g: 0.5, carbs_g: 25, fat_g: 0.3, fiber_g: 4.4, calcium_mg: 11, zinc_mg: 0.1, iron_mg: 0.2, magnesium_mg: 11, potassium_mg: 214, sodium_mg: 2, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, vitamin_c_mg: 8.4, folate_mcg: 5 },
  almonds: { food_name: 'almonds', portion: '10 pieces (12g)', unitType: 'count', baseAmount: 10, calories: 70, protein_g: 2.6, carbs_g: 2.6, fat_g: 6, fiber_g: 1.5, calcium_mg: 30, zinc_mg: 0.4, iron_mg: 0.4, magnesium_mg: 32, potassium_mg: 90, sodium_mg: 0, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, vitamin_c_mg: 0, folate_mcg: 5 },
  yogurt: { food_name: 'yogurt, plain', portion: '245g', unitType: 'weight', baseAmount: 245, calories: 149, protein_g: 8.5, carbs_g: 11, fat_g: 8, fiber_g: 0, calcium_mg: 296, zinc_mg: 1.3, iron_mg: 0.1, magnesium_mg: 26, potassium_mg: 380, sodium_mg: 113, vitamin_d_mcg: 0, vitamin_b12_mcg: 1.1, vitamin_c_mg: 1.6, folate_mcg: 25 },
  oats: { food_name: 'oats, cooked', portion: '234g', unitType: 'weight', baseAmount: 234, calories: 166, protein_g: 5.9, carbs_g: 28, fat_g: 3.6, fiber_g: 4, calcium_mg: 187, zinc_mg: 1.4, iron_mg: 2, magnesium_mg: 63, potassium_mg: 164, sodium_mg: 9, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, vitamin_c_mg: 0, folate_mcg: 14 },
  spinach: { food_name: 'spinach, cooked', portion: '180g', unitType: 'weight', baseAmount: 180, calories: 41, protein_g: 5.3, carbs_g: 6.8, fat_g: 0.5, fiber_g: 4.3, calcium_mg: 245, zinc_mg: 1.4, iron_mg: 3.6, magnesium_mg: 157, potassium_mg: 839, sodium_mg: 138, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, vitamin_c_mg: 9.8, folate_mcg: 263 },

  // -- Typical Indian foods --
  idli: { food_name: 'idli, steamed', portion: '1 piece (35g)', unitType: 'count', baseAmount: 1, calories: 39, protein_g: 1.6, carbs_g: 8, fat_g: 0.2, fiber_g: 0.5, calcium_mg: 2, zinc_mg: 0.2, iron_mg: 0.2, magnesium_mg: 3, potassium_mg: 20, sodium_mg: 80, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, vitamin_c_mg: 0, folate_mcg: 5 },
  dosa: { food_name: 'dosa, plain', portion: '1 piece (60g)', unitType: 'count', baseAmount: 1, calories: 133, protein_g: 2.7, carbs_g: 20, fat_g: 4, fiber_g: 0.6, calcium_mg: 5, zinc_mg: 0.3, iron_mg: 0.5, magnesium_mg: 8, potassium_mg: 45, sodium_mg: 120, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, vitamin_c_mg: 0, folate_mcg: 8 },
  uttapam: { food_name: 'uttapam, vegetable', portion: '1 piece (80g)', unitType: 'count', baseAmount: 1, calories: 160, protein_g: 4, carbs_g: 25, fat_g: 5, fiber_g: 1.5, calcium_mg: 15, zinc_mg: 0.4, iron_mg: 0.8, magnesium_mg: 12, potassium_mg: 90, sodium_mg: 200, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, vitamin_c_mg: 3, folate_mcg: 10 },
  sambar: { food_name: 'sambar', portion: '240ml', unitType: 'volume', baseAmount: 240, calories: 120, protein_g: 6, carbs_g: 18, fat_g: 3, fiber_g: 5, calcium_mg: 40, zinc_mg: 0.8, iron_mg: 1.5, magnesium_mg: 30, potassium_mg: 250, sodium_mg: 400, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, vitamin_c_mg: 5, folate_mcg: 40 },
  poha: { food_name: 'poha, flattened rice', portion: '150g', unitType: 'weight', baseAmount: 150, calories: 250, protein_g: 4, carbs_g: 45, fat_g: 6, fiber_g: 2, calcium_mg: 20, zinc_mg: 0.5, iron_mg: 1.5, magnesium_mg: 15, potassium_mg: 100, sodium_mg: 300, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, vitamin_c_mg: 8, folate_mcg: 20 },
  upma: { food_name: 'upma, semolina', portion: '200g', unitType: 'weight', baseAmount: 200, calories: 230, protein_g: 6, carbs_g: 35, fat_g: 7, fiber_g: 2.5, calcium_mg: 25, zinc_mg: 0.6, iron_mg: 1.2, magnesium_mg: 20, potassium_mg: 120, sodium_mg: 350, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, vitamin_c_mg: 4, folate_mcg: 15 },
  paratha: { food_name: 'paratha, plain', portion: '1 piece (60g)', unitType: 'count', baseAmount: 1, calories: 210, protein_g: 4.5, carbs_g: 27, fat_g: 9, fiber_g: 2, calcium_mg: 20, zinc_mg: 0.5, iron_mg: 1.2, magnesium_mg: 15, potassium_mg: 80, sodium_mg: 190, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, vitamin_c_mg: 0, folate_mcg: 12 },
  naan: { food_name: 'naan, plain', portion: '1 piece (90g)', unitType: 'count', baseAmount: 1, calories: 260, protein_g: 8.7, carbs_g: 45, fat_g: 5, fiber_g: 2, calcium_mg: 90, zinc_mg: 0.6, iron_mg: 1.6, magnesium_mg: 20, potassium_mg: 110, sodium_mg: 430, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, vitamin_c_mg: 0, folate_mcg: 20 },
  samosa: { food_name: 'samosa, fried', portion: '1 piece (50g)', unitType: 'count', baseAmount: 1, calories: 150, protein_g: 3, carbs_g: 18, fat_g: 8, fiber_g: 1.5, calcium_mg: 10, zinc_mg: 0.3, iron_mg: 0.8, magnesium_mg: 10, potassium_mg: 60, sodium_mg: 250, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, vitamin_c_mg: 2, folate_mcg: 10 },
  pakora: { food_name: 'pakora, vegetable, fried', portion: '4 pieces (60g)', unitType: 'weight', baseAmount: 60, calories: 180, protein_g: 4, carbs_g: 16, fat_g: 12, fiber_g: 2, calcium_mg: 20, zinc_mg: 0.4, iron_mg: 1, magnesium_mg: 15, potassium_mg: 150, sodium_mg: 300, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, vitamin_c_mg: 5, folate_mcg: 15 },
  rajma: { food_name: 'rajma, kidney bean curry', portion: '200g', unitType: 'weight', baseAmount: 200, calories: 220, protein_g: 12, carbs_g: 35, fat_g: 3, fiber_g: 10, calcium_mg: 60, zinc_mg: 1.5, iron_mg: 3, magnesium_mg: 50, potassium_mg: 400, sodium_mg: 450, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, vitamin_c_mg: 3, folate_mcg: 130 },
  chole: { food_name: 'chole, chickpea curry', portion: '200g', unitType: 'weight', baseAmount: 200, calories: 270, protein_g: 12, carbs_g: 38, fat_g: 8, fiber_g: 10, calcium_mg: 70, zinc_mg: 1.8, iron_mg: 3.5, magnesium_mg: 55, potassium_mg: 420, sodium_mg: 500, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, vitamin_c_mg: 4, folate_mcg: 140 },
  'palak paneer': { food_name: 'palak paneer', portion: '200g', unitType: 'weight', baseAmount: 200, calories: 300, protein_g: 14, carbs_g: 10, fat_g: 22, fiber_g: 4, calcium_mg: 320, zinc_mg: 1.4, iron_mg: 3, magnesium_mg: 60, potassium_mg: 450, sodium_mg: 480, vitamin_d_mcg: 0, vitamin_b12_mcg: 0.4, vitamin_c_mg: 12, folate_mcg: 80 },
  'aloo gobi': { food_name: 'aloo gobi', portion: '200g', unitType: 'weight', baseAmount: 200, calories: 180, protein_g: 4, carbs_g: 24, fat_g: 8, fiber_g: 5, calcium_mg: 40, zinc_mg: 0.6, iron_mg: 1.5, magnesium_mg: 30, potassium_mg: 400, sodium_mg: 350, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, vitamin_c_mg: 40, folate_mcg: 40 },
  khichdi: { food_name: 'khichdi, rice and lentils', portion: '250g', unitType: 'weight', baseAmount: 250, calories: 280, protein_g: 10, carbs_g: 48, fat_g: 5, fiber_g: 6, calcium_mg: 40, zinc_mg: 1.2, iron_mg: 2, magnesium_mg: 30, potassium_mg: 250, sodium_mg: 350, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, vitamin_c_mg: 2, folate_mcg: 60 },
  biryani: { food_name: 'biryani, chicken', portion: '300g', unitType: 'weight', baseAmount: 300, calories: 450, protein_g: 22, carbs_g: 55, fat_g: 15, fiber_g: 2, calcium_mg: 50, zinc_mg: 1.8, iron_mg: 2.5, magnesium_mg: 40, potassium_mg: 350, sodium_mg: 700, vitamin_d_mcg: 0, vitamin_b12_mcg: 0.4, vitamin_c_mg: 4, folate_mcg: 30 },
  'curd rice': { food_name: 'curd rice', portion: '250g', unitType: 'weight', baseAmount: 250, calories: 220, protein_g: 7, carbs_g: 35, fat_g: 5, fiber_g: 1, calcium_mg: 150, zinc_mg: 0.7, iron_mg: 0.5, magnesium_mg: 20, potassium_mg: 200, sodium_mg: 150, vitamin_d_mcg: 0, vitamin_b12_mcg: 0.5, vitamin_c_mg: 1, folate_mcg: 10 },
  buttermilk: { food_name: 'buttermilk, spiced', portion: '240ml', unitType: 'volume', baseAmount: 240, calories: 40, protein_g: 3, carbs_g: 5, fat_g: 1, fiber_g: 0, calcium_mg: 100, zinc_mg: 0.3, iron_mg: 0.1, magnesium_mg: 10, potassium_mg: 150, sodium_mg: 100, vitamin_d_mcg: 0, vitamin_b12_mcg: 0.3, vitamin_c_mg: 0, folate_mcg: 5 },
  ghee: { food_name: 'ghee, clarified butter', portion: '1 tbsp (14g)', unitType: 'weight', baseAmount: 14, calories: 120, protein_g: 0, carbs_g: 0, fat_g: 14, fiber_g: 0, calcium_mg: 0, zinc_mg: 0, iron_mg: 0, magnesium_mg: 0, potassium_mg: 0, sodium_mg: 0, vitamin_d_mcg: 0.1, vitamin_b12_mcg: 0, vitamin_c_mg: 0, folate_mcg: 0 },
  chai: { food_name: 'chai, milk tea', portion: '150ml', unitType: 'volume', baseAmount: 150, calories: 80, protein_g: 2, carbs_g: 10, fat_g: 3, fiber_g: 0, calcium_mg: 60, zinc_mg: 0.2, iron_mg: 0.1, magnesium_mg: 8, potassium_mg: 90, sodium_mg: 20, vitamin_d_mcg: 0.3, vitamin_b12_mcg: 0.1, vitamin_c_mg: 0, folate_mcg: 3 },
  coffee: { food_name: 'coffee, with milk', portion: '150ml', unitType: 'volume', baseAmount: 150, calories: 60, protein_g: 2, carbs_g: 7, fat_g: 2.5, fiber_g: 0, calcium_mg: 50, zinc_mg: 0.2, iron_mg: 0.1, magnesium_mg: 7, potassium_mg: 80, sodium_mg: 15, vitamin_d_mcg: 0.2, vitamin_b12_mcg: 0.1, vitamin_c_mg: 0, folate_mcg: 2 },

  // -- General staples --
  bread: { food_name: 'bread, white, slice', portion: '1 slice (28g)', unitType: 'count', baseAmount: 1, calories: 75, protein_g: 2.6, carbs_g: 14, fat_g: 1, fiber_g: 0.8, calcium_mg: 30, zinc_mg: 0.2, iron_mg: 0.7, magnesium_mg: 6, potassium_mg: 30, sodium_mg: 150, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, vitamin_c_mg: 0, folate_mcg: 20 },
  butter: { food_name: 'butter', portion: '1 tbsp (14g)', unitType: 'weight', baseAmount: 14, calories: 100, protein_g: 0.1, carbs_g: 0, fat_g: 11, fiber_g: 0, calcium_mg: 3, zinc_mg: 0, iron_mg: 0, magnesium_mg: 0, potassium_mg: 3, sodium_mg: 90, vitamin_d_mcg: 0.2, vitamin_b12_mcg: 0.02, vitamin_c_mg: 0, folate_mcg: 0 },
  cheese: { food_name: 'cheese, cheddar', portion: '1 slice (28g)', unitType: 'count', baseAmount: 1, calories: 110, protein_g: 7, carbs_g: 1, fat_g: 9, fiber_g: 0, calcium_mg: 200, zinc_mg: 1, iron_mg: 0.2, magnesium_mg: 8, potassium_mg: 30, sodium_mg: 180, vitamin_d_mcg: 0.2, vitamin_b12_mcg: 0.2, vitamin_c_mg: 0, folate_mcg: 5 },
  potato: { food_name: 'potato, boiled', portion: '150g', unitType: 'weight', baseAmount: 150, calories: 130, protein_g: 2.7, carbs_g: 30, fat_g: 0.2, fiber_g: 2.7, calcium_mg: 8, zinc_mg: 0.4, iron_mg: 0.5, magnesium_mg: 30, potassium_mg: 620, sodium_mg: 6, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, vitamin_c_mg: 20, folate_mcg: 16 },
  tomato: { food_name: 'tomato, raw', portion: '1 medium (123g)', unitType: 'count', baseAmount: 1, calories: 22, protein_g: 1.1, carbs_g: 4.8, fat_g: 0.2, fiber_g: 1.5, calcium_mg: 12, zinc_mg: 0.2, iron_mg: 0.3, magnesium_mg: 13, potassium_mg: 292, sodium_mg: 6, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, vitamin_c_mg: 17, folate_mcg: 18 },
  onion: { food_name: 'onion, raw', portion: '1 medium (110g)', unitType: 'count', baseAmount: 1, calories: 44, protein_g: 1.2, carbs_g: 10.3, fat_g: 0.1, fiber_g: 1.9, calcium_mg: 25, zinc_mg: 0.2, iron_mg: 0.2, magnesium_mg: 12, potassium_mg: 161, sodium_mg: 4, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, vitamin_c_mg: 7.4, folate_mcg: 19 },
  cucumber: { food_name: 'cucumber, raw', portion: '100g', unitType: 'weight', baseAmount: 100, calories: 15, protein_g: 0.7, carbs_g: 3.6, fat_g: 0.1, fiber_g: 0.5, calcium_mg: 16, zinc_mg: 0.2, iron_mg: 0.3, magnesium_mg: 13, potassium_mg: 147, sodium_mg: 2, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, vitamin_c_mg: 2.8, folate_mcg: 7 },
  carrot: { food_name: 'carrot, raw', portion: '1 medium (61g)', unitType: 'count', baseAmount: 1, calories: 25, protein_g: 0.6, carbs_g: 6, fat_g: 0.1, fiber_g: 1.7, calcium_mg: 20, zinc_mg: 0.1, iron_mg: 0.2, magnesium_mg: 7, potassium_mg: 195, sodium_mg: 42, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, vitamin_c_mg: 3.6, folate_mcg: 12 },
  orange: { food_name: 'orange, medium', portion: '1 medium (131g)', unitType: 'count', baseAmount: 1, calories: 62, protein_g: 1.2, carbs_g: 15.4, fat_g: 0.2, fiber_g: 3.1, calcium_mg: 52, zinc_mg: 0.1, iron_mg: 0.1, magnesium_mg: 13, potassium_mg: 237, sodium_mg: 0, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, vitamin_c_mg: 70, folate_mcg: 40 },
  mango: { food_name: 'mango, medium', portion: '1 medium (200g)', unitType: 'count', baseAmount: 1, calories: 120, protein_g: 1.6, carbs_g: 30, fat_g: 0.6, fiber_g: 3.2, calcium_mg: 20, zinc_mg: 0.1, iron_mg: 0.3, magnesium_mg: 20, potassium_mg: 320, sodium_mg: 2, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, vitamin_c_mg: 60, folate_mcg: 140 },
  watermelon: { food_name: 'watermelon', portion: '150g', unitType: 'weight', baseAmount: 150, calories: 45, protein_g: 0.9, carbs_g: 11, fat_g: 0.2, fiber_g: 0.6, calcium_mg: 11, zinc_mg: 0.1, iron_mg: 0.4, magnesium_mg: 15, potassium_mg: 170, sodium_mg: 1, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, vitamin_c_mg: 12, folate_mcg: 5 },
  peanuts: { food_name: 'peanuts, roasted', portion: '30g', unitType: 'weight', baseAmount: 30, calories: 170, protein_g: 7, carbs_g: 6, fat_g: 14, fiber_g: 2.4, calcium_mg: 20, zinc_mg: 1, iron_mg: 0.7, magnesium_mg: 48, potassium_mg: 180, sodium_mg: 5, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, vitamin_c_mg: 0, folate_mcg: 40 },
  cashews: { food_name: 'cashews', portion: '10 pieces (18g)', unitType: 'count', baseAmount: 10, calories: 100, protein_g: 3.3, carbs_g: 5.5, fat_g: 8, fiber_g: 0.6, calcium_mg: 8, zinc_mg: 1, iron_mg: 1, magnesium_mg: 40, potassium_mg: 100, sodium_mg: 2, vitamin_d_mcg: 0, vitamin_b12_mcg: 0, vitamin_c_mg: 0, folate_mcg: 7 }
};

export const NUTRIENT_KEYS = [
  'calories', 'protein_g', 'carbs_g', 'fat_g', 'fiber_g', 'calcium_mg', 'zinc_mg',
  'iron_mg', 'magnesium_mg', 'potassium_mg', 'sodium_mg', 'vitamin_d_mcg',
  'vitamin_b12_mcg', 'vitamin_c_mg', 'folate_mcg'
];

// Prefer the longest/most specific matching key so multi-word dishes (e.g.
// "palak paneer") don't get shadowed by a shorter ingredient key ("paneer").
export const findDbKey = (itemName) => {
  const name = (itemName || '').toLowerCase();
  const matches = Object.keys(NUTRITION_DB).filter((k) => name.includes(k));
  if (!matches.length) return undefined;
  return matches.reduce((longest, k) => (k.length > longest.length ? k : longest));
};

const amountUnit = (entry) => (entry.unitType === 'volume' ? 'ml' : entry.unitType === 'count' ? 'count' : 'g');

// amount: { value, unit: 'g'|'ml'|'count' } | null. null uses the entry's base portion as-is.
export const scaleEntry = (entry, amount) => {
  const resolved = amount && amount.value ? amount : { value: entry.baseAmount, unit: amountUnit(entry) };
  const multiplier = resolved.value / (entry.baseAmount || 1);
  const scaled = { ...entry };
  NUTRIENT_KEYS.forEach((key) => {
    scaled[key] = round2(entry[key] * multiplier);
  });
  scaled.portion =
    entry.unitType === 'count' ? `${resolved.value} ${resolved.value === 1 ? 'piece' : 'pieces'}` : `${resolved.value}${entry.unitType === 'volume' ? 'ml' : 'g'}`;
  scaled.amount = resolved;
  return scaled;
};

export const lookupNutrition = (itemName, amount = null) => {
  const key = findDbKey(itemName);
  if (!key) return null;
  return { ...scaleEntry({ ...NUTRITION_DB[key], source: 'local_fallback' }, amount), dbKey: key };
};
