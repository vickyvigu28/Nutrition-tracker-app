export const calculateBMI = (heightCm, weightKg) => {
  if (!heightCm || !weightKg) return 0;
  const heightM = heightCm / 100;
  return parseFloat((weightKg / (heightM * heightM)).toFixed(1));
};

export const getBMICategory = (bmi) => {
  if (!bmi) return 'unknown';
  if (bmi < 18.5) return 'underweight';
  if (bmi < 25) return 'normal';
  if (bmi < 30) return 'overweight';
  return 'obese';
};

export const calculateMacros = (heightCm, weightKg, goalWeightKg, age, gender, goals = []) => {
  const bmi = calculateBMI(heightCm, weightKg);

  let bmr;
  if (gender === 'male') {
    bmr = 88.362 + 13.397 * weightKg + 4.799 * heightCm - 5.677 * age;
  } else {
    bmr = 447.593 + 9.247 * weightKg + 3.098 * heightCm - 4.33 * age;
  }

  const tdee = bmr * 1.55;

  let calories = tdee;
  if (weightKg > goalWeightKg) {
    calories = tdee - 500;
  } else if (weightKg < goalWeightKg) {
    calories = tdee + 300;
  }
  calories = Math.max(calories, 1200);

  const proteinG = weightKg * 1.8;
  const fatG = (calories * 0.25) / 9;
  const carbsG = Math.max((calories - proteinG * 4 - fatG * 9) / 4, 0);
  let fiberG = weightKg * 0.4;

  const calciumMg = 1000;
  const zincMg = gender === 'male' ? 11 : 8;
  const ironMg = gender === 'male' ? 8 : 18;
  const magnesiumMg = gender === 'male' ? 400 : 310;
  let potassiumMg = gender === 'male' ? 3400 : 2600;
  let sodiumMg = 2300;
  const vitaminDMcg = 15;
  const vitaminB12Mcg = 2.4;
  const vitaminCMg = gender === 'male' ? 90 : 75;
  const folateMcg = 400;

  if (goals.includes('lower_ldl') || goals.includes('heart_health')) {
    fiberG = Math.max(fiberG, 35);
  }
  if (goals.includes('bp_control') || goals.includes('heart_health')) {
    sodiumMg = 1500;
    potassiumMg = Math.max(potassiumMg, 3500);
  }
  if (goals.includes('blood_sugar_control')) {
    fiberG = Math.max(fiberG, 30);
  }

  return {
    bmi,
    tdee: Math.round(tdee),
    calories_daily: Math.round(calories),
    protein_g: Math.round(proteinG),
    carbs_g: Math.round(carbsG),
    fat_g: Math.round(fatG),
    fiber_g: Math.round(fiberG),
    calcium_mg: calciumMg,
    zinc_mg: zincMg,
    iron_mg: ironMg,
    magnesium_mg: magnesiumMg,
    potassium_mg: potassiumMg,
    sodium_mg: sodiumMg,
    vitamin_d_mcg: vitaminDMcg,
    vitamin_b12_mcg: vitaminB12Mcg,
    vitamin_c_mg: vitaminCMg,
    folate_mcg: folateMcg
  };
};
