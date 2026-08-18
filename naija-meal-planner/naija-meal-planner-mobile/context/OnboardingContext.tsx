import React, { createContext, useContext, useState } from "react";

type Region = "us" | "ng" | "uk" | "ca" | "au";
type MealCulture = "general" | "yoruba" | "hausa" | "igbo";

type WellnessGoal =
  | "general"
  | "weight_loss"
  | "blood_pressure"
  | "diabetes"
  | "ulcer"
  | "heart_health";

type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very_active";

type WaterHabit =
  | "less_than_2"
  | "three_to_four"
  | "five_to_seven"
  | "eight_plus";

type OnboardingContextType = {
  familySize: string;
  setFamilySize: (v: string) => void;
  age: string;
  setAge: (v: string) => void;

  region: Region;
  setRegion: (v: Region) => void;

  state: string;
  setState: (v: string) => void;

  city: string;
  setCity: (v: string) => void;

  countryCode: string;
  setCountryCode: (v: string) => void;

  preferredMealCulture: MealCulture;
  setPreferredMealCulture: (v: MealCulture) => void;

  preferredWellnessGoal: WellnessGoal;
  setPreferredWellnessGoal: (v: WellnessGoal) => void;

  planDays: string;
  setPlanDays: (v: string) => void;

  healthGoals: string[];
  setHealthGoals: (v: string[]) => void;

  healthChallenges: string[];
  setHealthChallenges: (v: string[]) => void;

  dietaryPreferences: string[];
  setDietaryPreferences: (v: string[]) => void;

  healthConditions: string[];
  setHealthConditions: (v: string[]) => void;

  activityLevel: ActivityLevel;
  setActivityLevel: (v: ActivityLevel) => void;

  waterHabit: WaterHabit;
  setWaterHabit: (v: WaterHabit) => void;

  wantsMealTracking: boolean;
  setWantsMealTracking: (v: boolean) => void;
};

const OnboardingContext = createContext<OnboardingContextType | null>(null);

export function OnboardingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [familySize, setFamilySize] = useState("1");
  const [region, setRegion] = useState<Region>("us");
  const [state, setState] = useState("Louisiana");
  const [city, setCity] = useState("Ruston");
  const [countryCode, setCountryCode] = useState("US");
  const [age, setAge] = useState("30");

  const [preferredMealCulture, setPreferredMealCulture] =
    useState<MealCulture>("general");

  const [preferredWellnessGoal, setPreferredWellnessGoal] =
    useState<WellnessGoal>("general");

  const [planDays, setPlanDays] = useState("30");

  const [healthGoals, setHealthGoals] = useState<string[]>([]);
  const [healthChallenges, setHealthChallenges] = useState<string[]>([]);
  const [dietaryPreferences, setDietaryPreferences] = useState<string[]>([]);
  const [healthConditions, setHealthConditions] = useState<string[]>(["none"]);

  const [activityLevel, setActivityLevel] =
    useState<ActivityLevel>("light");

  const [waterHabit, setWaterHabit] =
    useState<WaterHabit>("three_to_four");

  const [wantsMealTracking, setWantsMealTracking] = useState(true);

  return (
    <OnboardingContext.Provider
      value={{
        familySize,
        setFamilySize,
        region,
        setRegion,
        state,
        setState,
        city,
        setCity,
        countryCode,
        age,
        setAge,
        setCountryCode,
        preferredMealCulture,
        setPreferredMealCulture,
        preferredWellnessGoal,
        setPreferredWellnessGoal,
        planDays,
        setPlanDays,
        healthGoals,
        setHealthGoals,
        healthChallenges,
        setHealthChallenges,
        dietaryPreferences,
        setDietaryPreferences,
        healthConditions,
        setHealthConditions,
        activityLevel,
        setActivityLevel,
        waterHabit,
        setWaterHabit,
        wantsMealTracking,
        setWantsMealTracking,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);

  if (!context) {
    throw new Error("useOnboarding must be used inside OnboardingProvider");
  }

  return context;
}