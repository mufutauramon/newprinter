export const NUTRITION_DB: Record<
  string,
  {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }
> = {
  "jollof rice": {
    calories: 550,
    protein: 18,
    carbs: 72,
    fat: 20,
  },

  "jollof rice + chicken": {
    calories: 850,
    protein: 42,
    carbs: 75,
    fat: 32,
  },

  "egusi": {
    calories: 700,
    protein: 24,
    carbs: 35,
    fat: 52,
  },

  "egusi soup": {
    calories: 720,
    protein: 26,
    carbs: 34,
    fat: 55,
  },

  "egusi + pounded yam": {
    calories: 950,
    protein: 28,
    carbs: 88,
    fat: 54,
  },

  "pounded yam": {
    calories: 380,
    protein: 5,
    carbs: 85,
    fat: 1,
  },

  "fried plantain": {
    calories: 420,
    protein: 3,
    carbs: 55,
    fat: 21,
  },

  akara: {
    calories: 350,
    protein: 15,
    carbs: 28,
    fat: 20,
  },

  pap: {
    calories: 180,
    protein: 4,
    carbs: 36,
    fat: 2,
  },

  "pap + akara": {
    calories: 620,
    protein: 18,
    carbs: 60,
    fat: 25,
  },

  rice: {
    calories: 300,
    protein: 6,
    carbs: 60,
    fat: 2,
  },

  chicken: {
    calories: 320,
    protein: 35,
    carbs: 0,
    fat: 20,
  },

  beans: {
    calories: 320,
    protein: 18,
    carbs: 45,
    fat: 6,
  },

  yam: {
    calories: 280,
    protein: 4,
    carbs: 65,
    fat: 1,
  },

  fish: {
    calories: 250,
    protein: 30,
    carbs: 0,
    fat: 12,
  },

  bread: {
    calories: 160,
    protein: 5,
    carbs: 30,
    fat: 2,
  },

  egg: {
    calories: 90,
    protein: 8,
    carbs: 1,
    fat: 6,
  },

  tea: {
    calories: 40,
    protein: 1,
    carbs: 8,
    fat: 1,
  },

  okro: {
    calories: 210,
    protein: 6,
    carbs: 20,
    fat: 12,
  },

  garri: {
    calories: 320,
    protein: 2,
    carbs: 76,
    fat: 1,
  },

  plantain: {
    calories: 220,
    protein: 2,
    carbs: 58,
    fat: 1,
  },

  banana: {
    calories: 120,
    protein: 1,
    carbs: 31,
    fat: 0,
  },

  apple: {
    calories: 95,
    protein: 1,
    carbs: 25,
    fat: 0,
  },

  orange: {
    calories: 85,
    protein: 1,
    carbs: 21,
    fat: 0,
  },

  grapes: {
    calories: 110,
    protein: 1,
    carbs: 28,
    fat: 0,
  },

  watermelon: {
    calories: 90,
    protein: 2,
    carbs: 22,
    fat: 0,
  },
};

export function estimateMealNutrition(mealName: string) {
  const lower = String(mealName || "").toLowerCase();

  const exact = NUTRITION_DB[lower];
  if (exact) return exact;

  let calories = 0;
  let protein = 0;
  let carbs = 0;
  let fat = 0;

  Object.entries(NUTRITION_DB).forEach(([key, value]) => {
    if (lower.includes(key)) {
      calories += value.calories;
      protein += value.protein;
      carbs += value.carbs;
      fat += value.fat;
    }
  });

  if (calories === 0) {
    return {
      calories: 400,
      protein: 12,
      carbs: 45,
      fat: 10,
    };
  }

  return {
    calories,
    protein,
    carbs,
    fat,
  };
}