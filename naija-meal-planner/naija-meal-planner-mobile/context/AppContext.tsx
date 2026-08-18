import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
} from "react";
import * as Location from "expo-location";
import * as SecureStore from "expo-secure-store";
import { apiFetch } from "../utils/api";
import { formatUSDForRegion } from "../utils/currency";
import { AppState } from "react-native";
import { initPurchases, checkIsPro } from "../lib/purchases";

type Region = "us" | "ng" | "ca" | "uk" | "au";
type PriceItem = {
  item: string;
  price: number;
};

const DEFAULT_PRICES: Record<string, number> = {
  cornmeal: 2,
  water: 1,
  sugar: 2,
  "black-eyed peas": 3,
  onion: 1,
  "vegetable oil": 4,
  rice: 3,
  tomato: 2,
  pepper: 1,
  chicken: 6,
  "egusi seed": 5,
  "palm oil": 4,
  vegetable: 2,
  beef: 7,
  yam: 3,
  bread: 3,
  egg: 0.5,
  tea: 1,
  stew: 2,
  okro: 2,
  fish: 5,
  garri: 2,
  banana: 0.5,
  apple: 0.8,
  orange: 0.7,
  watermelon: 4,
  grapes: 3,
};

type AppContextType = {
  familySize: string;
  setFamilySize: (v: string) => void;
  region: Region;
  setRegion: (v: Region) => void;
  showFruit: boolean;
  setShowFruit: (v: boolean) => void;
  showAppetizer: boolean;
  setShowAppetizer: (v: boolean) => void;
  city: string;
  state: string;
  countryCode: string;
  locationReady: boolean;
  detectUserLocation: () => Promise<void>;
  monthlyBudget: string;
  prices: PriceItem[];
  setPrices: React.Dispatch<React.SetStateAction<PriceItem[]>>;
  user: any;
  token: string | null;
  authReady: boolean;
  healthGoals: string[];
healthChallenges: string[];
dietaryPreferences: string[];
healthConditions: string[];
activityLevel: string;
waterHabit: string;
wantsMealTracking: boolean;
  signIn: (token: string, user: any) => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<any>>;
  signOut: () => Promise<void>;
  meals: any[];
  setMeals: React.Dispatch<React.SetStateAction<any[]>>;
  aiGroceries: Record<string, number>;
    aiGroceriesLoading: boolean;
    refreshAIGroceries: () => Promise<void>;
    loadMealPlan: () => Promise<void>;
saveMealPlan: () => Promise<void>;
mealPlanSaving: boolean;
planDays: string;
setPlanDays: (v: string) => void;
visibleMeals: any[];
startDay: string;
setStartDay: (v: string) => void;
isPro: boolean;
setIsPro: React.Dispatch<React.SetStateAction<boolean>>;
refreshProStatus: () => Promise<void>;
mealCheckIns: MealCheckIns;
setMealCheckIns: React.Dispatch<React.SetStateAction<MealCheckIns>>;
wellnessPlan: WellnessPlan;
setWellnessPlan: React.Dispatch<React.SetStateAction<WellnessPlan>>;
regenerateMealPlanByWellness: (
  plan: WellnessPlan
) => Promise<void>;
generateLocalMealPlan: (
  days?: number,
  culture?: MealCulture,
  wellness?: WellnessPlan
) => any[];
checkInMeal: (
  day: number,
  field: string,
  status: MealCheckInStatus,
  customMeal?: string) => void;
  waterGlasses: number;
setWaterGlasses: React.Dispatch<React.SetStateAction<number>>;
healthHistory: any[];
setHealthHistory: React.Dispatch<React.SetStateAction<any[]>>;
saveWaterTracking: (glasses: number) => Promise<void>;
saveHealthScore: (scoreData: any) => Promise<void>;
loadHealthData: () => Promise<void>;
boughtItems: Record<string, boolean>;
setBoughtItems: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
pantryItems: Record<string, boolean>;
planStartDate: string;
setPlanStartDate: React.Dispatch<React.SetStateAction<string>>;
setPantryItems: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
mealCulture: MealCulture;
setMealCulture: React.Dispatch<React.SetStateAction<MealCulture>>;
regenerateMealPlanByCulture: (culture: MealCulture) => Promise<void>;
};
type MealCheckInStatus = "" | "eaten" | "small" | "large" | "skipped";

type MealCheckIns = Record<
  string,
  {
    status: MealCheckInStatus;
    customMeal?: string;
  }
>;
const AppContext = createContext<AppContextType | null>(null);
const weeklyMeals = [
  {
    breakfast: "Pap + Akara",
    lunch: "Jollof Rice + Chicken",
    dinner: "Egusi + Pounded Yam",
    fruit: "Banana + Groundnut",
  },
  {
    breakfast: "Bread + Egg + Tea",
    lunch: "White Rice + Stew + Beef",
    dinner: "Okro + Eba",
    fruit: "Apple Slices",
  },
  {
    breakfast: "Oats + Milk",
    lunch: "Beans + Plantain",
    dinner: "Vegetable Soup + Semo",
    fruit: "Orange",
  },
  {
    breakfast: "Moi Moi + Pap",
    lunch: "Fried Rice + Chicken",
    dinner: "Ogbono + Eba",
    fruit: "Watermelon",
  },
  {
    breakfast: "Yam + Egg Sauce",
    lunch: "Amala + Ewedu",
    dinner: "Pepper Soup + Boiled Yam",
    fruit: "Grapes",
  },
  {
    breakfast: "Custard + Bread",
    lunch: "Jollof Spaghetti + Turkey",
    dinner: "Afang Soup + Fufu",
    fruit: "Greek Yogurt",
  },
  {
    breakfast: "Akara + Bread",
    lunch: "Coconut Rice + Fish",
    dinner: "Banga Soup + Starch",
    fruit: "Smoothie",
  },
  {
    breakfast: "Pancakes + Syrup",
    lunch: "Ofada Rice + Sauce",
    dinner: "Oha Soup + Fufu",
    fruit: "Pineapple",
  },
  {
    breakfast: "Beans Porridge",
    lunch: "Yam Porridge + Beef",
    dinner: "Edikang Ikong + Garri",
    fruit: "Mango",
  },
  {
    breakfast: "Tea + Toast",
    lunch: "Chicken Shawarma Bowl",
    dinner: "Fisherman Soup + Eba",
    fruit: "Pear",
  },
  {
    breakfast: "Cornflakes + Milk",
    lunch: "Ewa Agoyin + Plantain",
    dinner: "Bitterleaf Soup + Semo",
    fruit: "Avocado",
  },
  {
    breakfast: "Plantain + Egg",
    lunch: "Native Rice + Fish",
    dinner: "Nsala Soup + Pounded Yam",
    fruit: "Strawberries",
  },
  {
    breakfast: "Toast + Omelette",
    lunch: "Indomie + Chicken",
    dinner: "Seafood Okra + Eba",
    fruit: "Banana",
  },
  {
    breakfast: "Golden Morn + Milk",
    lunch: "Couscous + Chicken",
    dinner: "Achi Soup + Garri",
    fruit: "Apple Slices",
  },
  {
    breakfast: "Sweet Potato + Egg",
    lunch: "Macaroni + Beef",
    dinner: "Gbegiri + Ewedu + Amala",
    fruit: "Orange",
  },
  {
    breakfast: "Millet Porridge + Milk",
    lunch: "Plantain Porridge + Fish",
    dinner: "Groundnut Soup + Tuwo",
    fruit: "Watermelon",
  },
  {
    breakfast: "French Toast + Tea",
    lunch: "Vegetable Rice + Turkey",
    dinner: "Ora Soup + Semovita",
    fruit: "Grapes",
  },
  {
    breakfast: "Boiled Corn + Coconut",
    lunch: " Jollof Spaghetti + Chicken",
    dinner: "Atama Soup + Garri",
    fruit: "Greek Yogurt",
  },
  {
    breakfast: "Smoothie Bowl + Nuts",
    lunch: "Semo + Vegetable Stew",
    dinner: "Chicken Pepper Soup + Plantain",
    fruit: "Smoothie",
  },
  {
    breakfast: "Yam Balls + Pepper Sauce",
    lunch: "Coconut Pasta + Shrimp",
    dinner: "Miyan Kuka + Tuwo",
    fruit: "Pineapple",
  },
  {
    breakfast: "Sardine Sandwich + Tea",
    lunch: "Ewa Riro + Bread",
    dinner: "Draw Soup + Eba",
    fruit: "Mango",
  },
  {
    breakfast: "Rice Porridge + Milk",
    lunch: "Potato Porridge + Chicken",
    dinner: "Black Soup + Pounded Yam",
    fruit: "Pear",
  },
  {
    breakfast: "Egg Muffins + Tea",
    lunch: "Basmati Rice + Curry Chicken",
    dinner: "Uziza Soup + Fufu",
    fruit: "Avocado",
  },
  {
    breakfast: "Wheat Cereal + Banana",
    lunch: "Garri + Groundnut + Fish",
    dinner: "Okazi Soup + Semo",
    fruit: "Strawberries",
  },
  {
    breakfast: "Plantain Pancake + Yoghurt",
    lunch: "Nkwobi + Boiled Yam",
    dinner: "Tomato Fish Stew + Rice",
    fruit: "Banana + Groundnut",
  },
  {
    breakfast: "Avocado Toast + Egg",
    lunch: "Chicken Salad + Rice",
    dinner: "Ukazi Soup + Garri",
    fruit: "Apple Slices",
  },
  {
    breakfast: "Quaker Oats + Fruit",
    lunch: "Tuwo + Miyan Taushe",
    dinner: "Catfish Pepper Soup + Yam",
    fruit: "Orange",
  },
  {
    breakfast: "Masa + Honey",
    lunch: "Seafood Rice",
    dinner: "Efo Elegusi + Amala",
    fruit: "Watermelon",
  },
  {
    breakfast: "Boiled Egg + Sweet Potato",
    lunch: "Grilled Chicken + Salad + Rice",
    dinner: "Goat Meat Stew + Boiled Plantain",
    fruit: "Grapes",
  },
  {
    breakfast: "Fruit Salad + Yoghurt",
    lunch: "Turkey Stir Fry + Couscous",
    dinner: "Ewedu Soup + Gbegiri + Amala",
    fruit: "Greek Yogurt",
  },
];

const breakfastOptions = weeklyMeals.map((meal) => meal.breakfast);
const lunchOptions = weeklyMeals.map((meal) => meal.lunch);
const dinnerOptions = weeklyMeals.map((meal) => meal.dinner);
const fruitOptions = [
  "Banana + Groundnut",
  "Apple Slices",
  "Orange",
  "Watermelon",
  "Grapes",
  "Greek Yogurt",
  "Smoothie",
  "Pineapple",
  "Mango",
  "Pear",
  "Avocado",
  "Strawberries",
];

function randomItem<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickUniqueMeal(options: string[], used: string[]) {
  const available = options.filter((item) => !used.includes(item));

  if (available.length > 0) {
    return available[Math.floor(Math.random() * available.length)];
  }

  return options[Math.floor(Math.random() * options.length)];
}
type MealCulture = "general" | "yoruba" | "hausa" | "igbo";

type WellnessPlan =
  | "general"
  | "weight_loss"
  | "blood_pressure"
  | "diabetes"
  | "ulcer"
  | "heart_health";

const MEAL_CATEGORIES: Record<MealCulture, {
  breakfasts: string[];
  lunches: string[];
  dinners: string[];
  fruits: string[];
}> = {
  general: {
  breakfasts: weeklyMeals.map((m) => m.breakfast),
  lunches: weeklyMeals.map((m) => m.lunch),
  dinners: weeklyMeals.map((m) => m.dinner),
  fruits: weeklyMeals.map((m) => m.fruit),
},
 yoruba: {
  breakfasts: [
    "Pap + Akara",
    "Moi Moi + Pap",
    "Yam + Egg Sauce",
    "Akara + Bread",
    "Custard + Moi Moi",
    "Plantain + Egg",
    "Ogi + Akara",
    "Bread + Tea",
    "Cornflakes + Milk",
    "Beans Porridge",
    "Pap + Moi Moi",
    "Boiled Yam + Ata Dindin",
    "Akamu + Akara",
    "Toast + Omelette",
    "Sweet Potato + Egg",
    "Oats + Milk",
    "Moi Moi + Bread",
    "Tea + Agege Bread",
    "Pap + Groundnut",
    "Pancakes + Honey",
    "Custard + Akara",
    "Plantain Pancake",
    "Boiled Egg + Bread",
    "Golden Morn + Milk",
    "Yam Balls + Pepper Sauce",
    "Rice Porridge + Milk",
    "Fruit Salad + Yoghurt",
    "Avocado Toast + Egg",
    "Akara + Pap",
    "Moi Moi + Custard",
  ],

  lunches: [
    "Amala + Ewedu",
    "Ewa Agoyin + Plantain",
    "Ofada Rice + Ayamase",
    "Jollof Rice + Chicken",
    "Rice + Stew + Beef",
    "Yam Porridge + Fish",
    "Ofada Rice + Fish",
    "Beans + Plantain",
    "Fried Rice + Chicken",
    "White Rice + Gbegiri",
    "Ikokore",
    "Ewa Riro + Bread",
    "Asaro + Beef",
    "Ofada Rice + Ayamase + Egg",
    "Jollof Spaghetti + Chicken",
    "Rice + Beans + Stew",
    "Plantain Porridge + Fish",
    "Yam Fries + Egg Sauce",
    "Coconut Rice + Chicken",
    "Ewa Agoyin + Agege Bread",
    "Amala + Abula",
    "White Rice + Ayamase",
    "Beans Porridge + Yam",
    "Ofada Rice + Stew + Beef",
    "Fried Rice + Turkey",
    "Asaro + Fish",
    "Jollof Rice + Fish",
    "Ewa Riro + Plantain",
    "Rice + Stew + Turkey",
    "Yam Porridge + Chicken",
  ],

  dinners: [
    "Efo Riro + Eba",
    "Gbegiri + Amala",
    "Ila Alasepo + Eba",
    "Egusi + Amala",
    "Okro + Eba",
    "Vegetable Soup + Semo",
    "Ogbono + Eba",
    "Ewedu + Amala",
    "Efo Elegusi + Pounded Yam",
    "Pepper Soup + Boiled Yam",
    "Efo Riro + Semo",
    "Egusi + Eba",
    "Okro + Amala",
    "Gbegiri + Ewedu + Amala",
    "Ila Asepo + Garri",
    "Efo Riro + Poundo",
    "Ogbono + Amala",
    "Vegetable Soup + Eba",
    "Egusi Ijebu + Semo",
    "Okro + Pounded Yam",
    "Efo Riro + Wheat",
    "Gbegiri + Semo",
    "Ila Alasepo + Amala",
    "Egusi + Garri",
    "Okro + Semo",
    "Ewedu + Amala + Beef",
    "Vegetable Soup + Poundo",
    "Ogbono + Eba",
    "Efo Elegusi + Amala",
    "Pepper Soup + Plantain",
  ],

  fruits: [
    "Banana",
    "Orange",
    "Watermelon",
    "Pineapple",
    "Mango",
    "Apple",
    "Pear",
    "Avocado",
    "Strawberries",
    "Grapes",
  ],
},
hausa: {
  breakfasts: [
    "Koko + Kosai",
    "Fura da Nono",
    "Masa",
    "Danwake",
    "Tea + Bread",
    "Millet Porridge",
    "Beans Cake",
    "Boiled Egg + Bread",
    "Rice Porridge",
    "Sweet Potato + Egg",
    "Kunun Gyada + Bread",
    "Koko + Groundnut",
    "Fura da Nono + Dates",
    "Masa + Egg Sauce",
    "Tea + Toast",
    "Millet Pap + Akara",
    "Boiled Yam + Egg",
    "Cornflakes + Milk",
    "Rice Porridge + Milk",
    "Sweet Potato + Tea",
    "Koko + Kosai + Groundnut",
    "Masa + Honey + Tea",
    "Fura da Nono + Banana",
    "Beans Cake + Bread",
    "Millet Porridge + Milk",
    "Egg Sandwich + Tea",
    "Boiled Plantain + Egg",
    "Golden Morn + Milk",
    "Pap + Beans Cake",
    "Fruit Bowl + Yoghurt",
  ],

  lunches: [
    "Tuwo Shinkafa + Miyan Kuka",
    "Dan Wake",
    "Jollof Rice + Beef",
    "Rice + Stew + Chicken",
    "Beans + Plantain",
    "Fried Rice + Beef",
    "White Rice + Fish",
    "Yam Porridge",
    "Spaghetti + Beef stew",
    "Tuwo + Miyan Taushe",
    "Couscous + Chicken",
    "Rice + Beans + Stew",
    "Chicken Shawarma Bowl",
    "Jollof Spaghetti + Beef stew",
    "Dan Wake + Egg",
    "Native Rice + Beef",
    "Plantain Porridge + Chicken",
    "White Rice + Chicken Stew",
    "Beans Porridge + Fish",
    "Fried Rice + Chicken",
    "Tuwo + Miyan Karkashi",
    "Yam Porridge + Beef",
    "Coconut Rice + Chicken",
    " Jollof Spaghetti + Chicken",
    "Rice + Beef Sauce",
    "Dan Wake + Fish",
    "Jollof Rice + Turkey",
    "Couscous + Beef Sauce",
    "White Rice + Fish Stew",
    "Tuwo + Miyan Taushe + Beef",
  ],

  dinners: [
    "Tuwo Masara + Miyan Taushe",
    "Beans Porridge",
    "Kilishi + Salad",
    "Groundnut Soup + Tuwo",
    "Miyan Kuka + Tuwo",
    "Chicken Pepper Soup",
    "Okro Soup + Tuwo",
    "Fish Stew + Rice",
    "Vegetable Soup + Semo",
    "Pepper Soup + Yam",
    "Miyan Taushe + Tuwo",
    "Miyan Kuka + Masa",
    "Tuwo Shinkafa + Miyan Wake",
    "Groundnut Soup + Rice Balls",
    "Catfish Pepper Soup + Yam",
    "Okro + Tuwo Masara",
    "Miyan Kuka + Tuwo",
    "Miyan Taushe + Rice",
    "Beef Pepper Soup + Plantain",
    "Vegetable Soup + Tuwo",
    "Chicken Stew + Rice",
    "Miyan Wake + Tuwo",
    "Fish Pepper Soup + Yam",
    "Groundnut Soup + Tuwo",
    "Okro Soup + Rice",
    "Miyan Taushe + Tuwo Masara",
    "Pepper Soup + Rice",
    "Miyan Kuka + Tuwo Shinkafa",
    "Chicken Pepper Soup + Yam",
    "Vegetable Soup + Semo",
  ],

  fruits: [
    "Dates",
    "Banana",
    "Watermelon",
    "Orange",
    "Mango",
    "Pineapple",
    "Apple",
    "Pear",
    "Avocado",
    "Grapes",
  ],
},
  igbo: {
  breakfasts: [
    "Akamu + Akara",
    "Yam + Garden Egg Sauce",
    "Bread + Egg",
    "Moi Moi + Pap",
    "Cornflakes + Milk",
    "Boiled Yam + Egg",
    "Plantain + Egg",
    "Custard + Bread",
    "Oats + Milk",
    "Beans Porridge",
    "Akamu + Moi Moi",
    "Boiled Plantain + Egg Sauce",
    "Sweet Potato + Egg",
    "Tea + Bread + Egg",
    "Pap + Akara",
    "Rice Porridge + Milk",
    "Toast + Omelette",
    "Fruit Salad + Yoghurt",
    "Avocado Toast + Egg",
    "Yam Balls + Pepper Sauce",
    "Golden Morn + Milk",
    "Plantain Pancake + Tea",
    "Egg Muffins + Tea",
    "Wheat Cereal + Banana",
    "Boiled Corn + Coconut",
    "Quaker Oats + Fruit",
    "Sardine Sandwich + Tea",
    "Moi Moi + Custard",
    "Akara + Bread",
    "Smoothie Bowl + Nuts",
  ],

  lunches: [
    "Oha Soup + Fufu",
    "Abacha + Fish",
    "Ukwa",
    "Native Rice + Fish",
    "Jollof Rice + Chicken",
    "White Rice + Stew",
    "Yam Porridge + Fish",
    "Beans + Plantain",
    "Fried Rice + Chicken",
    "Coconut Rice + Fish",
    "Ofe Akwu + White Rice",
    "Abacha + Ugba + Fish",
    "Ukwa + Fish",
    "Native Rice + Chicken",
    "Yam Porridge + Beef",
    "Beans + Yam",
    "Coconut Rice + Chicken",
    "Jollof Spaghetti + Chicken",
    "White Rice + Ofe Akwu",
    "Fried Rice + Fish",
    "Abacha + Chicken",
    "Ukwa + Beef",
    "Native Rice + Turkey",
    "Beans Porridge + Fish",
    "Ofe Akwu + Rice + Beef",
    "Yam Porridge + Chicken",
    "Coconut Rice + Turkey",
    "Jollof Rice + Fish",
    "White Rice + Stew + Chicken",
    "Abacha + Fish + Ugba",
  ],

  dinners: [
    "Onugbu Soup + Garri",
    "Nsala Soup + Pounded Yam",
    "Afang Soup + Fufu",
    "Ofe Akwu + Rice",
    "Ora Soup + Fufu",
    "Ukazi Soup + Garri",
    "Egusi Soup + Pounded Yam",
    "Ogbono Soup + Garri",
    "Pepper Soup + Yam",
    "Seafood Okra + Eba",
    "Oha Soup + Garri",
    "Nsala Soup + Pounded Yam",
    "Onugbu Soup + Fufu",
    "Afang Soup + Garri",
    "Ofe Owerri + Pounded Yam",
    "Ora Soup + Semovita",
    "Ukazi Soup + Fufu",
    "Egusi Soup + Eba",
    "Ogbono Soup + Pounded Yam",
    "Pepper Soup + Plantain",
    "Oha Soup + Fufu",
    "Onugbu Soup + Garri",
    "Nsala Soup + Yam",
    "Afang Soup + Semo",
    "Ora Soup + Fufu",
    "Ukazi Soup + Garri",
    "Egusi Soup + Poundo",
    "Ogbono Soup + Eba",
    "Seafood Okra + Garri",
    "Pepper Soup + Boiled Yam",
  ],

  fruits: [
    "Orange",
    "Pineapple",
    "Mango",
    "Banana",
    "Apple",
    "Watermelon",
    "Pear",
    "Avocado",
    "Grapes",
    "Strawberries",
  ],
},
};
function generateMealPlan(days = 30, culture: MealCulture = "general", wellness: WellnessPlan = "general") {
 const safeCulture: MealCulture =
  culture && MEAL_CATEGORIES[culture] ? culture : "general";

 const selected = MEAL_CATEGORIES[safeCulture];
 let breakfasts = [...selected.breakfasts];
let lunches = [...selected.lunches];
let dinners = [...selected.dinners];
if (wellness === "diabetes") {
  breakfasts = breakfasts.filter((m) => {
    const x = m.toLowerCase();
    return (
      !x.includes("sugar") &&
      !x.includes("syrup") &&
      !x.includes("custard") &&
      !x.includes("cornflakes")
    );
  });

  lunches = lunches.filter((m) => {
    const x = m.toLowerCase();
    return !x.includes("sweet");
  });

  dinners = dinners.filter((m) => {
    const x = m.toLowerCase();
    return !x.includes("sweet");
  });
}

if (wellness === "ulcer") {
  lunches = lunches.filter((m) => {
    const x = m.toLowerCase();
    return (
      !x.includes("pepper") &&
      !x.includes("ayamase") &&
      !x.includes("spicy")
    );
  });

  dinners = dinners.filter((m) => {
    const x = m.toLowerCase();
    return (
      !x.includes("pepper") &&
      !x.includes("spicy") &&
      !x.includes("ayamase")
    );
  });
}

if (wellness === "blood_pressure") {
  breakfasts = breakfasts.filter((m) => {
    const x = m.toLowerCase();
    return !x.includes("kilishi");
  });

  lunches = lunches.filter((m) => {
    const x = m.toLowerCase();
    return (
      !x.includes("fried") &&
      !x.includes("kilishi") &&
      !x.includes("shawarma")
    );
  });

  dinners = dinners.filter((m) => {
    const x = m.toLowerCase();
    return (
      !x.includes("fried") &&
      !x.includes("kilishi") &&
      !x.includes("shawarma")
    );
  });
}

if (wellness === "weight_loss") {
  dinners = dinners.filter((m) => {
    const x = m.toLowerCase();
    return (
      !x.includes("pounded") &&
      !x.includes("eba") &&
      !x.includes("fufu") &&
      !x.includes("starch")
    );
  });
}

if (wellness === "heart_health") {
  lunches = lunches.filter((m) => {
    const x = m.toLowerCase();
    return (
      !x.includes("fried") &&
      !x.includes("beef") &&
      !x.includes("shawarma") &&
      !x.includes("kilishi")
    );
  });

  dinners = dinners.filter((m) => {
    const x = m.toLowerCase();
    return (
      !x.includes("fried") &&
      !x.includes("beef") &&
      !x.includes("kilishi")
    );
  });
}  const meals = [];

 const usedBreakfasts: string[] = [];
const usedLunches: string[] = [];
const usedDinners: string[] = [];
const recentFruits: string[] = [];

  for (let i = 0; i < days; i++) {
    const breakfast = pickUniqueMeal(
  breakfasts.length ? breakfasts : MEAL_CATEGORIES.general.breakfasts,
  usedBreakfasts
);

const lunch = pickUniqueMeal(
  lunches.length ? lunches : MEAL_CATEGORIES.general.lunches,
 usedLunches
);

const dinner = pickUniqueMeal(
  dinners.length ? dinners : MEAL_CATEGORIES.general.dinners,
 usedDinners
);

const fruit = pickUniqueMeal(
  selected.fruits.length ? selected.fruits : MEAL_CATEGORIES.general.fruits,
  recentFruits
);

    meals.push({
      day: i + 1,
      breakfast,
      lunch,
      dinner,
      fruit,
    });

    usedBreakfasts.push(breakfast);
    usedLunches.push(lunch);
     usedDinners.push(dinner);
    recentFruits.push(fruit);

  }

  return meals;
}
const initialMeals = generateMealPlan(30);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [familySize, setFamilySize] = useState("1");
  const [region, setRegion] = useState<Region>("us");
  const [showFruit, setShowFruit] = useState(true);
  const [showAppetizer, setShowAppetizer] = useState(false);
  const [mealCulture, setMealCulture] = useState<MealCulture>("general");
  const [meals, setMeals] = useState<any[]>(initialMeals);
  const [prices, setPrices] = useState<PriceItem[]>([]);
  const [city, setCity] = useState("");
  const [wellnessPlan, setWellnessPlan] = useState<WellnessPlan>("general");
  const [state, setState] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [locationReady, setLocationReady] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
 const [aiGroceries, setAiGroceries] = useState<Record<string, number>>({});
const [aiGroceriesLoading, setAiGroceriesLoading] = useState(false);
const [mealPlanSaving, setMealPlanSaving] = useState(false);
const [planDays, setPlanDays] = useState("30");
const [startDay, setStartDay] = useState("1");
const [isPro, setIsPro] = useState(false);
const [mealCheckIns, setMealCheckIns] = useState<MealCheckIns>({});
const [waterGlasses, setWaterGlasses] = useState(0);
const [healthGoals, setHealthGoals] = useState<string[]>([]);
const [healthChallenges, setHealthChallenges] = useState<string[]>([]);
const [dietaryPreferences, setDietaryPreferences] = useState<string[]>([]);
const [healthConditions, setHealthConditions] = useState<string[]>(["none"]);
const [activityLevel, setActivityLevel] = useState("light");
const [waterHabit, setWaterHabit] = useState("three_to_four");
const [wantsMealTracking, setWantsMealTracking] = useState(true);
const [healthHistory, setHealthHistory] = useState<any[]>([]);
const [publicGroceryPrices, setPublicGroceryPrices] = useState<any[]>([]);
const [boughtItems, setBoughtItems] = useState<Record<string, boolean>>({});
const [pantryItems, setPantryItems] = useState<Record<string, boolean>>({});
const [planStartDate, setPlanStartDate] = useState<string>(() => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
});
const refreshProStatus = async () => {
  try {
    await initPurchases();

    const pro = await checkIsPro();

    setIsPro(pro);
  } catch (err) {
    console.log(
      "Refresh Pro status failed:",
      err
    );

    setIsPro(false);
  }
};
useEffect(() => {
  refreshProStatus();
}, []);

useEffect(() => {
  refreshProStatus();

  const sub = AppState.addEventListener("change", (state) => {
    if (state === "active") {
      refreshProStatus();
    }
  });

  return () => sub.remove();
}, []);
const regenerateMealPlanByWellness = async (plan: WellnessPlan) => {
  setWellnessPlan(plan);

  const newMeals = generateMealPlan(
    Number(planDays || 30),
    mealCulture,
    plan
  );

  setMeals(newMeals);

  setTimeout(() => {
    saveMealPlan();
    refreshAIGroceries();
  }, 200);
};
const loadMealPlan = async () => {
  try {
    if (!user?.id || !token) return;

   const data = await apiFetch<{
  ok: boolean;
  meals: any[] | null;
  planStartDate?: string | null;
  error?: string;
}>("/api/meal-plan", {
  token,
});

    if (!data.ok) {
      throw new Error(data.error || "Failed to load meal plan");
    }
    if (data.planStartDate) {
  setPlanStartDate(data.planStartDate);
}
    if (data.meals === null) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  setPlanStartDate(d.toISOString());
  setMeals(initialMeals);
  return;
}

    if (Array.isArray(data.meals)) {
      const fullMeals = initialMeals.map((defaultMeal) => {
        const saved = data.meals?.find((m: any) => m.day === defaultMeal.day);
        return saved ? saved : defaultMeal;
      });

      setMeals(fullMeals);
    }
  } catch (err) {
    console.log("Load meal plan failed:", err);
    setMeals((prev) => (Array.isArray(prev) && prev.length ? prev : initialMeals));
  }
};

const checkInMeal = async (
  day: number,
  field: string,
  status: MealCheckInStatus,
  customMeal?: string
) => {
  const key = `${day}-${field}`;

  setMealCheckIns((prev) => ({
    ...prev,
    [key]: {
      status,
      customMeal,
    },
  }));

  try {
    if (!user?.id || !token) return;

    const meal = meals.find((m) => m.day === day);
    const mealName = meal?.[field] || "";

    await apiFetch("/api/health/checkin", {
  method: "POST",
  token,
  body: JSON.stringify({
    mealDay: day,
    mealType: field,
    mealName,
    status,
    customMeal,
  }),
});
 } catch (err) {
    console.log("Check-in save failed:", err);
  }
};
const loadHealthData = async () => {
  try {
    if (!user?.id || !token) return;

   const [checkinData, historyData, waterData] = await Promise.all([
  apiFetch<{
    ok: boolean;
    checkIns?: any;
  }>("/api/health/checkins", { token }),

  apiFetch<{
    ok: boolean;
    scores?: any[];
  }>("/api/health/scores", { token }),

  apiFetch<{
    ok: boolean;
    glasses?: number;
  }>("/api/health/water", { token }),
]);

    if (checkinData.ok) {
      setMealCheckIns(checkinData.checkIns || {});
    }

    if (historyData.ok) {
      setHealthHistory(Array.isArray(historyData.scores) ? historyData.scores : []);
    }

    if (waterData.ok) {
      setWaterGlasses(Number(waterData.glasses || 0));
    }
  } catch (err) {
    console.log("Health data load failed:", err);
  }
};

const saveWaterTracking = async (glasses: number) => {
  try {
    if (!user?.id) return;

    setWaterGlasses(glasses);

    await apiFetch("/api/health/water", {
  method: "POST",
  token,
  body: JSON.stringify({
    glasses,
  }),
});
  } catch (err) {
    console.log("Water save failed:", err);
  }
};

const saveHealthScore = async (scoreData: any) => {
  try {
   if (!user?.id || !token) return;

    await apiFetch("/api/health/score", {
  method: "POST",
  token,
  body: JSON.stringify({
    ...scoreData,
  }),
});
  } catch (err) {
    console.log("Health score save failed:", err);
  }
};

const saveMealPlan = async () => {
  try {
    if (!user?.id || !token) return;

    setMealPlanSaving(true);

   const data = await apiFetch<{
  ok: boolean;
  error?: string;
}>("/api/meal-plan", {
  method: "POST",
  token,
  body: JSON.stringify({
    meals,
    planStartDate,
  }),
});

    if (!data.ok) {
      throw new Error(data.error || "Failed to save meal plan");
    }
  } catch (err) {
    console.log("Save meal plan failed:", err);
  } finally {
    setMealPlanSaving(false);
  }
};

const fetchAIIngredients = async (meal: string) => {
  try {
    const data = await apiFetch<{
      ok: boolean;
      ingredients?: string[];
    }>("/api/ai/extract-ingredients", {
      method: "POST",
      body: JSON.stringify({ meal }),
      timeout: 25000,
    });

    if (data.ok) {
      return Array.isArray(data.ingredients) ? data.ingredients : [];
    }

    return [];
  } catch (err) {
    console.log("Fetch AI ingredients failed:", err);
    return [];
  }
};
const regenerateMealPlanByCulture = async (culture: MealCulture) => {
  setMealCulture(culture);

  const newMeals = generateMealPlan(
    Number(planDays || 30),
    culture,
    wellnessPlan
  );

  setMeals(newMeals);

  setTimeout(() => {
    saveMealPlan();
    refreshAIGroceries();
  }, 200);
};
const visibleMeals = useMemo(() => {
  const start = Math.max(1, Number(startDay) || 1);
  const days = Math.max(1, Number(planDays) || 30);

  return meals.slice(start - 1, start - 1 + days);
}, [meals, startDay, planDays]);
const localIngredientForDish = (dish: string) => {
  const name = String(dish || "").toLowerCase();

  if (name.includes("banana")) {
    return [{ item: "banana", quantity: 1, unit: "piece" }];
  }

  if (name.includes("apple")) {
    return [{ item: "apple", quantity: 1, unit: "piece" }];
  }

  if (name.includes("orange")) {
    return [{ item: "orange", quantity: 1, unit: "piece" }];
  }

  if (name.includes("watermelon")) {
    return [{ item: "watermelon", quantity: 0.25, unit: "piece" }];
  }

  if (name.includes("grapes")) {
    return [{ item: "grapes", quantity: 0.25, unit: "lb" }];
  }

  if (name.includes("smoothie")) {
    return [{ item: "smoothie ingredients", quantity: 1, unit: "serving" }];
  }

  if (name.includes("groundnut")) {
    return [{ item: "groundnut", quantity: 0.1, unit: "lb" }];
  }

  return null;
};

const defaultIngredientForDish = (dish: string) => {
  const name = String(dish || "").toLowerCase();

  const ingredients: any[] = [];

  const add = (item: string, quantity: number) => {
    const existing = ingredients.find((x) => x.item === item);

    if (existing) {
      existing.quantity += quantity;
    } else {
      ingredients.push({ item, quantity });
    }
  };

  // Common Nigerian / general meal ingredient rules
  if (name.includes("pap") || name.includes("ogi")) {
    add("cornmeal", 0.12);
    add("water", 0.3);
    add("sugar", 0.02);
  }

  if (name.includes("akara")) {
    add("black-eyed peas", 0.15);
    add("onion", 0.05);
    add("vegetable oil", 0.04);
  }

  if (name.includes("jollof")) {
    add("rice", 0.18);
    add("tomato", 0.08);
    add("pepper", 0.03);
    add("onion", 0.04);
    add("vegetable oil", 0.03);
  }

  if (name.includes("fried rice")) {
    add("rice", 0.18);
    add("mixed vegetables", 0.12);
    add("vegetable oil", 0.03);
  }

  if (name.includes("white rice") || name.includes("rice")) {
    add("rice", 0.18);
  }

  if (name.includes("chicken")) {
    add("chicken", 0.2);
  }

  if (name.includes("beef")) {
    add("beef", 0.15);
  }

  if (name.includes("fish")) {
    add("fish", 0.15);
  }

  if (name.includes("egg")) {
    add("egg", 1);
  }

  if (name.includes("bread") || name.includes("toast")) {
    add("bread", 2);
  }

  if (name.includes("tea")) {
    add("tea", 1);
  }

  if (name.includes("oatmeal") || name.includes("oats")) {
    add("oats", 0.12);
    add("milk", 0.2);
  }

  if (name.includes("honey")) {
    add("honey", 0.03);
  }

  if (name.includes("banana")) {
    add("banana", 1);
  }

  if (name.includes("apple")) {
    add("apple", 1);
  }

  if (name.includes("orange")) {
    add("orange", 1);
  }

  if (name.includes("grapes")) {
    add("grapes", 0.25);
  }

  if (name.includes("watermelon")) {
    add("watermelon", 0.25);
  }

  if (name.includes("yam")) {
    add("yam", 0.35);
  }

  if (name.includes("plantain")) {
    add("plantain", 0.3);
  }

  if (name.includes("beans")) {
    add("beans", 0.18);
  }

  if (name.includes("egusi")) {
    add("egusi seed", 0.08);
    add("palm oil", 0.03);
    add("vegetable", 0.08);
    add("beef", 0.12);
  }

  if (name.includes("okro") || name.includes("okra")) {
    add("okro", 0.1);
    add("palm oil", 0.03);
    add("fish", 0.12);
  }

  if (name.includes("eba")) {
    add("garri", 0.25);
  }

  if (name.includes("fufu")) {
    add("fufu flour", 0.25);
  }

  if (name.includes("pounded yam")) {
    add("yam", 0.35);
  }

  if (name.includes("pepper soup")) {
    add("pepper", 0.04);
    add("onion", 0.04);
    add("pepper soup spice", 0.02);
  }

  if (name.includes("vegetable soup") || name.includes("spinach")) {
    add("vegetable", 0.15);
    add("palm oil", 0.03);
    add("pepper", 0.03);
    add("onion", 0.04);
  }

  if (name.includes("stew")) {
    add("tomato", 0.1);
    add("pepper", 0.03);
    add("onion", 0.04);
    add("vegetable oil", 0.03);
  }

  if (name.includes("pasta") || name.includes("spaghetti")) {
    add("pasta", 0.18);
    add("tomato", 0.08);
    add("pepper", 0.03);
  }

  if (name.includes("smoothie")) {
    add("banana", 1);
    add("milk", 0.2);
    add("yogurt", 0.15);
  }

  if (name.includes("yogurt")) {
    add("yogurt", 0.2);
  }

  if (name.includes("granola")) {
    add("granola", 0.1);
  }

  // IMPORTANT:
  // Do NOT return the full meal name as grocery item.
  // If unknown, return simple generic ingredients instead.
  if (!ingredients.length) {
    add("rice", 0.18);
    add("onion", 0.04);
    add("pepper", 0.03);
  }

  return ingredients;
};
const refreshAIGroceries = async () => {
  try {
    setAiGroceriesLoading(true);

    const groceryMap: Record<string, number> = {};
    const size = Math.max(1, Number(familySize) || 1);

    const mealFields = ["breakfast", "lunch", "dinner"];

    if (showFruit) mealFields.push("fruit");
    if (showAppetizer) mealFields.push("appetizer");

    visibleMeals.forEach((meal) => {
      mealFields.forEach((field) => {
        const dish = meal[field];

        if (!dish) return;

        const ingredients = defaultIngredientForDish(dish);

        ingredients.forEach((ing: any) => {
          const key = String(ing.item || "").toLowerCase().trim();

          if (!key) return;

          groceryMap[key] =
            (groceryMap[key] || 0) + Number(ing.quantity || 0) * size;
        });
      });
    });

    setAiGroceries(groceryMap);
  } catch (err) {
    console.log(err);
  } finally {
    setAiGroceriesLoading(false);
  }
};
useEffect(() => {
  refreshAIGroceries();
},  [visibleMeals, familySize, showFruit, showAppetizer]);
  const detectUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        setLocationReady(true);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});

      const reverse = await Location.reverseGeocodeAsync({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });

      const place = reverse[0];

      if (place) {
        const detectedCity = place.city || place.subregion || "";
        const detectedState = place.region || "";
        const detectedCountryCode = place.isoCountryCode || "";

        setCity(detectedCity);
        setState(detectedState);
        setCountryCode(detectedCountryCode);

        if (detectedCountryCode === "US") setRegion("us");
        if (detectedCountryCode === "NG") setRegion("ng");
        if (detectedCountryCode === "CA") {setRegion("ca");}
        if (detectedCountryCode === "GB") setRegion("uk");
        if (detectedCountryCode === "AU") setRegion("au");
      }

      setLocationReady(true);
    } catch (err) {
      console.log("Location unavailable:", err);

setCity("");
setState("");
setCountryCode("");

setLocationReady(true);
    }
  };

useEffect(() => {
  setLocationReady(true);
}, []);

  useEffect(() => {
  async function loadAuth() {
    try {
      const savedToken = await SecureStore.getItemAsync("token");
      const savedUser = await SecureStore.getItemAsync("user");

      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      }
    } catch (err) {
      console.log("Auth restore failed:", err);
      await SecureStore.deleteItemAsync("token");
      await SecureStore.deleteItemAsync("user");
      setToken(null);
      setUser(null);
    } finally {
      setAuthReady(true);
    }
  }

  loadAuth();
}, []);
  useEffect(() => {
  async function loadPrices() {
    try {
      if (!city || !state) return;

      const location = `${city}-${state}`;

      const data = await apiFetch<{
        ok: boolean;
        prices?: any[];
      }>(
        `/api/prices?location=${encodeURIComponent(
          location
        )}&region=${encodeURIComponent(region || "ng")}`
      );

      if (data.ok) {
        setPrices(Array.isArray(data.prices) ? data.prices : []);
      }
    } catch (err) {
      console.log("Load prices failed:", err);

      // Prevent blank UI crash
      setPrices([]);
    }
  }

  loadPrices();
}, [region, city, state]);
const parseArrayField = (value: any, fallback: string[] = []) => {
  try {
    if (Array.isArray(value)) return value;
    if (typeof value === "string") return JSON.parse(value);
    return fallback;
  } catch {
    return fallback;
  }
};
const signIn = async (newToken: string, newUser: any) => {
  await SecureStore.setItemAsync("token", newToken);
  await SecureStore.setItemAsync("user", JSON.stringify(newUser));

  setToken(newToken);
  setUser(newUser);

  if (newUser?.family_size) {
    setFamilySize(String(newUser.family_size));
  }

  if (newUser?.region) {
    setRegion(newUser.region);
  }

  if (newUser?.city) {
    setCity(newUser.city);
  }

  if (newUser?.state) {
    setState(newUser.state);
  }

  if (newUser?.country_code) {
    setCountryCode(newUser.country_code);
  }

  if (newUser?.plan_days) {
    setPlanDays(String(newUser.plan_days));
  }

  // Important: free users stay General
  setMealCulture(newUser?.meal_culture || "general");
  setWellnessPlan(newUser?.wellness_goal || "general");
setHealthGoals(parseArrayField(newUser?.health_goals, []));
setHealthChallenges(parseArrayField(newUser?.health_challenges, []));
setDietaryPreferences(parseArrayField(newUser?.dietary_preferences, []));
setHealthConditions(parseArrayField(newUser?.health_conditions, ["none"]));

setActivityLevel(newUser?.activity_level || "light");
setWaterHabit(newUser?.water_habit || "three_to_four");
setWantsMealTracking(Number(newUser?.wants_meal_tracking ?? 1) === 1);
  await refreshProStatus();
};

  const signOut = async () => {
    await SecureStore.deleteItemAsync("token");
    await SecureStore.deleteItemAsync("user");

    setToken(null);
    setUser(null);
  };
  useEffect(() => {
  async function loadPublicGroceryPrices() {
    try {
      const itemNames = Object.keys(aiGroceries);

      if (!itemNames.length) {
        setPublicGroceryPrices([]);
        return;
      }

      const location = city && state ? `${city}-${state}` : "default";

      const data = await apiFetch<{
        ok: boolean;
        prices?: any[];
      }>(
        `/api/public/grocery-prices?region=${encodeURIComponent(
          region
        )}&location=${encodeURIComponent(
          location
        )}&items=${encodeURIComponent(itemNames.join(","))}`,
        { timeout: 20000 }
      );

      setPublicGroceryPrices(Array.isArray(data.prices) ? data.prices : []);
    } catch (err) {
      console.log("Load public grocery prices for budget failed:", err);
      setPublicGroceryPrices([]);
    }
  }

  loadPublicGroceryPrices();
}, [aiGroceries, region, city, state]);
const monthlyBudget = useMemo(() => {
  let total = 0;

  Object.entries(aiGroceries).forEach(([item, qty]) => {
    const groceryName = String(item || "").toLowerCase();

    const priceRow = publicGroceryPrices.find((p) => {
      const savedName = String(p.item || "").toLowerCase();

      return (
        savedName === groceryName ||
        savedName.includes(groceryName) ||
        groceryName.includes(savedName)
      );
    });
if (boughtItems[item] || pantryItems[item]) {
  return;
}
    const unitPrice = Number(priceRow?.price || 1);
    const estimatedQty = Math.max(1, Math.ceil(Number(qty) || 0));

    total += estimatedQty * unitPrice;
  });

  const currency =
    region === "ng"
      ? "NGN"
      : region === "ca"
      ? "CAD"
      : region === "uk"
      ? "GBP"
      : region === "au"
      ? "AUD"
      : "USD";

  const locale =
    region === "ng"
      ? "en-NG"
      : region === "ca"
      ? "en-CA"
      : region === "uk"
      ? "en-GB"
      : region === "au"
      ? "en-AU"
      : "en-US";

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: region === "ng" ? 0 : 2,
  }).format(total);
}, [aiGroceries, publicGroceryPrices, region, boughtItems, pantryItems]);
return (
    <AppContext.Provider
      value={{
        familySize,
        setFamilySize,
        region,
        setRegion,
        showFruit,
        setShowFruit,
        showAppetizer,
        setShowAppetizer,
        city,
        state,
        countryCode,
        locationReady,
        detectUserLocation,
        monthlyBudget,
        prices,
        setPrices,
        user,
        token,
        authReady,
        signIn,
        signOut,
        meals,
        setMeals,
        aiGroceries,
     aiGroceriesLoading,
     refreshAIGroceries,
     loadMealPlan,
saveMealPlan,
mealPlanSaving,
planDays,
setPlanDays,
visibleMeals,
planStartDate,
setPlanStartDate,
startDay,
setStartDay,
isPro,
refreshProStatus,
 setIsPro,
 mealCheckIns,
setMealCheckIns,
checkInMeal,
waterGlasses,
setWaterGlasses,
healthHistory,
setHealthHistory,
saveWaterTracking,
saveHealthScore,
loadHealthData,
boughtItems,
setBoughtItems,
pantryItems,
setPantryItems,
wellnessPlan,
setWellnessPlan,
regenerateMealPlanByWellness,
mealCulture,
setMealCulture,
healthGoals,
healthChallenges,
dietaryPreferences,
healthConditions,
activityLevel,
waterHabit,
wantsMealTracking,
regenerateMealPlanByCulture,
generateLocalMealPlan: generateMealPlan,
setUser,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error("useAppContext must be used inside AppProvider");
  }

  return context;
}