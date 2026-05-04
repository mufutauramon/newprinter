import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
} from "react";
import * as Location from "expo-location";
import * as SecureStore from "expo-secure-store";
import { checkIsPro } from "../lib/purchases";

type Region = "us" | "ng" | "ca";

type PriceItem = {
  item: string;
  price: number;
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
  signIn: (token: string, user: any) => Promise<void>;
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
};

const AppContext = createContext<AppContextType | null>(null);

const API_BASE = "http://10.0.2.2:8787";

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
    dinner: "Pepper Soup",
    fruit: "Grapes",
  },
  {
    breakfast: "Custard + Bread",
    lunch: "Jollof Spaghetti",
    dinner: "Egusi + Eba",
    fruit: "Greek Yogurt",
  },
  {
    breakfast: "Akara + Bread",
    lunch: "Rice + Beans",
    dinner: "Okro + Pounded Yam",
    fruit: "Smoothie",
  },
];

const initialMeals = Array.from({ length: 30 }, (_, index) => ({
  day: index + 1,
  ...weeklyMeals[index % weeklyMeals.length],
}));

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [familySize, setFamilySize] = useState("5");
  const [region, setRegion] = useState<Region>("us");
  const [showFruit, setShowFruit] = useState(true);
  const [showAppetizer, setShowAppetizer] = useState(false);
  const [meals, setMeals] = useState<any[]>(initialMeals);
  const [prices, setPrices] = useState<PriceItem[]>([]);
  const [city, setCity] = useState("");
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


const refreshProStatus = async () => {
  const pro = await checkIsPro();
  setIsPro(pro);
};

useEffect(() => {
  refreshProStatus();
}, []);

const loadMealPlan = async () => {
  try {
    if (!user?.id) return;

    const res = await fetch(`${API_BASE}/api/meal-plan/${user.id}`);
    const data = await res.json();

    if (data.ok && data.meals === null) {
      setMeals(initialMeals);
      return;
    }

    if (data.ok && Array.isArray(data.meals)) {
      const savedMeals = data.meals;

      const fullMeals = initialMeals.map((defaultMeal) => {
        const saved = savedMeals.find((m: any) => m.day === defaultMeal.day);
        return saved ? saved : defaultMeal;
      });

      setMeals(fullMeals);
    }
  } catch (err) {
    console.log(err);
  }
};
const saveMealPlan = async () => {
  try {
    if (!user?.id) return;

    setMealPlanSaving(true);

    const res = await fetch(`${API_BASE}/api/meal-plan`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: user.id,
        meals,
      }),
    });

    const data = await res.json();

    if (!data.ok) {
      throw new Error(data.error || "Failed to save meal plan");
    }
  } catch (err) {
    console.log(err);
  } finally {
    setMealPlanSaving(false);
  }
};
useEffect(() => {
  if (user?.id) {
    loadMealPlan();
  }
}, [user?.id]);

const fetchAIIngredients = async (meal: string) => {
  try {
    const res = await fetch(`${API_BASE}/api/ai/extract-ingredients`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ meal }),
    });

    const data = await res.json();

    if (data.ok) {
      return data.ingredients || [];
    }

    return [];
  } catch (err) {
    console.log(err);
    return [];
  }
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
const refreshAIGroceries = async () => {
  try {
    setAiGroceriesLoading(true);

    const groceryMap: Record<string, number> = {};
    const size = Number(familySize) || 1;

    const dishes: string[] = [];

    visibleMeals.forEach((meal) => {
      const mealFields = ["breakfast", "lunch", "dinner"];

      if (showFruit) mealFields.push("fruit");
      if (showAppetizer) mealFields.push("appetizer");

      mealFields.forEach((field) => {
        const dish = meal[field];

        if (dish && !dishes.includes(dish)) {
          dishes.push(dish);
        }
      });
    });

    for (const dish of dishes) {
      const ingredients =
  localIngredientForDish(dish) || (await fetchAIIngredients(dish));

      const repeatCount = visibleMeals.filter((meal) =>
        ["breakfast", "lunch", "dinner", "fruit", "appetizer"].some(
          (field) => meal[field] === dish
        )
      ).length;

      ingredients.forEach((ing: any) => {
        const key = String(ing.item || "").toLowerCase().trim();

        if (!key) return;

        groceryMap[key] =
          (groceryMap[key] || 0) +
          Number(ing.quantity || 0) * size * repeatCount;
      });
    }

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
      }

      setLocationReady(true);
    } catch (err) {
      console.log(err);
      setLocationReady(true);
    }
  };

  useEffect(() => {
    detectUserLocation();
  }, []);

  useEffect(() => {
    async function loadAuth() {
      const savedToken = await SecureStore.getItemAsync("token");
      const savedUser = await SecureStore.getItemAsync("user");

      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      }

      setAuthReady(true);
    }

    loadAuth();
  }, []);

  useEffect(() => {
    async function loadPrices() {
      try {
        if (!city || !state) return;

        const location = `${city}-${state}`;

        const res = await fetch(
          `${API_BASE}/api/prices?location=${encodeURIComponent(
            location
          )}&region=${region}`
        );

        const data = await res.json();

        if (data.ok) {
          setPrices(data.prices);
        }
      } catch (err) {
        console.log(err);
      }
    }

    loadPrices();
  }, [region, city, state]);

  const signIn = async (newToken: string, newUser: any) => {
    await SecureStore.setItemAsync("token", newToken);
    await SecureStore.setItemAsync("user", JSON.stringify(newUser));

    setToken(newToken);
    setUser(newUser);
  };

  const signOut = async () => {
    await SecureStore.deleteItemAsync("token");
    await SecureStore.deleteItemAsync("user");

    setToken(null);
    setUser(null);
  };

  const monthlyBudget = useMemo(() => {
  let total = 0;

  Object.entries(aiGroceries).forEach(([item, qty]) => {
    const priceRow = prices.find((p) => {
      const savedName = String(p.item || "").toLowerCase();
      const groceryName = String(item || "").toLowerCase();

      return savedName.includes(groceryName) || groceryName.includes(savedName);
    });

    if (priceRow) {
      total += Number(qty || 0) * Number(priceRow.price || 0);
    }
  });

  if (region === "ng") return `₦${Math.round(total).toLocaleString()}`;
  if (region === "ca") return `C$${total.toFixed(2)}`;
 return `$${total.toFixed(2)}`;
}, [prices, aiGroceries, region]);
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
startDay,
setStartDay,
isPro,
refreshProStatus,
 setIsPro,
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