import { router } from "expo-router";
import { useState } from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Pressable,
    Alert,
    Switch,
} from "react-native";
import { Text as SvgText } from "react-native-svg";
import Svg, {
  Polyline,
  Circle,
} from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { useMemo, useEffect } from "react";
import { useAppContext } from "../context/AppContext";
import { estimateMealNutrition } from "../utils/nutrition";
import {
  scheduleHealthReminders,
  cancelHealthReminders,
} from "../utils/healthNotifications";
const TEST_UNLOCK_HEALTH =false;

export default function HealthInsights() {
    const [healthReminders, setHealthReminders] = useState(false);
    const {
       user,
  visibleMeals,
  showFruit,
  showAppetizer,
  mealCheckIns,
  waterGlasses,
  saveWaterTracking,
  saveHealthScore,
  healthHistory,
  loadHealthData,
  isPro,
healthGoals,
healthChallenges,
dietaryPreferences,
healthConditions,
activityLevel,
waterHabit,
wantsMealTracking,
} = useAppContext();
console.log("Health Insights User:", user);
console.log("Health Insights Age:", user?.age);
const canOpenHealth = isPro || TEST_UNLOCK_HEALTH;
useEffect(() => {
     if (!canOpenHealth) {
    router.replace("/paywall");
  }
}, [canOpenHealth]);
const [activeTab, setActiveTab] = useState<
  "today" | "coach" | "progress" | "reports"
>("today");
if  (!canOpenHealth) {
  return null;
}
const labelMap: Record<string, string> = {
  lose_weight: "Weight Loss",
  maintain_weight: "Maintain Weight",
  gain_weight: "Gain Weight",
  build_muscle: "Build Muscle",
  eat_healthier: "Eat Healthier",
  improve_hydration: "Improve Hydration",
  reduce_sugar: "Reduce Sugar Intake",
  more_energy: "Improve Energy",
  meal_consistency: "Meal Consistency",
  family_health: "Family Health",

  high_protein: "High Protein",
  low_carb: "Low Carb",
  low_fat: "Low Fat",
  vegetarian: "Vegetarian",
  vegan: "Vegan",
  halal: "Halal",
  heart_healthy: "Heart Healthy",
  diabetic_friendly: "Diabetic Friendly",
  gluten_free: "Gluten Free",
  dairy_free: "Dairy Free",
  high_fiber: "High Fiber",

  diabetes: "Diabetes",
  high_blood_pressure: "High Blood Pressure",
  high_cholesterol: "High Cholesterol",
  kidney_disease: "Kidney Disease",
  food_allergies: "Food Allergies",
  pregnancy: "Pregnancy",
  none: "None",
};

const primaryGoal =
  healthGoals.length > 0
    ? labelMap[healthGoals[0]] || "Healthier Eating"
    : "Healthier Eating";
const insights = useMemo(() => {
  const mealFields = ["breakfast", "lunch", "dinner"];
  if (showFruit) mealFields.push("fruit");
  if (showAppetizer) mealFields.push("appetizer");

  const firstSevenDays = visibleMeals.slice(0, 7);

  const isCompletedStatus = (status?: string) =>
    status === "eaten" || status === "small" || status === "large";

  const daily = firstSevenDays.map((meal, index) => {
    let calories = 0;
    let protein = 0;
    let carbs = 0;
    let fat = 0;

    mealFields.forEach((field) => {
      const dish = meal[field];
      if (!dish) return;

      const checkIn = mealCheckIns?.[`${meal.day}-${field}`];

      if (!checkIn?.status) return;

      const estimate = estimateMealNutrition(checkIn.customMeal || dish);

      let multiplier = 0;

      if (checkIn.status === "eaten") multiplier = 1;
      if (checkIn.status === "small") multiplier = 0.7;
      if (checkIn.status === "large") multiplier = 1.3;
      if (checkIn.status === "skipped") multiplier = 0;

      calories += estimate.calories * multiplier;
      protein += estimate.protein * multiplier;
      carbs += estimate.carbs * multiplier;
      fat += estimate.fat * multiplier;
    });
    let recommendedFoods: string[] = [];
    let reduceFoods: string[] = [];
    if (proteinPercent < 20) {
  recommendedFoods.push(
    "Eggs",
    "Beans",
    "Fish",
    "Chicken"
  );
}
if (waterGlasses < 8) {
  recommendedFoods.push(
    "Water-rich fruits",
    "Cucumber",
    "Watermelon"
  );
}
if (healthGoals.includes("lose_weight")) {
  recommendedFoods.push(
    "Vegetables",
    "Salads",
    "Lean Chicken"
  );

  reduceFoods.push(
    "Fried foods",
    "Sugary drinks"
  );
}
    const date = new Date();
    date.setDate(date.getDate() + index);
    return {
      label: date.toLocaleDateString("en-US", { weekday: "short" }),
      calories: Math.round(calories),
      protein: Math.round(protein),
      carbs: Math.round(carbs),
      fat: Math.round(fat),
      recommendedFoods: [...new Set(recommendedFoods)],
     reduceFoods: [...new Set(reduceFoods)],
    };
  });

  const totalCalories = daily.reduce((sum, day) => sum + day.calories, 0);
  const totalProtein = daily.reduce((sum, day) => sum + day.protein, 0);
  const totalCarbs = daily.reduce((sum, day) => sum + day.carbs, 0);
  const totalFat = daily.reduce((sum, day) => sum + day.fat, 0);

  const trackedDays = daily.filter((d) => d.calories > 0).length;

  const avgCalories =
    trackedDays > 0 ? Math.round(totalCalories / trackedDays) : 0;

  const macroTotal = totalProtein + totalCarbs + totalFat || 1;

  const proteinPercent =
    totalCalories > 0 ? Math.round((totalProtein / macroTotal) * 100) : 0;

  const carbsPercent =
    totalCalories > 0 ? Math.round((totalCarbs / macroTotal) * 100) : 0;

  const fatPercent =
    totalCalories > 0 ? Math.round((totalFat / macroTotal) * 100) : 0;

  const totalMealSlots = firstSevenDays.length * 3;

  const completedMealSlots = firstSevenDays.reduce((count, meal) => {
    const fields = ["breakfast", "lunch", "dinner"];

    const completed = fields.filter((field) => {
      const checkIn = mealCheckIns?.[`${meal.day}-${field}`];
      return isCompletedStatus(checkIn?.status);
    }).length;

    return count + completed;
  }, 0);

  const mealCompletionPercent =
    totalMealSlots > 0
      ? Math.round((completedMealSlots / totalMealSlots) * 100)
      : 0;

  const healthyDays = firstSevenDays.filter((meal) => {
    const fields = ["breakfast", "lunch", "dinner"];

    return fields.some((field) => {
      const checkIn = mealCheckIns?.[`${meal.day}-${field}`];
      return isCompletedStatus(checkIn?.status);
    });
  }).length;
  const hydrationScore =
    waterGlasses >= 8
      ? 20
      : waterGlasses >= 6
      ? 15
      : waterGlasses >= 4
      ? 10
      : waterGlasses >= 2
      ? 5
      : 0;

  const mealConsistencyScore = Math.round((mealCompletionPercent / 100) * 35);

  const proteinScore =
    totalCalories === 0
      ? 0
      : proteinPercent >= 25
      ? 20
      : proteinPercent >= 18
      ? 15
      : proteinPercent >= 12
      ? 10
      : 5;

  const calorieScore =
    avgCalories === 0
      ? 0
      : avgCalories >= 1200 && avgCalories <= 2400
      ? 20
      : avgCalories >= 900
      ? 10
      : 5;

  const streakScore =
    healthyDays >= 7
      ? 15
      : healthyDays >= 5
      ? 10
      : healthyDays >= 3
      ? 5
      : 0;

  const finalHealthScore = Math.min(
    100,
    Math.max(
      0,
      Math.round(
        mealConsistencyScore +
          proteinScore +
          calorieScore +
          hydrationScore +
          streakScore
      )
    )
  );
const missionTasks = [
  waterGlasses >= 8,
  completedMealSlots >= 3,
  finalHealthScore >= 70,
  healthyDays > 0,
];

const completedMissionTasks =
  missionTasks.filter(Boolean).length;

const missionCompleted =
  completedMissionTasks === missionTasks.length;
  const healthLevel =
    finalHealthScore >= 90
      ? "Elite"
      : finalHealthScore >= 80
      ? "Excellent"
      : finalHealthScore >= 70
      ? "Healthy"
      : finalHealthScore >= 55
      ? "Improving"
      : "Starter";
    
    const healthGrade =
  finalHealthScore >= 90
    ? "A+"
    : finalHealthScore >= 80
    ? "A"
    : finalHealthScore >= 70
    ? "B"
    : finalHealthScore >= 60
    ? "C"
    : "D";

  const hydrationMessage =
    waterGlasses >= 8
      ? "Excellent hydration today 💧"
      : waterGlasses >= 5
      ? "Good hydration progress 💦"
      : "Drink more water today 🚰";

  const aiTip =
  waterGlasses >= 8
    ? "Excellent hydration today. Keep maintaining your healthy habits."
    : waterGlasses < 4
    ? "Your hydration is low today. Try drinking more water before your next meal."
    : carbsPercent > 60
    ? "Your carbs are high this week. Add more protein-rich meals like beans, fish, eggs, or chicken."
    : proteinPercent < 18 && totalCalories > 0
    ? "Your protein is low this week. Consider adding eggs, beans, fish, chicken, or Greek yogurt."
    : avgCalories === 0
    ? "Start checking in meals so your health insights can become more accurate."
    : avgCalories < 1200
    ? "Your estimated calories are low. Make sure you are not skipping too many meals."
    : avgCalories > 2400
    ? "Your estimated calories are high. Try lighter portions or more vegetables."
    : "Your meals look well balanced this week. Keep tracking consistently.";
  const streakMessage =
    healthyDays >= 7
      ? "Perfect weekly tracking"
      : healthyDays >= 5
      ? "Strong weekly progress"
      : healthyDays >= 3
      ? "Good start this week"
      : "Keep tracking daily";

  const weeklyGoalPercent = Math.min(
    100,
    Math.round(
      mealCompletionPercent * 0.5 +
        Math.min((waterGlasses / 8) * 100, 100) * 0.2 +
        finalHealthScore * 0.3
    )
  );

  const weeklyGoalMessage =
    weeklyGoalPercent >= 90
      ? "Outstanding weekly progress"
      : weeklyGoalPercent >= 75
      ? "Great consistency this week"
      : weeklyGoalPercent >= 60
      ? "You're improving steadily"
      : "Keep building healthy habits";
const scoreReasons = [
  {
    label: "Meal consistency",
    value: mealCompletionPercent,
    status:
      mealCompletionPercent >= 70
        ? "good"
        : mealCompletionPercent >= 40
        ? "fair"
        : "low",
  },
  {
    label: "Hydration",
    value: Math.min(100, Math.round((waterGlasses / 8) * 100)),
    status:
      waterGlasses >= 6
        ? "good"
        : waterGlasses >= 3
        ? "fair"
        : "low",
  },
  {
    label: "Protein balance",
    value: proteinPercent,
    status:
      proteinPercent >= 20
        ? "good"
        : proteinPercent >= 12
        ? "fair"
        : "low",
  },
];

const achievements: string[] = [
  waterGlasses >= 8 ? "Hydration Hero" : "",
  healthyDays >= 3 ? "Consistency Starter" : "",
  mealCompletionPercent >= 70 ? "Meal Tracker" : "",
  finalHealthScore >= 70 ? "Healthy Momentum" : "",
].filter((item) => item.length > 0);

const lockedAchievements: string[] = [
  waterGlasses < 8 ? "Hydration Hero" : "",
  healthyDays < 7 ? "7 Day Streak" : "",
  finalHealthScore < 90 ? "Score 90+" : "",
  proteinPercent < 25 ? "Protein Master" : "",
].filter((item) => item.length > 0);

const achievementBadges = [
  {
    title: "Hydration Hero",
    subtitle: "Drink 8 glasses in a day",
    icon: "💧",
    unlocked: waterGlasses >= 8,
  },
  {
    title: "Consistency Starter",
    subtitle: "Track meals for 3 active days",
    icon: "🔥",
    unlocked: healthyDays >= 3,
  },
  {
    title: "Healthy Momentum",
    subtitle: "Reach a 70+ health score",
    icon: "🏅",
    unlocked: finalHealthScore >= 70,
  },
  {
    title: "Protein Builder",
    subtitle: "Reach 25% protein balance",
    icon: "💪",
    unlocked: proteinPercent >= 25,
  },
  {
    title: "Elite Week",
    subtitle: "Reach 90+ health score",
    icon: "👑",
    unlocked: finalHealthScore >= 90,
  },
];

const focusAreas = [
  healthGoals.includes("lose_weight") ? "Portion control" : "",
  healthGoals.includes("build_muscle") ? "Protein intake" : "",
  healthGoals.includes("improve_hydration") ? "Hydration routine" : "",
  healthGoals.includes("reduce_sugar") ? "Lower sugar choices" : "",
  healthConditions.includes("diabetes") ? "Blood sugar friendly meals" : "",
  healthConditions.includes("high_blood_pressure") ? "Heart healthy meals" : "",
  dietaryPreferences.includes("high_protein") ? "High protein meals" : "",
  mealCompletionPercent < 70 ? "Meal consistency" : "",
  waterGlasses < 8 ? "Water intake" : "",
].filter((item) => item.length > 0);
const coachActions = [
  waterGlasses < 5
    ? "Drink 2 more glasses of water today."
    : "Keep your hydration routine going.",
  mealCompletionPercent < 50
    ? "Check in at least one more meal today."
    : "Your meal tracking is improving.",
  proteinPercent < 18 && totalCalories > 0
    ? "Add protein like beans, eggs, fish, chicken, or Greek yogurt."
    : "Your protein balance looks okay.",
];
const waterXP = waterGlasses >= 8 ? 10 : 0;

const mealXP =
  completedMealSlots >= 3 ? 5 :
  completedMealSlots >= 1 ? 2 : 0;

const scoreXP =
  finalHealthScore >= 80 ? 10 :
  finalHealthScore >= 70 ? 5 : 0;

const streakXP =
  healthyDays >= 7 ? 5 :
  healthyDays >= 3 ? 2 : 0;

const todayXP =
  waterXP +
  mealXP +
  scoreXP +
  streakXP;
const hasGoal = (goal: string) => healthGoals.includes(goal);
const hasCondition = (condition: string) => healthConditions.includes(condition);
const hasDiet = (diet: string) => dietaryPreferences.includes(diet);

const personalizedCoachIntro = hasGoal("lose_weight")
  ? "Your plan is focused on lighter portions, better hydration, and consistent meal tracking."
  : hasGoal("build_muscle")
  ? "Your plan is focused on protein balance, meal consistency, and enough calories for strength."
  : hasGoal("improve_hydration")
  ? "Your plan is focused on building a stronger hydration routine."
  : hasCondition("diabetes")
  ? "Your plan should focus on steady meals, fiber-rich foods, and reduced sugary drinks."
  : hasCondition("high_blood_pressure")
  ? "Your plan should focus on hydration, less salty foods, and more vegetables."
  : hasDiet("high_protein")
  ? "Your plan is focused on getting enough protein across the week."
  : "Your plan is focused on consistent meals, hydration, and balanced nutrition.";
const todayTasks = [
  {
    label: "Drink 8 glasses of water",
    done: waterGlasses >= 8,
  },
  {
    label: "Check in at least 3 meals",
    done: completedMealSlots >= 3,
  },
  {
    label: "Reach 70 health score",
    done: finalHealthScore >= 70,
  },
  {
    label: "Keep your streak alive",
    done: healthyDays >= 1,
  },
];

const goalProgress = Math.min(
  100,
  Math.round(
    finalHealthScore * 0.45 +
      mealCompletionPercent * 0.35 +
      Math.min((waterGlasses / 8) * 100, 100) * 0.2
  )
);
const nutritionGrade =
  finalHealthScore >= 90
    ? "A+"
    : finalHealthScore >= 80
    ? "A"
    : finalHealthScore >= 70
    ? "B+"
    : finalHealthScore >= 60
    ? "B"
    : finalHealthScore >= 50
    ? "C"
    : "D";

const totalXP = Math.round(
  completedMealSlots * 10 +
    waterGlasses * 5 +
    healthyDays * 20 +
    finalHealthScore
);

const xpPerLevel = 250;

const healthLevelNumber = Math.floor(totalXP / xpPerLevel) + 1;

const healthXP = totalXP % xpPerLevel;

const nextLevelXP = xpPerLevel;

const levelTitle =
  healthLevelNumber >= 5
    ? "Elite Health Hero"
    : healthLevelNumber === 4
    ? "Wellness Champion"
    : healthLevelNumber === 3
    ? "Nutrition Master"
    : healthLevelNumber === 2
    ? "Healthy Eater"
    : "Beginner";
const nextMilestone =
  finalHealthScore >= 80
    ? "Maintain 80+ score for 5 days."
    : waterGlasses < 8
    ? "Reach 8 glasses of water today."
    : mealCompletionPercent < 70
    ? "Check in more meals this week."
    : "Reach 80 health score.";

const missionReward =
  todayTasks.filter((task) => task.done).length * 5;
  const sortedHistory = [...healthHistory]
  .filter((item: any) => {
    const score = Number(item?.score || 0);
    return item?.score_date && score > 0;
  })
  .sort(
    (a: any, b: any) =>
      new Date(a.score_date).getTime() - new Date(b.score_date).getTime()
  );

const recentTrend = sortedHistory.slice(-7);

const lastTrendScore =
  recentTrend.length > 0
    ? Number(recentTrend[recentTrend.length - 1].score || 0)
    : finalHealthScore;

const previousTrendScore =
  recentTrend.length > 1
    ? Number(recentTrend[recentTrend.length - 2].score || 0)
    : lastTrendScore;

const weeklyTrendChange =
  lastTrendScore - previousTrendScore;
const weeklyTrendMessage =
  weeklyTrendChange > 0
    ? `You improved by ${weeklyTrendChange} points recently.`
    : weeklyTrendChange < 0
    ? `Your score dropped by ${Math.abs(weeklyTrendChange)} points recently.`
    : "Your score is stable. Keep tracking daily.";

const trendBars =
  recentTrend.length > 0
    ? recentTrend.map((item: any) => ({
        label: String(item.score_date || "").slice(5),
        score: Number(item.score || 0),
      }))
    : [
        {
          label: "Today",
          score: finalHealthScore,
        },
      ];
const trendChange = weeklyTrendChange;

const bestRecord =
  sortedHistory.length > 0
    ? sortedHistory.reduce((best: any, current: any) =>
        Number(current.score || 0) > Number(best.score || 0)
          ? current
          : best
      )
    : {
        score_date: new Date().toISOString().slice(0, 10),
        score: finalHealthScore,
      };
const actualAge = Number(user?.age || 30);

let wellnessAgeAdjustment = 0;

if (finalHealthScore >= 90) wellnessAgeAdjustment -= 5;
else if (finalHealthScore >= 80) wellnessAgeAdjustment -= 3;
else if (finalHealthScore >= 70) wellnessAgeAdjustment -= 1;
else if (finalHealthScore < 55) wellnessAgeAdjustment += 3;

if (waterGlasses >= 8) wellnessAgeAdjustment -= 1;
if (mealCompletionPercent >= 70) wellnessAgeAdjustment -= 1;
if (proteinPercent >= 25) wellnessAgeAdjustment -= 1;

if (waterGlasses < 3) wellnessAgeAdjustment += 1;
if (mealCompletionPercent < 40) wellnessAgeAdjustment += 1;
if (proteinPercent < 12 && insights?.avgCalories > 0) wellnessAgeAdjustment += 1;

const wellnessAge = Math.max(18, actualAge + wellnessAgeAdjustment);

const wellnessMessage =
  wellnessAge < actualAge
    ? `You are performing like someone ${actualAge - wellnessAge} years younger.`
    : wellnessAge > actualAge
    ? `Focus on hydration, meal consistency, and protein balance to improve your wellness age.`
    : "Your wellness age matches your actual age.";  
    
    return {
    daily,
    avgCalories,
    maxCalories: Math.max(...daily.map((d) => d.calories), 1),
    proteinPercent,
    carbsPercent,
    fatPercent,
    aiTip,
    healthScore: finalHealthScore,
    healthLevel,
    hydrationScore,
    hydrationMessage,
    healthyDays,
    streakMessage,
    mealCompletionPercent,
    completedMealSlots,
    totalMealSlots,
    weeklyGoalPercent,
    weeklyGoalMessage,
    waterGlasses,
    scoreReasons,
    todayTasks,
    goalProgress,
    achievements,
    lockedAchievements,
    coachActions,
    primaryGoal,
    personalizedCoachIntro,
    nutritionGrade,
    healthXP,
    healthLevelNumber,
    nextMilestone,
    missionReward,
    weeklyTrendChange,
    weeklyTrendMessage,
    trendBars,
    wellnessAge,
    actualAge,
    wellnessMessage,
    focusAreas,
    missionCompleted,
   completedMissionTasks,
   nextLevelXP,
   healthGrade,
   achievementBadges,
   trendChange,
    bestRecord,
    levelTitle,
    waterXP,
    mealXP,
    scoreXP,
    streakXP,
    todayXP,
  };
}, [visibleMeals, showFruit, showAppetizer, mealCheckIns, waterGlasses,healthGoals,
healthConditions,dietaryPreferences, healthHistory,]);
const hydrationColor =
  waterGlasses >= 8
    ? "#16a34a"
    : waterGlasses >= 5
    ? "#0284c7"
    : waterGlasses >= 3
    ? "#f59e0b"
    : "#dc2626";
  const toggleHealthReminders = async (value: boolean) => {
  try {
     if (!canOpenHealth) {
      router.push("/paywall");
      return;
    }

    setHealthReminders(value);

    if (value) {
      await scheduleHealthReminders();
      Alert.alert(
        "Health reminders enabled",
        "You will receive water, meal check-in, and weekly wellness reminders."
      );
    } else {
      await cancelHealthReminders();
      Alert.alert("Health reminders disabled");
    }
  } catch (err: any) {
    setHealthReminders(false);
    Alert.alert(
      "Notifications",
      err?.message || "Could not update health reminders."
    );
  }
};
const consistencyScore = Math.round(
  insights.mealCompletionPercent * 0.45 +
  Math.min(100, (waterGlasses / 8) * 100) * 0.35 +
  Math.min(100, (insights.healthyDays / 7) * 100) * 0.2
);
useEffect(() => {
  const saveAndReload = async () => {
    await saveHealthScore({
      score: insights.healthScore,
      calories: insights.avgCalories,
      protein: insights.proteinPercent,
      carbs: insights.carbsPercent,
      fat: insights.fatPercent,
      scoreDate: new Date().toISOString().slice(0, 10),
    });

    await loadHealthData();
  };

  saveAndReload();
}, [insights.healthScore]);  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* BACK */}
      <Pressable style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={24} color="#0f172a" />
        <Text style={styles.backText}>More</Text>
      </Pressable>

      {/* HEADER */}
      <Text style={styles.title}>Weekly Stats</Text>

      {/* HERO */}
      <View style={styles.hero}>
        <View style={{ flex: 1 }}>
          <Text style={styles.heroTitle}>You’re on track!</Text>

          <Text style={styles.heroSub}>
  {insights.hydrationMessage}
</Text>

        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeEmoji}>🏅</Text>
        </View>
      </View>
      
<View style={styles.scoreCard}>
  <View>
    <Text style={styles.scoreLabel}>Daily Health Score</Text>
    <Text style={styles.scoreValue}>{insights.healthScore}/100</Text>
    <View style={styles.levelPill}>
  <Text style={styles.levelPillText}>
    {insights.healthLevel}
  </Text>
</View>
<Text style={styles.gradeText}>
  Grade {insights.healthGrade}
</Text>
<Text style={styles.scoreSubText}>
  {insights.healthyDays}-day consistency streak 🔥
</Text>
  </View>
  <View style={styles.scoreBadge}>
    <Text style={styles.scoreEmoji}>
      {insights.healthScore >= 85 ? "🔥" : insights.healthScore >= 70 ? "✅" : "⚠️"}
    </Text>
  </View>
</View>
<View style={styles.streakCard}>
  <View>
    <Text style={styles.streakTitle}>
      Healthy Streak
    </Text>

    <Text style={styles.streakValue}>
      {insights.healthyDays} Days
    </Text>

    <Text style={styles.streakSub}>
      Keep your momentum going
    </Text>
  </View>

  <Text style={styles.streakEmoji}>🔥</Text>
</View><View style={styles.nextGoalCard}>
  <Text style={styles.nextGoalTitle}>Next Goal</Text>
  <Text style={styles.nextGoalText}>
    {insights.healthScore >= 90
      ? "Maintain your Elite score for 3 more days."
      : insights.healthScore >= 80
      ? "Reach 90+ to unlock Elite status."
      : insights.healthScore >= 70
      ? "Reach 80+ to move into Excellent."
      : "Track meals and water today to improve your score."}
  </Text>
</View>

<View style={styles.tabs}>
  {[
    { key: "today", label: "Today" },
    { key: "coach", label: "Coach" },
    { key: "progress", label: "Progress" },
    { key: "reports", label: "Reports" },
  ].map((tab) => {
    const active = activeTab === tab.key;
   

    return (
      <Pressable
        key={tab.key}
        style={[styles.tabBtn, active && styles.tabBtnActive]}
        onPress={() => setActiveTab(tab.key as any)}
      >
        <Text style={[styles.tabText, active && styles.tabTextActive]}>
          {tab.label}
        </Text>
      </Pressable>
    );
  })}
</View>

{activeTab === "today" && (
  <>
    <View style={styles.waterCardCompact}>
      <View>
        <Text style={styles.waterTitle}>Water Intake</Text>
        <Text style={[styles.waterSub, { color: hydrationColor }]}>
          {waterGlasses}/8 glasses today
        </Text>
      </View>

      <View style={styles.compactWaterRow}>
        <Pressable
          style={[styles.smallWaterBtn, { backgroundColor: hydrationColor }]}
          onPress={() => saveWaterTracking(Math.max(0, waterGlasses - 1))}
        >
          <Text style={styles.smallWaterBtnText}>−</Text>
        </Pressable>

        <View style={styles.compactWaterCenter}>
          <Text style={styles.waterIcon}>💧</Text>
          <Text style={styles.waterCount}>{waterGlasses} / 8</Text>
        </View>

        <Pressable
          style={styles.smallWaterBtn}
          onPress={() => saveWaterTracking(Math.min(12, waterGlasses + 1))}
        >
          <Text style={styles.smallWaterBtnText}>+</Text>
        </Pressable>
      </View>

      <View style={styles.waterDots}>
        {Array.from({ length: 8 }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.waterDot,
              index < waterGlasses && styles.waterDotActive,
              { backgroundColor: index < waterGlasses ? hydrationColor : "rgba(2,132,199,0.18)" },
            ]}
          />
        ))}
      </View>
    </View>
          <View style={styles.journeyCard}>
  <View style={styles.journeyHeader}>
    <View>
      <Text style={styles.journeyLabel}>Your Health Journey</Text>
      <Text style={styles.journeyTitle}>{insights.primaryGoal}</Text>
    </View>

    <View style={styles.gradeBadge}>
      <Text style={styles.gradeText}>{insights.nutritionGrade}</Text>
    </View>
  </View>

  <Text style={styles.journeySub}>
    Progress: {insights.goalProgress}%
  </Text>

  <View style={styles.goalBarBg}>
    <View
      style={[
        styles.goalBarFill,
        { width: `${insights.goalProgress}%` },
      ]}
    />
  </View>

  <Text style={styles.journeyMilestone}>
    Next milestone: {insights.nextMilestone}
  </Text>
</View>

    <View style={styles.card}>
      <View style={styles.missionHeader}>
  <Text style={styles.cardTitle}>Today's Mission</Text>
  <Text style={styles.xpText}>+{insights.missionReward} XP</Text>
</View>

      {insights.todayTasks.map((task: any, index: number) => (
        <View key={index} style={styles.taskRow}>
          <Text style={[styles.taskIcon, task.done && styles.taskIconDone]}>
            {task.done ? "✓" : "○"}
          </Text>
          <Text style={[styles.taskText, task.done && styles.taskTextDone]}>
            {task.label}
          </Text>
        </View>
      ))}
    </View>
    {insights.missionCompleted && (
  <View style={styles.missionSuccessCard}>
    <Text style={styles.missionSuccessEmoji}>
      🎉
    </Text>

    <Text style={styles.missionSuccessTitle}>
      Mission Completed
    </Text>

    <Text style={styles.missionSuccessText}>
      You earned +20 XP today.
      Come back tomorrow to continue your streak.
    </Text>
  </View>
)}
    <View style={styles.xpCard}>
  <View>
    <Text style={styles.xpTitle}>
      Level {insights.healthLevelNumber} {insights.levelTitle}
    </Text>
    <Text style={styles.xpSub}>
      XP: {insights.healthXP} / {insights.nextLevelXP}
    </Text>
    <Text style={styles.nextLevelText}>
 {insights.nextLevelXP - insights.healthXP} XP until Level {insights.healthLevelNumber + 1}
</Text>
<Text style={styles.nextLevelName}>
  Next:{" "}
  {insights.healthLevelNumber + 1 >= 5
    ? "Elite Health Hero"
    : insights.healthLevelNumber + 1 === 4
    ? "Wellness Champion"
    : insights.healthLevelNumber + 1 === 3
    ? "Nutrition Master"
    : insights.healthLevelNumber + 1 === 2
    ? "Healthy Eater"
    : "Beginner"}
</Text>
  </View>
  <View style={styles.xpBarBg}>
    <View
      style={[
        styles.xpBarFill,
        { width: `${Math.min(100, (insights.healthXP / insights.nextLevelXP) * 100)}%` },
      ]}
    />
  </View>
</View>
<View style={styles.card}>
  <Text style={styles.cardTitle}>Today’s XP Breakdown</Text>
 <Text style={styles.cardSub}>
  Daily XP earned from today’s actions
</Text>
  <View style={styles.xpRow}>
    <Text style={styles.xpLabel}>Water goal</Text>
    <Text style={styles.xpValue}>
      +{insights.waterXP} XP
    </Text>
  </View>

  <View style={styles.xpRow}>
    <Text style={styles.xpLabel}>Meal check-ins</Text>
    <Text style={styles.xpValue}>
      +{insights.mealXP} XP
    </Text>
  </View>

  <View style={styles.xpRow}>
    <Text style={styles.xpLabel}>Health score goal</Text>
    <Text style={styles.xpValue}>
      +{insights.scoreXP} XP
    </Text>
  </View>

  <View style={styles.xpRow}>
    <Text style={styles.xpLabel}>Streak maintained</Text>
    <Text style={styles.xpValue}>
      +{insights.streakXP} XP
    </Text>
  </View>
  <View style={styles.xpRow}>
    <Text style={styles.xpLabel}>Earned today:</Text>
    <Text style={styles.xpValue}>
      {insights.todayXP} XP
    </Text>
  </View>
</View>
    <View style={styles.todayCoachCard}>
      <View style={styles.aiCoachIcon}>
        <Text style={styles.aiCoachEmoji}>🌿</Text>
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.aiCoachTitle}>Today's Coach Tip</Text>
        <Text style={styles.aiCoachText}>
  {insights.personalizedCoachIntro}
</Text>

<Text style={[styles.aiCoachText, { marginTop: 10 }]}>
  {insights.aiTip}
</Text>
      </View>
    </View>
  </>
)}

{activeTab === "coach" && (
  <>
    <View style={styles.aiCoachCard}>
      <View style={styles.aiCoachIcon}>
        <Text style={styles.aiCoachEmoji}>🧠</Text>
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.aiCoachTitle}>Your Health Coach</Text>
        <Text style={styles.aiCoachText}>{insights.aiTip}</Text>
      </View>
    </View>

    <View style={styles.card}>
      <Text style={styles.cardTitle}>Recommended Actions</Text>

      {insights.coachActions.map((item: string, index: number) => (
        <View key={index} style={styles.actionRow}>
          <Text style={styles.actionIcon}>✓</Text>
          <Text style={styles.actionText}>{item}</Text>
        </View>
      ))}
    </View>

    <View style={styles.card}>
      <Text style={styles.cardTitle}>Recommended Foods</Text>

      {["Beans", "Eggs", "Fish", "Chicken", "Vegetables"].map((item) => (
        <View key={item} style={styles.foodRow}>
          <Text style={styles.foodEmoji}>🥗</Text>
          <Text style={styles.foodText}>{item}</Text>
        </View>
      ))}
    </View>

    <View style={styles.card}>
      <Text style={styles.cardTitle}>Foods To Reduce</Text>

      {["Sugary drinks", "Excess fried foods", "Too much late-night snacking"].map((item) => (
        <View key={item} style={styles.foodRow}>
          <Text style={styles.foodEmoji}>⚠️</Text>
          <Text style={styles.foodText}>{item}</Text>
        </View>
      ))}
    </View>
    <View style={styles.card}>
  <Text style={styles.cardTitle}>Your Focus Areas</Text>

  {insights.focusAreas.length === 0 ? (
    <Text style={styles.historyEmpty}>
      Your habits look balanced. Keep tracking to get more personalized focus areas.
    </Text>
  ) : (
    <View style={styles.focusGrid}>
      {insights.focusAreas.slice(0, 6).map((item: string) => (
        <View key={item} style={styles.focusPill}>
          <Text style={styles.focusText}>{item}</Text>
        </View>
      ))}
    </View>
  )}
</View>
  </>
)}

{activeTab === "progress" && (
  <>
  <View style={styles.card}>
  <Text style={styles.cardTitle}>Weekly Progress Summary</Text>

  <View style={styles.progressSummaryGrid}>
    <View style={styles.progressSummaryBox}>
      <Text style={styles.progressSummaryValue}>
        {insights.mealCompletionPercent}%
      </Text>
      <Text style={styles.progressSummaryLabel}>Meals</Text>
    </View>

    <View style={styles.progressSummaryBox}>
      <Text style={styles.progressSummaryValue}>
        {Math.min(100, Math.round((waterGlasses / 8) * 100))}%
      </Text>
      <Text style={styles.progressSummaryLabel}>Water</Text>
    </View>

    <View style={styles.progressSummaryBox}>
      <Text style={styles.progressSummaryValue}>
        {insights.healthyDays}
      </Text>
      <Text style={styles.progressSummaryLabel}>Active Days</Text>
    </View>
  </View>
</View>
<View style={styles.card}>
  <View style={styles.consistencyHeader}>
  <View style={{ flex: 1, paddingRight: 10 }}>
    <Text style={styles.cardTitle}>Weekly Consistency</Text>
    <Text style={styles.cardSub}>
      Based on meals, hydration, and active tracking days
    </Text>
  </View>

  <Text style={styles.consistencyScore}>
    {consistencyScore}%
  </Text>
</View>

  <View style={styles.goalBarBg}>
    <View
      style={[
        styles.goalBarFill,
        {
          width: `${Math.round(
            insights.mealCompletionPercent * 0.45 +
              Math.min(100, (waterGlasses / 8) * 100) * 0.35 +
              Math.min(100, (insights.healthyDays / 7) * 100) * 0.2
          )}%`,
        },
      ]}
    />
  </View>
  <Text style={styles.consistencyLabel}>
  {consistencyScore >= 90
    ? "Elite consistency 🔥"
    : consistencyScore >= 75
    ? "Great consistency ✅"
    : consistencyScore >= 60
    ? "Good progress 👍"
    : "Needs improvement 💪"}
</Text>
</View>
    <View style={styles.completionCard}>
      <View style={styles.completionHeader}>
        <Text style={styles.completionTitle}>Meal Completion</Text>
        <Text style={styles.completionPercent}>
          {insights.mealCompletionPercent}%
        </Text>
      </View>

      <View style={styles.completionBarBg}>
        <View
          style={[
            styles.completionBarFill,
            { width: `${insights.mealCompletionPercent}%` },
          ]}
        />
      </View>

      <Text style={styles.completionHint}>
        {insights.completedMealSlots}/{insights.totalMealSlots} meals checked in this week
      </Text>
    </View>

    <View style={styles.hydrationStatsCard}>
      <View style={styles.hydrationHeader}>
        <Text style={styles.hydrationTitle}>Hydration Progress</Text>

        <Text style={[styles.hydrationPercent, { color: hydrationColor }]}>
          {Math.min(100, Math.round((waterGlasses / 8) * 100))}%
        </Text>
      </View>

      <View style={styles.hydrationBarBg}>
        <View
          style={[
            styles.hydrationBarFill,
            {
              backgroundColor: hydrationColor,
              width: `${Math.min(100, (waterGlasses / 8) * 100)}%`,
            },
          ]}
        />
      </View>

      <Text style={styles.hydrationHint}>
        {insights.hydrationMessage}
      </Text>
      <Text style={styles.hydrationGoalText}>
  Daily goal: 8 glasses • Current: {waterGlasses}/8
</Text>
    </View>

<View style={styles.card}>
  <View style={styles.cardHeader}>
    <View>
      <Text style={styles.cardTitle}>Calorie Intake</Text>
      <Text style={styles.cardSub}>This Week</Text>
    </View>

    <Text style={styles.avgText}>
      Avg. {insights.avgCalories.toLocaleString()} kcal
    </Text>
  </View>

  <Text style={styles.calorieStatus}>
  {insights.avgCalories >= 1800
    ? "Great energy intake this week ✅"
    : insights.avgCalories >= 1200
    ? "Try adding one healthy snack daily 👍"
    : "Consider increasing meals or protein intake ⚠️"}
</Text>
  <View style={styles.chartArea}>
    <View style={styles.graphRow}>
      {insights.daily.map((day, index) => {
        const height = (day.calories / insights.maxCalories) * 130;

        return (
          <View key={index} style={styles.barWrapper}>
            <View style={[styles.bar, { height }]} />
            <Text style={styles.dayLabel}>{day.label}</Text>
          </View>
        );
      })}
    </View>
  </View>
</View>

    <View style={styles.card}>
      <Text style={styles.cardTitle}>Macros Breakdown</Text>

      <View style={styles.macroContainer}>
        <View style={styles.circleWrap}>
          <View style={styles.circleOuter}>
            <View style={styles.circleInner}>
              <Text style={styles.circleNumber}>{insights.avgCalories}</Text>
              <Text style={styles.circleSub}>kcal</Text>
            </View>
          </View>
        </View>

        <View style={{ flex: 1 }}>
          <MacroRow
  color="#59c15b"
  label="Carbs"
  percent={insights.carbsPercent}
  calories={Math.round(
    insights.avgCalories * (insights.carbsPercent / 100)
  )}
/>

<MacroRow
  color="#e0b24b"
  label="Protein"
  percent={insights.proteinPercent}
  calories={Math.round(
    insights.avgCalories * (insights.proteinPercent / 100)
  )}
/>

<MacroRow
  color="#166534"
  label="Fats"
  percent={insights.fatPercent}
  calories={Math.round(
    insights.avgCalories * (insights.fatPercent / 100)
  )}
/>
        </View>
      </View>
    </View>
  </>
)}

{activeTab === "reports" && (
  <>
  <View style={styles.card}>
  <View style={styles.cardHeader}>
    <View>
      <Text style={styles.cardTitle}>Weekly Trend</Text>
      <Text style={styles.cardSub}>
        {insights.weeklyTrendMessage}
      </Text>
    </View>

    <Text
      style={[
        styles.trendChange,
        {
          color:
            insights.weeklyTrendChange >= 0
              ? "#16a34a"
              : "#dc2626",
        },
      ]}
    >
      {insights.weeklyTrendChange >= 0 ? "+" : ""}
      {insights.weeklyTrendChange}
    </Text>
  </View>

  <View style={styles.trendBars}>
    {insights.trendBars.map((item: any, index: number) => {
  const score = Number(item.score || 0);

  return (
    <View key={index} style={styles.trendBarWrap}>
      <Text style={styles.trendScore}>{score}</Text>

      <View
        style={[
          styles.trendBar,
          {
            height: Math.max(18, score * 1.4),
            backgroundColor:
              score >= 80
                ? "#22c55e"
                : score >= 60
                ? "#84cc16"
                : score >= 40
                ? "#f59e0b"
                : "#ef4444",
          },
        ]}
      />

      <Text style={styles.trendLabel}>{item.label}</Text>
    </View>
  );
})}
  </View>
</View>
<View style={styles.wellnessAgeCard}>
  <View style={{ flex: 1 }}>
    <Text style={styles.wellnessAgeLabel}>Wellness Age</Text>

    <Text style={styles.wellnessAgeTitle}>
      {insights.wellnessAge} years
    </Text>

    <Text style={styles.wellnessAgeSub}>
      Actual age: {insights.actualAge} years
    </Text>

    <Text style={styles.wellnessAgeMessage}>
      {insights.wellnessMessage}
    </Text>
  </View>

  <View style={styles.wellnessAgeBadge}>
    <Text style={styles.wellnessAgeEmoji}>❤️</Text>
  </View>
</View>
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Health Score Explained</Text>

      {insights.scoreReasons.map((item: any) => (
        <View key={item.label} style={styles.reasonRow}>
          <Text style={styles.reasonLabel}>{item.label}</Text>
          <View style={styles.reasonRight}>
  <Text style={styles.reasonValue}>
    {item.value}%
  </Text>

  <View style={styles.reasonBarBg}>
    <View
      style={[
        styles.reasonBarFill,
        { width: `${Math.min(item.value, 100)}%` },
      ]}
    />
  </View>
</View>
        </View>
      ))}
    </View>

   <View style={styles.card}>
  <Text style={styles.cardTitle}>Achievements</Text>

  {insights.achievementBadges.map((badge: any) => (
    <View
      key={badge.title}
      style={[
        styles.badgeRow,
        !badge.unlocked && styles.badgeRowLocked,
      ]}
    >
      <View
        style={[
          styles.badgeIconBox,
          !badge.unlocked && styles.badgeIconLocked,
        ]}
      >
        <Text style={styles.badgeIcon}>
          {badge.unlocked ? badge.icon : "🔒"}
        </Text>
      </View>

      <View style={{ flex: 1 }}>
        <Text
          style={[
            styles.badgeTitle,
            !badge.unlocked && styles.badgeTitleLocked,
          ]}
        >
          {badge.title}
        </Text>

        <Text style={styles.badgeSubtitle}>
          {badge.subtitle}
        </Text>
      </View>

      <Text
        style={[
          styles.badgeStatus,
          badge.unlocked ? styles.badgeUnlocked : styles.badgeLocked,
        ]}
      >
        {badge.unlocked ? "UNLOCKED" : "LOCKED"}
      </Text>
    </View>
  ))}
</View>

  <View style={styles.card}>
  <Text style={styles.cardTitle}>
    Health Score Trend
  </Text>

<Svg width="100%" height={180}>
  <Polyline
    points={insights.trendBars
      .map((item: any, index: number) => {
        const x =
          index *
          (280 / Math.max(insights.trendBars.length - 1, 1));

        const y = 160 - (item.score / 100) * 120;

        return `${x},${y}`;
      })
      .join(" ")}
    fill="none"
    stroke="#22c55e"
    strokeWidth="4"
  />

  {insights.trendBars.map((item: any, index: number) => {
    const x =
      index *
      (280 / Math.max(insights.trendBars.length - 1, 1));

    const y = 160 - (item.score / 100) * 120;

    return (
      <>
  <Circle
    key={`circle-${index}`}
    cx={x}
    cy={y}
    r="6"
    fill="#16a34a"
  />

  <SvgText
    key={`text-${index}`}
    x={x}
    y={y - 14}
    fontSize="12"
    fontWeight="700"
    fill="#0f172a"
    textAnchor="middle"
  >
    {item.score}
  </SvgText>

  <SvgText
    key={`date-${index}`}
    x={x}
    y={170}
    fontSize="10"
    fill="#64748b"
    textAnchor="middle"
  >
    {item.label}
  </SvgText>
</>
    );
  })}
</Svg>
</View>
<View style={styles.trendCard}>
  <View style={styles.trendHeader}>
    <Text style={styles.trendIcon}>
      {insights.trendChange >= 0 ? "📈" : "📉"}
    </Text>

    <Text style={styles.trendTitle}>
      {insights.trendChange >= 0
        ? "Improving Trend"
        : "Declining Trend"}
    </Text>
  </View>

  <Text style={styles.trendText}>
    {insights.trendChange >= 0
      ? `Your health score improved by ${insights.trendChange} points recently.`
      : `Your health score decreased by ${Math.abs(
          insights.trendChange
        )} points recently.`}
  </Text>
</View>
<View style={styles.personalBestCard}>
  <Text style={styles.personalBestTitle}>
    🏆 Personal Best
  </Text>

  <Text style={styles.personalBestScore}>
    {Number(insights.bestRecord?.score || 0)}/100
  </Text>

  <Text style={styles.personalBestDate}>
    {String(insights.bestRecord?.score_date || "").slice(0, 10)}
  </Text>
</View>
  </>
)}   
   {/* DISCLAIMER */}
      <View style={styles.noteBox}>
        <Text style={styles.noteTitle}>
          Estimated insights
        </Text>

        <Text style={styles.noteText}>
          Health metrics are generated from your meal plans and grocery data.
          They are estimates only and not medical advice.
        </Text>
      </View>
    </ScrollView>
  );
}

function MacroRow({
  color,
  label,
  percent,
  calories,
}: {
  color: string;
  label: string;
  percent: number;
  calories: number;
}) {
  return (
    <View style={styles.macroRow}>
      <View style={styles.macroLeft}>
        <View
          style={[
            styles.macroDot,
            { backgroundColor: color },
          ]}
        />

        <Text style={styles.macroLabel}>
          {label}
        </Text>
      </View>

      <View style={{ alignItems: "flex-end" }}>
        <Text style={styles.macroPercent}>
          {percent}%
        </Text>

        <Text style={styles.macroCalories}>
          {calories} kcal
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#eef7f0",
  },

  content: {
    padding: 20,
    paddingTop: 55,
    paddingBottom: 180,
  },

  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },

  backText: {
    color: "#0f172a",
    fontWeight: "900",
    fontSize: 16,
  },
nextLevelName: {
  color: "#94a3b8",
  marginTop: 4,
  fontWeight: "700",
  fontSize: 13,
},
  title: {
    fontSize: 34,
    fontWeight: "900",
    color: "#0f172a",
    marginBottom: 20,
  },

  hero: {
    backgroundColor: "#166534",
    borderRadius: 28,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },

  heroTitle: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "900",
  },

  heroSub: {
    color: "#dcfce7",
    marginTop: 8,
    lineHeight: 20,
    fontWeight: "700",
  },

  badge: {
    width: 80,
    height: 80,
    borderRadius: 999,
    backgroundColor: "#14532d",
    borderWidth: 3,
    borderColor: "#facc15",
    alignItems: "center",
    justifyContent: "center",
  },
  scoreSubText: {
  marginTop: 4,
  color: "#64748b",
  fontSize: 13,
  fontWeight: "700",
},

  badgeEmoji: {
    fontSize: 36,
  },
xpRow: {
  flexDirection: "row",
  justifyContent: "space-between",
  paddingVertical: 12,
  borderBottomWidth: 1,
  borderBottomColor: "#f1f5f9",
},

xpLabel: {
  color: "#64748b",
  fontWeight: "800",
},

xpValue: {
  color: "#16a34a",
  fontWeight: "900",
},
  card: {
    backgroundColor: "#fff",
    borderRadius: 30,
    padding: 20,
    marginBottom: 18,

    shadowColor: "#0f172a",
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 3,
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
waterCenter: {
  alignItems: "center",
  justifyContent: "center",
},

waterIcon: {
  fontSize: 28,
  marginBottom: 4,
},
  cardTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0f172a",
  },
levelPill: {
  marginTop: 12,
  alignSelf: "flex-start",
  backgroundColor: "#dcfce7",
  paddingHorizontal: 14,
  paddingVertical: 8,
  borderRadius: 999,
},

levelPillText: {
  color: "#166534",
  fontWeight: "900",
  fontSize: 12,
  textTransform: "uppercase",
},
  cardSub: {
    color: "#64748b",
    marginTop: 4,
    fontWeight: "700",
  },
scoreCard: {
  backgroundColor: "#fff",
  borderRadius: 30,
  padding: 22,
  marginBottom: 18,
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  shadowColor: "#0f172a",
  shadowOpacity: 0.06,
  shadowRadius: 18,
  elevation: 3,
},
macroLeft: {
  flexDirection: "row",
  alignItems: "center",
  flex: 1,
},
macroRow: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 18,
},

macroDot: {
  width: 16,
  height: 16,
  borderRadius: 8,
  marginRight: 12,
},

macroLabel: {
  fontSize: 18,
  fontWeight: "800",
  color: "#0f172a",
},

macroPercent: {
  fontSize: 16,
  fontWeight: "900",
  color: "#166534",
},
streakCard: {
  backgroundColor: "#fff7ed",
  borderRadius: 28,
  padding: 22,
  marginBottom: 18,
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  shadowColor: "#000",
  shadowOpacity: 0.05,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 6 },
  elevation: 3,
},

streakTitle: {
  color: "#9a3412",
  fontSize: 14,
  fontWeight: "800",
  textTransform: "uppercase",
},

streakValue: {
  color: "#7c2d12",
  fontSize: 32,
  fontWeight: "900",
  marginTop: 4,
},

streakSub: {
  color: "#c2410c",
  marginTop: 4,
  fontWeight: "700",
},

streakEmoji: {
  fontSize: 52,
},
macroCalories: {
  fontSize: 12,
  fontWeight: "700",
  color: "#64748b",
},
scoreLabel: {
  color: "#64748b",
  fontWeight: "900",
  fontSize: 13,
  textTransform: "uppercase",
},
hydrationStatsCard: {
  backgroundColor: "#fff",
  borderRadius: 30,
  padding: 22,
  marginBottom: 18,

  shadowColor: "#0f172a",
  shadowOpacity: 0.06,
  shadowRadius: 18,
  elevation: 3,
},

hydrationHeader: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 16,
},

hydrationTitle: {
  color: "#0f172a",
  fontSize: 18,
  fontWeight: "900",
},

hydrationPercent: {
  color: "#0284c7",
  fontSize: 22,
  fontWeight: "900",
},

hydrationBarBg: {
  height: 14,
  backgroundColor: "#e0f2fe",
  borderRadius: 999,
  overflow: "hidden",
},

hydrationBarFill: {
  height: "100%",
  backgroundColor: "#0284c7",
  borderRadius: 999,
},

hydrationHint: {
  marginTop: 12,
  color: "#0369a1",
  fontWeight: "800",
},

scoreValue: {
  color: "#0f172a",
  fontSize: 42,
  fontWeight: "900",
  marginTop: 6,
},

scoreSub: {
  color: "#64748b",
  fontWeight: "700",
  marginTop: 4,
  maxWidth: 230,
  lineHeight: 20,
},

scoreBadge: {
  width: 74,
  height: 74,
  borderRadius: 999,
  backgroundColor: "#dcfce7",
  alignItems: "center",
  justifyContent: "center",
},

scoreEmoji: {
  fontSize: 34,
},
  avgText: {
    color: "#166534",
    fontWeight: "900",
  },
  reminderCard: {
  backgroundColor: "#fff",
  borderRadius: 30,
  padding: 20,
  marginBottom: 18,
  flexDirection: "row",
  alignItems: "center",
  gap: 14,
  shadowColor: "#0f172a",
  shadowOpacity: 0.06,
  shadowRadius: 18,
  elevation: 3,
},

reminderTitle: {
  color: "#0f172a",
  fontWeight: "900",
  fontSize: 18,
},

reminderSub: {
  color: "#64748b",
  fontWeight: "700",
  marginTop: 5,
  lineHeight: 20,
},
waterCard: {
  backgroundColor: "#e0f2fe",
  borderRadius: 30,
  padding: 22,
  marginBottom: 18,
  shadowColor: "#0f172a",
  shadowOpacity: 0.06,
  shadowRadius: 18,
  elevation: 3,
},

waterTitle: {
  color: "#0f172a",
  fontSize: 20,
  fontWeight: "900",
},

waterSub: {
  color: "#0369a1",
  fontWeight: "800",
  marginTop: 5,
},

waterControls: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  marginTop: 18,
},
waterBtn: {
  width: 48,
  height: 48,
  borderRadius: 999,
  backgroundColor: "#0284c7",
  alignItems: "center",
  justifyContent: "center",
},

waterBtnText: {
  color: "#fff",
  fontSize: 28,
  fontWeight: "900",
},

waterCount: {
  color: "#0f172a",
  fontSize: 24,
  fontWeight: "900",
},

waterDots: {
  flexDirection: "row",
  gap: 7,
  marginTop: 18,
},

waterDot: {
  flex: 1,
  height: 9,
  borderRadius: 999,
  backgroundColor: "rgba(2,132,199,0.18)",
},

waterDotActive: {
  backgroundColor: "#0284c7",
},
goalCard: {
  backgroundColor: "#fff",
  borderRadius: 30,
  padding: 22,
  marginBottom: 18,
  shadowColor: "#0f172a",
  shadowOpacity: 0.06,
  shadowRadius: 18,
  elevation: 3,
},

goalHeader: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 16,
},

goalTitle: {
  color: "#0f172a",
  fontWeight: "900",
  fontSize: 18,
},

goalSub: {
  color: "#64748b",
  fontWeight: "700",
  marginTop: 5,
},

goalPercent: {
  color: "#7c3aed",
  fontWeight: "900",
  fontSize: 24,
},

goalBarBg: {
  height: 14,
  borderRadius: 999,
  backgroundColor: "#ede9fe",
  overflow: "hidden",
},

goalBarFill: {
  height: "100%",
  borderRadius: 999,
  backgroundColor: "#7c3aed",
},
streakIcon: {
  width: 58,
  height: 58,
  borderRadius: 20,
  backgroundColor: "#fff7ed",
  alignItems: "center",
  justifyContent: "center",
},
aiCoachCard: {
  backgroundColor: "#111827",
  borderRadius: 30,
  padding: 20,
  marginBottom: 18,
  flexDirection: "row",
  gap: 14,
  alignItems: "center",
},

aiCoachIcon: {
  width: 58,
  height: 58,
  borderRadius: 20,
  backgroundColor: "#1f2937",
  alignItems: "center",
  justifyContent: "center",
},

aiCoachEmoji: {
  fontSize: 28,
},

aiCoachTitle: {
  color: "#fff",
  fontWeight: "900",
  fontSize: 18,
},

aiCoachText: {
  color: "#cbd5e1",
  fontWeight: "700",
  marginTop: 5,
  lineHeight: 20,
},
completionCard: {
  backgroundColor: "#fff",
  borderRadius: 30,
  padding: 22,
  marginBottom: 18,
  shadowColor: "#0f172a",
  shadowOpacity: 0.06,
  shadowRadius: 18,
  elevation: 3,
},

completionHeader: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 16,
},

completionTitle: {
  color: "#0f172a",
  fontSize: 18,
  fontWeight: "900",
},

completionPercent: {
  color: "#16a34a",
  fontSize: 22,
  fontWeight: "900",
},

completionBarBg: {
  height: 14,
  backgroundColor: "#dcfce7",
  borderRadius: 999,
  overflow: "hidden",
},

completionBarFill: {
  height: "100%",
  backgroundColor: "#16a34a",
  borderRadius: 999,
},

completionHint: {
  marginTop: 12,
  color: "#166534",
  fontWeight: "800",
},
  chartArea: {
    marginTop: 10,
  },

  graphRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 180,
  },

  barWrapper: {
    alignItems: "center",
    flex: 1,
  },

  bar: {
    width: 22,
    borderRadius: 999,
    backgroundColor: "#4CAF50",
    marginBottom: 10,
  },

  dayLabel: {
    color: "#64748b",
    fontWeight: "700",
    fontSize: 12,
  },

  macroContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
  },

  circleWrap: {
    marginRight: 24,
  },

  circleOuter: {
    width: 150,
    height: 150,
    borderRadius: 999,
    borderWidth: 16,
    borderColor: "#4CAF50",
    alignItems: "center",
    justifyContent: "center",
  },

  circleInner: {
    alignItems: "center",
    justifyContent: "center",
  },

  circleNumber: {
    fontSize: 28,
    fontWeight: "900",
    color: "#0f172a",
  },

  circleSub: {
    color: "#64748b",
    fontWeight: "700",
  },

trendScore: {
  marginBottom: 8,
  color: "#0f172a",
  fontWeight: "900",
  fontSize: 13,
},
 
  

  macroValue: {
    color: "#166534",
    fontWeight: "900",
  },

  highlightRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 18,
  },

  fireIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: "#fff7ed",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  highlightTitle: {
    color: "#0f172a",
    fontWeight: "900",
    fontSize: 16,
  },

  highlightSub: {
    color: "#64748b",
    marginTop: 4,
    fontWeight: "700",
  },
trendHeader: {
  flexDirection: "row",
  alignItems: "center",
  gap: 10,
},

trendIcon: {
  fontSize: 28,
},

trendTitle: {
  flex: 1,
  fontSize: 20,
  fontWeight: "900",
  color: "#166534",
},

trendText: {
  marginTop: 10,
  color: "#166534",
  lineHeight: 22,
  fontWeight: "700",
},
  noteBox: {
    backgroundColor: "#dcfce7",
    borderRadius: 24,
    padding: 18,
  },

  noteTitle: {
    color: "#166534",
    fontWeight: "900",
    marginBottom: 8,
    fontSize: 15,
  },
historyEmpty: {
  color: "#64748b",
  marginTop: 12,
  fontWeight: "700",
  lineHeight: 20,
},

historyRow: {
  flexDirection: "row",
  justifyContent: "space-between",
  paddingVertical: 12,
  borderBottomWidth: 1,
  borderBottomColor: "#e2e8f0",
},

historyDate: {
  color: "#64748b",
  fontWeight: "800",
},

historyScore: {
  color: "#166534",
  fontWeight: "900",
},
  noteText: {
    color: "#14532d",
    lineHeight: 22,
    fontWeight: "700",
  },
  tabs: {
  flexDirection: "row",
  backgroundColor: "#ffffff",
  borderRadius: 22,
  padding: 6,
  marginBottom: 16,
  gap: 6,
},

tabBtn: {
  flex: 1,
  paddingVertical: 11,
  borderRadius: 16,
  alignItems: "center",
},

tabBtnActive: {
  backgroundColor: "#0f7a43",
},

tabText: {
  color: "#64748b",
  fontWeight: "900",
  fontSize: 12,
},

tabTextActive: {
  color: "#ffffff",
},

actionRow: {
  flexDirection: "row",
  alignItems: "center",
  gap: 10,
  paddingVertical: 10,
},

actionIcon: {
  width: 26,
  height: 26,
  borderRadius: 999,
  backgroundColor: "#dcfce7",
  color: "#166534",
  textAlign: "center",
  lineHeight: 26,
  fontWeight: "900",
},

actionText: {
  flex: 1,
  color: "#334155",
  fontWeight: "800",
  lineHeight: 20,
},

reasonRow: {
  flexDirection: "row",
  justifyContent: "space-between",
  paddingVertical: 12,
  borderBottomWidth: 1,
  borderBottomColor: "#f1f5f9",
},

reasonLabel: {
  color: "#64748b",
  fontWeight: "800",
},

reasonValue: {
  color: "#0f172a",
  fontWeight: "900",
},

achievementRow: {
  flexDirection: "row",
  alignItems: "center",
  gap: 12,
  backgroundColor: "#f8fafc",
  padding: 14,
  borderRadius: 18,
  marginTop: 10,
},

achievementEmoji: {
  fontSize: 22,
},

achievementText: {
  color: "#0f172a",
  fontWeight: "900",
},
waterCardCompact: {
  backgroundColor: "#e0f2fe",
  borderRadius: 30,
  padding: 20,
  marginBottom: 18,
  shadowColor: "#0f172a",
  shadowOpacity: 0.06,
  shadowRadius: 18,
  elevation: 3,
},

compactWaterRow: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  marginTop: 14,
},

smallWaterBtn: {
  width: 44,
  height: 44,
  borderRadius: 999,
  backgroundColor: "#0284c7",
  alignItems: "center",
  justifyContent: "center",
},

smallWaterBtnText: {
  color: "#fff",
  fontSize: 26,
  fontWeight: "900",
},

compactWaterCenter: {
  alignItems: "center",
},

taskRow: {
  flexDirection: "row",
  alignItems: "center",
  gap: 12,
  paddingVertical: 12,
  borderBottomWidth: 1,
  borderBottomColor: "#f1f5f9",
},

taskIcon: {
  width: 28,
  height: 28,
  borderRadius: 999,
  backgroundColor: "#f1f5f9",
  color: "#94a3b8",
  textAlign: "center",
  lineHeight: 28,
  fontWeight: "900",
},

taskIconDone: {
  backgroundColor: "#dcfce7",
  color: "#166534",
},

taskText: {
  flex: 1,
  color: "#475569",
  fontWeight: "800",
},

taskTextDone: {
  color: "#166534",
},

foodRow: {
  flexDirection: "row",
  alignItems: "center",
  gap: 12,
  paddingVertical: 11,
  borderBottomWidth: 1,
  borderBottomColor: "#f1f5f9",
},

foodEmoji: {
  fontSize: 22,
},

foodText: {
  flex: 1,
  color: "#334155",
  fontWeight: "800",
},
journeyCard: {
  backgroundColor: "#fff",
  borderRadius: 30,
  padding: 22,
  marginBottom: 18,
  shadowColor: "#0f172a",
  shadowOpacity: 0.06,
  shadowRadius: 18,
  elevation: 3,
},

journeyHeader: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 12,
},

journeyLabel: {
  color: "#64748b",
  fontWeight: "900",
  textTransform: "uppercase",
  fontSize: 12,
},

journeyTitle: {
  color: "#0f172a",
  fontWeight: "900",
  fontSize: 22,
  marginTop: 4,
},

journeySub: {
  color: "#64748b",
  fontWeight: "800",
  marginBottom: 12,
},

journeyMilestone: {
  color: "#166534",
  fontWeight: "800",
  marginTop: 12,
  lineHeight: 20,
},

gradeBadge: {
  width: 64,
  height: 64,
  borderRadius: 999,
  backgroundColor: "#dcfce7",
  alignItems: "center",
  justifyContent: "center",
},

gradeText: {
  color: "#166534",
  fontWeight: "900",
   marginTop: 8,
  fontSize: 20,
},

missionHeader: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 8,
},

xpText: {
  color: "#7c3aed",
  fontWeight: "900",
  fontSize: 16,
},

xpCard: {
  backgroundColor: "#111827",
  borderRadius: 30,
  padding: 22,
  marginBottom: 18,
},

xpTitle: {
  color: "#fff",
  fontWeight: "900",
  fontSize: 20,
},

xpSub: {
  color: "#cbd5e1",
  fontWeight: "800",
  marginTop: 6,
  marginBottom: 16,
},

xpBarBg: {
  height: 14,
  backgroundColor: "#374151",
  borderRadius: 999,
  overflow: "hidden",
},

xpBarFill: {
  height: "100%",
  backgroundColor: "#22c55e",
  borderRadius: 999,
},
trendChange: {
  fontSize: 24,
  fontWeight: "900",
},

trendBars: {
  flexDirection: "row",
  alignItems: "flex-end",
  justifyContent: "space-between",
  height: 150,
  marginTop: 18,
},

trendBarWrap: {
  flex: 1,
  alignItems: "center",
},

trendBar: {
  width: 24,
  borderRadius: 999,
  backgroundColor: "#22c55e",
  marginBottom: 8,
},

trendLabel: {
  color: "#64748b",
  fontSize: 11,
  fontWeight: "800",
},
wellnessAgeCard: {
  backgroundColor: "#ffffff",
  borderRadius: 30,
  padding: 22,
  marginBottom: 18,
  flexDirection: "row",
  alignItems: "center",
  gap: 16,
},

wellnessAgeLabel: {
   color: "#64748b",
  fontWeight: "900",
  textTransform: "uppercase",
  fontSize: 12,
},

wellnessAgeTitle: {
  color: "#0f172a",
  fontWeight: "900",
  fontSize: 32,
  marginTop: 6,
},
wellnessAgeSub: {
  color: "#94a3b8",
  fontWeight: "800",
  marginTop: 4,
},

wellnessAgeMessage: {
    color: "#334155",
  fontWeight: "700",
  lineHeight: 20,
  marginTop: 12,
},

wellnessAgeBadge: {
  width: 72,
  height: 72,
  borderRadius: 999,
  backgroundColor: "#1f2937",
  alignItems: "center",
  justifyContent: "center",
},

wellnessAgeEmoji: {
  fontSize: 34,
},
reasonRight: {
  width: 120,
  alignItems: "flex-end",
},

reasonBarBg: {
  width: 120,
  height: 8,
  backgroundColor: "#e2e8f0",
  borderRadius: 999,
  marginTop: 6,
  overflow: "hidden",
},

reasonBarFill: {
  height: "100%",
  backgroundColor: "#16a34a",
  borderRadius: 999,
},
achievementIcon: {
  width: 48,
  height: 48,
  borderRadius: 16,
  backgroundColor: "#fef3c7",
  alignItems: "center",
  justifyContent: "center",
},
lockedTitle: {
  color: "#64748b",
  fontWeight: "900",
  marginTop: 18,
  marginBottom: 8,
  textTransform: "uppercase",
  fontSize: 12,
},

lockedAchievementRow: {
  flexDirection: "row",
  alignItems: "center",
  gap: 14,
  backgroundColor: "#f8fafc",
  padding: 16,
  borderRadius: 20,
  marginTop: 10,
  opacity: 0.75,
},

lockedAchievementIcon: {
  width: 48,
  height: 48,
  borderRadius: 16,
  backgroundColor: "#e2e8f0",
  alignItems: "center",
  justifyContent: "center",
},

lockedAchievementEmoji: {
  fontSize: 22,
},

lockedAchievementText: {
  color: "#64748b",
  fontWeight: "900",
  fontSize: 15,
},
focusGrid: {
  flexDirection: "row",
  flexWrap: "wrap",
  gap: 10,
  marginTop: 14,
},

focusPill: {
  backgroundColor: "#dcfce7",
  paddingHorizontal: 14,
  paddingVertical: 10,
  borderRadius: 999,
},

focusText: {
  color: "#166534",
  fontWeight: "900",
  fontSize: 13,
},
missionSuccessCard: {
  backgroundColor: "#dcfce7",
  borderRadius: 26,
  paddingVertical: 18,
  paddingHorizontal: 20,
  alignItems: "center",
  marginBottom: 18,
},

missionSuccessEmoji: {
  fontSize: 34,
  marginBottom: 6,
},

missionSuccessTitle: {
  color: "#166534",
  fontSize: 22,
  fontWeight: "900",
  textAlign: "center",
},

missionSuccessText: {
  color: "#14532d",
  textAlign: "center",
  marginTop: 6,
  lineHeight: 20,
  fontWeight: "700",
},
todayCoachCard: {
  backgroundColor: "#111827",
  borderRadius: 28,
  padding: 18,
  marginBottom: 18,
  flexDirection: "row",
  gap: 14,
  alignItems: "flex-start",
},
nextLevelText: {
  color: "#cbd5e1",
  marginTop: 6,
  fontWeight: "700",
  fontSize: 13,
},
progressSummaryGrid: {
  flexDirection: "row",
  gap: 10,
  marginTop: 16,
},

progressSummaryBox: {
  flex: 1,
  backgroundColor: "#f8fafc",
  borderRadius: 20,
  padding: 14,
  alignItems: "center",
},

progressSummaryValue: {
  color: "#0f172a",
  fontWeight: "900",
  fontSize: 22,
},

progressSummaryLabel: {
  color: "#64748b",
  fontWeight: "800",
  marginTop: 4,
  fontSize: 12,
},
consistencyScore: {
  color: "#16a34a",
  fontSize: 24,
  fontWeight: "900",
  marginLeft: 10,
},
consistencyHeader: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "flex-start",
},
consistencyLabel: {
  marginTop: 12,
  color: "#64748b",
  fontWeight: "700",
  textAlign: "center",
},
hydrationGoalText: {
  color: "#64748b",
  fontWeight: "700",
  marginTop: 8,
  fontSize: 13,
},
calorieStatus: {
  color: "#64748b",
  fontWeight: "700",
  marginTop: 4,
  fontSize: 13,
},
nextGoalCard: {
  backgroundColor: "#ecfdf5",
  borderRadius: 26,
  padding: 18,
  marginBottom: 14,
  borderWidth: 1,
  borderColor: "#bbf7d0",
},

nextGoalTitle: {
  color: "#166534",
  fontWeight: "900",
  fontSize: 15,
  textTransform: "uppercase",
},

nextGoalText: {
  color: "#14532d",
  fontWeight: "800",
  lineHeight: 22,
  marginTop: 8,
  fontSize: 15,
},
badgeRow: {
  flexDirection: "row",
  alignItems: "center",
  gap: 12,
  backgroundColor: "#f8fafc",
  padding: 14,
  borderRadius: 18,
  marginTop: 12,
},

badgeRowLocked: {
  opacity: 0.6,
},

badgeIconBox: {
  width: 52,
  height: 52,
  borderRadius: 18,
  backgroundColor: "#dcfce7",
  alignItems: "center",
  justifyContent: "center",
},

badgeIconLocked: {
  backgroundColor: "#e5e7eb",
},

badgeIcon: {
  fontSize: 24,
},

badgeTitle: {
  color: "#0f172a",
  fontWeight: "900",
  fontSize: 15,
},

badgeTitleLocked: {
  color: "#64748b",
},

badgeSubtitle: {
  color: "#64748b",
  fontWeight: "700",
  marginTop: 3,
  fontSize: 12,
},

badgeStatus: {
  fontSize: 10,
  fontWeight: "900",
},

badgeUnlocked: {
  color: "#16a34a",
},

badgeLocked: {
  color: "#64748b",
},
trendCard: {
  backgroundColor: "#ecfdf5",
  borderRadius: 24,
  padding: 20,
  marginTop: 16,
},
personalBestCard: {
  backgroundColor: "#fff7ed",
  borderRadius: 24,
  padding: 20,
  marginTop: 16,
},

personalBestTitle: {
  fontSize: 20,
  fontWeight: "900",
  color: "#9a3412",
},

personalBestScore: {
  fontSize: 42,
  fontWeight: "900",
  color: "#ea580c",
  marginTop: 8,
},

personalBestDate: {
  color: "#9a3412",
  fontWeight: "700",
},
});