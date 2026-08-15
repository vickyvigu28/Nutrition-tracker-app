export const MACRO_FIELDS = [
  { key: 'protein_g', label: 'Protein', unit: 'g', color: 'bg-blue-100 text-blue-700' },
  { key: 'carbs_g', label: 'Carbs', unit: 'g', color: 'bg-amber-100 text-amber-700' },
  { key: 'fiber_g', label: 'Fiber', unit: 'g', color: 'bg-green-100 text-green-700' },
  { key: 'fat_g', label: 'Fat', unit: 'g', color: 'bg-red-100 text-red-700' }
];

export const MICRO_FIELDS = [
  { key: 'calcium_mg', label: 'Calcium', unit: 'mg' },
  { key: 'zinc_mg', label: 'Zinc', unit: 'mg' },
  { key: 'iron_mg', label: 'Iron', unit: 'mg' },
  { key: 'magnesium_mg', label: 'Magnesium', unit: 'mg' },
  { key: 'potassium_mg', label: 'Potassium', unit: 'mg' },
  { key: 'sodium_mg', label: 'Sodium', unit: 'mg' },
  { key: 'vitamin_d_mcg', label: 'Vitamin D', unit: 'mcg' },
  { key: 'vitamin_b12_mcg', label: 'Vitamin B12', unit: 'mcg' },
  { key: 'vitamin_c_mg', label: 'Vitamin C', unit: 'mg' },
  { key: 'folate_mcg', label: 'Folate', unit: 'mcg' }
];

export const ALL_NUTRIENT_KEYS = [
  ...MACRO_FIELDS.map((f) => f.key),
  ...MICRO_FIELDS.map((f) => f.key),
  'calories'
];

export const GOAL_OPTIONS = [
  { value: 'reduce_belly_fat', label: 'Reduce belly fat' },
  { value: 'weight_loss', label: 'Weight loss' },
  { value: 'weight_gain', label: 'Weight gain' },
  { value: 'maintain', label: 'Maintain weight' },
  { value: 'build_muscle', label: 'Build muscle' },
  { value: 'lower_ldl', label: 'Cholesterol control' },
  { value: 'bp_control', label: 'Blood pressure control' },
  { value: 'blood_sugar_control', label: 'Blood sugar control' },
  { value: 'heart_health', label: 'Heart health' },
  { value: 'bone_health', label: 'Bone health' },
  { value: 'improve_energy', label: 'Improve energy levels' },
  { value: 'improve_digestion', label: 'Improve digestion' },
  { value: 'general_fitness', label: 'General fitness' }
];

export const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];

export const STATUS_COLORS = {
  success: '#10b981',
  warning: '#f59e0b',
  over: '#ef4444',
  neutral: '#9ca3af'
};

export const DEFAULT_PROFILE = {
  name: '',
  height_cm: 170,
  weight_kg: 70,
  goal_weight_kg: 65,
  goals: [],
  bmi: 0,
  age: 30,
  gender: 'male'
};

export const DEFAULT_TARGETS = {
  calories_daily: 2000,
  protein_g: 120,
  carbs_g: 220,
  fat_g: 65,
  fiber_g: 30,
  calcium_mg: 1000,
  zinc_mg: 11,
  iron_mg: 14,
  magnesium_mg: 350,
  potassium_mg: 3000,
  sodium_mg: 2300,
  vitamin_d_mcg: 15,
  vitamin_b12_mcg: 2.4,
  vitamin_c_mg: 75,
  folate_mcg: 400,
  user_overrides: {}
};

export const emptyUserData = (userId, profile, targets) => ({
  user_id: userId,
  profile,
  targets,
  meals: [],
  daily_totals: {},
  water_intake: {},
  last_synced: null
});
