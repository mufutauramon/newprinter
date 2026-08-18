import { useState } from "react";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import SafeImage from "../../components/SafeImage";
import { apiFetch } from "../../utils/api";
import { getErrorMessage } from "../../utils/errorMessage";
import { useAppContext } from "../../context/AppContext";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
   TouchableOpacity,
  Modal,
  Linking,
  ActivityIndicator,
  Alert,
  RefreshControl,

} from "react-native";
const TEST_UNLOCK_HEALTH = false;;
function getPlanDateFromStart(planStartDate: string | null | undefined, index: number) {
  const start = planStartDate ? new Date(planStartDate) : new Date();
  start.setHours(0, 0, 0, 0);

  const d = new Date(start);
  d.setDate(start.getDate() + index);

  return {
    full: d.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    short: d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    }),
  };
}
type MealCheckInStatus = "eaten" | "small" | "large" | "skipped" | "";
export default function Meals() {
  const {
    meals,
    visibleMeals,
    setMeals,
    saveMealPlan,
    mealPlanSaving,
    refreshAIGroceries,
    familySize,
    region,
    planDays,
    startDay,
    showFruit,
    showAppetizer,
    isPro,
     mealCheckIns,
  checkInMeal,
  planStartDate,
  mealCulture,
regenerateMealPlanByCulture,
  wellnessPlan,
  generateLocalMealPlan,
  regenerateMealPlanByWellness,
  } = useAppContext();
  const canOpenHealth = isPro || TEST_UNLOCK_HEALTH;

  const [selectedMeal, setSelectedMeal] = useState<any>(null);
  const [generating, setGenerating] = useState(false);
  const [recipeMeal, setRecipeMeal] = useState("");
  const [recipeGuide, setRecipeGuide] = useState<any>(null);
  const [recipeLoading, setRecipeLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [cultureModalVisible, setCultureModalVisible] = useState(false);
  const [wellnessModalVisible, setWellnessModalVisible] = useState(false);
   const { token } = useAppContext();
  const updateMeal = (field: string, value: string) => {
    setSelectedMeal((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  const saveMeal = async () => {
    const updatedMeals = meals.map((meal) =>
      meal.day === selectedMeal.day ? selectedMeal : meal
    );

    setMeals(updatedMeals);
    setSelectedMeal(null);

    setTimeout(() => {
      saveMealPlan();
      refreshAIGroceries();
    }, 200);
  };
async function openRecipeVideo(mealName: string) {
  try {
    const data = await apiFetch<{
      ok: boolean;
      found?: boolean;
      youtubeUrl?: string;
      error?: string;
    }>(`/api/recipe-video?meal=${encodeURIComponent(mealName)}`);

    if (data.ok && data.found && data.youtubeUrl) {
      await Linking.openURL(data.youtubeUrl);
      return;
    }

    const fallbackUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
      `${mealName} Naija Meal Planner`
    )}`;

    await Linking.openURL(fallbackUrl);
  } catch (err) {
    const fallbackUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
      `${mealName} Naija Meal Planner`
    )}`;

    await Linking.openURL(fallbackUrl);
  }
}
  const openRecipeGuide = async (mealName: string) => {
  // if (!canOpenHealth) {
  //   router.push("/paywall");
  //   return;
  // }

  try {
    setRecipeMeal(mealName);
    setRecipeGuide(null);
    setRecipeLoading(true);

    const data = await apiFetch<{
      ok: boolean;
      error?: string;
      [key: string]: any;
    }>("/api/ai/meal-guide", {
      method: "POST",
       token,
      timeout: 30000,
      body: JSON.stringify({
        meal: mealName,
        region,
      }),
    });

    if (!data.ok) {
      throw new Error(data.error || "Could not load recipe");
    }

    setRecipeGuide(data);
  } catch (err: any) {
    Alert.alert("Recipe error", getErrorMessage(err));
  } finally {
    setRecipeLoading(false);
  }
};

const onRefresh = async () => {
  try {
    setRefreshing(true);
    await refreshAIGroceries();
  } catch (err) {
    console.log("Refresh failed:", err);
  } finally {
    setRefreshing(false);
  }
};

const cleanMealName = (meal?: string) => {
  if (!meal) return "";

  return meal
    .replace(/nigerian/gi, "")
    .replace(/\s+/g, " ")
    .trim();
};
const getCheckIn = (day: number, field: string) => {
  return mealCheckIns?.[`${day}-${field}`]?.status || "";
};
const generateNewRandomPlan = async () => {
  try {
    setGenerating(true);

    if (!isPro) {
  const newMeals = generateLocalMealPlan(
    Number(planDays || 30),
    "general",
    "general"
  );

  setMeals(newMeals);

  setTimeout(() => {
    saveMealPlan();
    refreshAIGroceries();
  }, 100);

  Alert.alert("Meal plan updated", "A fresh meal timetable has been generated.");

  return;
}

    const newMeals = generateLocalMealPlan(
      Number(planDays || 30),
      mealCulture,
      wellnessPlan
    );

    setMeals(newMeals);

    setTimeout(() => {
      saveMealPlan();
      refreshAIGroceries();
    }, 100);

    Alert.alert("Meal plan updated", "A fresh meal timetable has been generated.");
  } finally {
    setGenerating(false);
  }
};
const RECIPE_VIDEO_MAP: Record<string, string> = {
  "Jollof Rice":
    "https://www.youtube.com/watch?v=YOUR_JOLLOF_VIDEO_ID",

  "Egusi Soup":
    "https://www.youtube.com/watch?v=YOUR_EGUSI_VIDEO_ID",

  "Yam Porridge":
    "https://www.youtube.com/watch?v=YOUR_YAM_PORRIDGE_VIDEO_ID",

  "Pounded Yam":
    "https://www.youtube.com/watch?v=YOUR_POUNDED_YAM_VIDEO_ID",
};
function getRecipeVideoUrl(meal: string) {
  const normalizedMeal = String(meal || "").trim();

  const ownVideo = RECIPE_VIDEO_MAP[normalizedMeal];

  if (ownVideo) {
    return ownVideo;
  }

  return `https://www.youtube.com/results?search_query=${encodeURIComponent(
    normalizedMeal + " recipe"
  )}`;
}
const getCheckInLabel = (status?: string) => {
  if (!status) return "";
  if (status === "eaten") return "Ate as planned";
  if (status === "small") return "Small portion";
  if (status === "large") return "Large portion";
  if (status === "skipped") return "Skipped";
  return "";
};
  const downloadMealPlan = async () => {
   const fruitHeader = showFruit
  ? `<th style="border:1px solid #ddd; padding:8px;">Fruit</th>`
  : "";

const fruitRows = (meal: any) =>
  showFruit
    ? `<td style="border:1px solid #ddd; padding:8px;">${cleanMealName(meal.fruit)}</td>`
    : "";

const html = `
  <html>
    <body style="font-family: Arial; padding: 24px;">
      <h1>Naija Meal Planner</h1>
      <p>${visibleMeals.length}-day meal plan</p>
      <table style="width:100%; border-collapse: collapse;">
        <thead>
          <tr>
            <th style="border:1px solid #ddd; padding:8px;">Day</th>
            <th style="border:1px solid #ddd; padding:8px;">Breakfast</th>
            <th style="border:1px solid #ddd; padding:8px;">Lunch</th>
            <th style="border:1px solid #ddd; padding:8px;">Dinner</th>
            ${fruitHeader}
          </tr>
        </thead>
        <tbody>
          ${visibleMeals
            .map(
              (meal) => `
                <tr>
                  <td style="border:1px solid #ddd; padding:8px;">${meal.day}</td>
                  <td style="border:1px solid #ddd; padding:8px;">${cleanMealName(meal.breakfast)}</td>
                  <td style="border:1px solid #ddd; padding:8px;">${cleanMealName(meal.lunch)}</td>
                  <td style="border:1px solid #ddd; padding:8px;">${cleanMealName(meal.dinner)}</td>
                  ${fruitRows(meal)}
                </tr>
              `
            )
            .join("")}
        </tbody>
      </table>
    </body>
  </html>
`;
    const { uri } = await Print.printToFileAsync({ html });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: "Download Meal Plan",
        UTI: "com.adobe.pdf",
      });
    }
  };

  const mealRows = (meal: any) => [
    { icon: "🍳", label: "Breakfast", value: meal.breakfast },
    { icon: "🍛", label: "Lunch", value: meal.lunch },
    { icon: "🍲", label: "Dinner", value: meal.dinner },
  ];

 return (
  <View style={{ flex: 1 }}>
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#0f7a43"
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.kicker}>Your plan</Text>
        <Text style={styles.title}>Meal Timetable</Text>
      </View>

      <View style={styles.summaryCard}>
        <View>
          <Text style={styles.summaryTitle}>{visibleMeals.length} days</Text>
          <Text style={styles.summarySub}>
            Family size {familySize || "1"} • Start day {startDay || "1"}
          </Text>
        </View>

        <View style={styles.proBadge}>
          <Text style={styles.proBadgeText}>{isPro ? "PRO" : "FREE"}</Text>
        </View>
      </View>

      <View style={styles.actionGrid}>
        <Pressable style={styles.actionBtn} onPress={downloadMealPlan}>
          <Text style={styles.actionIcon}>⬇️</Text>
          <Text style={styles.actionText}>PDF</Text>
        </Pressable>

        <Pressable style={styles.actionBtnPro} onPress={generateNewRandomPlan}>
          {generating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.actionIcon}>🔄</Text>
              <Text style={styles.actionTextLight}>Generate New Plan</Text>
            </>
          )}
        </Pressable>
      </View>

      <View style={styles.selectorRow}>
        <View style={[styles.selectorCard, styles.selectorHalf]}>
          <Text style={styles.selectorLabel}>Meal Category</Text>

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.dropdownBtn}
            onPress={() => setCultureModalVisible(true)}
          >
            <Text style={styles.dropdownText}>
              {mealCulture === "yoruba"
                ? "Yoruba"
                : mealCulture === "hausa"
                ? "Hausa"
                : mealCulture === "igbo"
                ? "Igbo"
                : "General"}
            </Text>

            <Ionicons name="chevron-down" size={20} color="#15803d" />
          </TouchableOpacity>
        </View>

        <View style={[styles.selectorCard, styles.selectorHalf]}>
          <Text style={styles.selectorLabel}>Wellness</Text>

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.dropdownBtn}
            onPress={() => setWellnessModalVisible(true)}
          >
            <Text style={styles.dropdownText}>
              {wellnessPlan === "blood_pressure"
                ? "BP"
                : wellnessPlan === "diabetes"
                ? "Diabetes"
                : wellnessPlan === "ulcer"
                ? "Ulcer"
                : wellnessPlan === "heart_health"
                ? "Heart"
                : wellnessPlan === "weight_loss"
                ? "Weight Loss"
                : "General"}
            </Text>

            <Ionicons name="chevron-down" size={20} color="#15803d" />
          </TouchableOpacity>
        </View>
      </View>

      {visibleMeals.length === 0 && (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyEmoji}>🍽️</Text>
          <Text style={styles.emptyTitle}>No meal plan loaded</Text>
          <Text style={styles.emptyText}>Generate a new meal plan to continue.</Text>

          <Pressable style={styles.retryBtn} onPress={generateNewRandomPlan}>
            <Text style={styles.retryBtnText}>Generate Meal Plan</Text>
          </Pressable>
        </View>
      )}

      {visibleMeals.map((meal, index) => {
        const planDate = getPlanDateFromStart(planStartDate, index);

        return (
          <View key={meal.day} style={styles.mealCard}>
            <View style={styles.cardTop}>
              <View>
                <Text style={styles.day}>Day {index + 1}</Text>
                <Text style={styles.daySub}>
                  {planDate.short} • Breakfast • Lunch • Dinner
                </Text>
              </View>

              <Pressable style={styles.editBtn} onPress={() => setSelectedMeal(meal)}>
                <Text style={styles.editText}>Edit</Text>
              </Pressable>
            </View>

            <View style={styles.mealsBlock}>
              {mealRows(meal).map((item) => {
                const field = item.label.toLowerCase();
                const status = getCheckIn(meal.day, field);

                return (
                  <View key={item.label} style={styles.premiumMealBox}>
                    <View style={styles.mealLine}>
                      <View style={styles.mealLeft}>
                        <Text style={styles.mealIcon}>{item.icon}</Text>

                        <View style={{ flex: 1 }}>
                          <Text style={styles.mealLabel}>{item.label}</Text>
                          <Text style={styles.mealText} numberOfLines={1}>
                            {cleanMealName(item.value)}
                          </Text>

                          <Text style={styles.checkStatus}>
                            {getCheckInLabel(status)}
                          </Text>
                        </View>
                      </View>

                      <Pressable
                        style={styles.recipeBtn}
                        hitSlop={12}
                        onPress={() => openRecipeGuide(cleanMealName(item.value))}
                      >
                        <Text style={styles.recipeLink}>Recipe</Text>
                      </Pressable>
                    </View>

                    <View style={styles.checkInRow}>
                      {["eaten", "small", "large", "skipped"].map((choice) => {
                        const isActive = status === choice;
                        const label =
                          choice === "eaten"
                            ? "Ate"
                            : choice === "small"
                            ? "Small"
                            : choice === "large"
                            ? "Large"
                            : "Skip";

                        return (
                          <Pressable
                            key={choice}
                            style={[
                              styles.checkChip,
                              isActive &&
                                (choice === "skipped"
                                  ? styles.skipChipActive
                                  : styles.checkChipActive),
                            ]}
                            onPress={() => {
                              const current =
                                mealCheckIns?.[`${meal.day}-${field}`]?.status;

                              checkInMeal(
  meal.day,
  field,
  current === choice ? "" : (choice as MealCheckInStatus)
);
                            }}
                          >
                            <Text
                              style={[
                                styles.checkChipText,
                                isActive &&
                                  (choice === "skipped"
                                    ? styles.skipChipTextActive
                                    : styles.checkChipTextActive),
                              ]}
                            >
                              {label}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                );
              })}

              {showFruit && meal.fruit && (
                <View style={styles.fruitPill}>
                  <Text style={styles.fruitText}>🍎 {meal.fruit}</Text>
                </View>
              )}

              {showAppetizer && meal.appetizer && (
                <View style={styles.fruitPill}>
                  <Text style={styles.fruitText}>🥗 {meal.appetizer}</Text>
                </View>
              )}
            </View>
          </View>
        );
      })}
    </ScrollView>

    <Modal
      visible={cultureModalVisible}
      transparent
      animationType="fade"
      presentationStyle="overFullScreen"
      onRequestClose={() => setCultureModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Select Meal Category</Text>

          {[
            { key: "general", label: "General Meals" },
            { key: "yoruba", label: "Yoruba Meals" },
            { key: "hausa", label: "Hausa Meals" },
            { key: "igbo", label: "Igbo Meals" },
          ].map((item) => {
            const active = mealCulture === item.key;

            return (
              <Pressable
                key={item.key}
                style={[styles.modalOption, active && styles.modalOptionActive]}
                onPress={() => {
  if (!isPro && item.key !== "general") {
    setCultureModalVisible(false);
    router.push("/paywall");
    return;
  }

  regenerateMealPlanByCulture(item.key as any);
  setCultureModalVisible(false);
}}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    active && styles.modalOptionTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}

          <Pressable
            style={styles.modalCancel}
            onPress={() => setCultureModalVisible(false)}
          >
            <Text style={styles.modalCancelText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>

    <Modal
      visible={wellnessModalVisible}
      transparent
      animationType="fade"
      presentationStyle="overFullScreen"
      onRequestClose={() => setWellnessModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Select Wellness Plan</Text>

          {[
            { key: "general", label: "General" },
            { key: "weight_loss", label: "Weight Loss" },
            { key: "blood_pressure", label: "Blood Pressure" },
            { key: "diabetes", label: "Diabetes" },
            { key: "ulcer", label: "Ulcer" },
            { key: "heart_health", label: "Heart Health" },
          ].map((item) => {
            const active = wellnessPlan === item.key;

            return (
              <Pressable
                key={item.key}
                style={[styles.modalOption, active && styles.modalOptionActive]}
                onPress={() => {
  if (!isPro && item.key !== "general") {
    setWellnessModalVisible(false);
    router.push("/paywall");
    return;
  }

  regenerateMealPlanByWellness(item.key as any);
  setWellnessModalVisible(false);
}}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    active && styles.modalOptionTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}

          <Pressable
            style={styles.modalCancel}
            onPress={() => setWellnessModalVisible(false)}
          >
            <Text style={styles.modalCancelText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>

    <Modal visible={!!selectedMeal} animationType="slide">
      {selectedMeal && (
        <ScrollView
          style={styles.modalScreen}
          contentContainerStyle={styles.modalContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.modalKicker}>Edit plan</Text>
          <Text style={styles.modalTitle}>Day {selectedMeal.day}</Text>
          <Text style={styles.modalSub}>Update meals for this day.</Text>

          <View style={styles.modalCard}>
            <Text style={styles.label}>Breakfast</Text>
            <TextInput
              style={styles.input}
              value={selectedMeal.breakfast}
              onChangeText={(v) => updateMeal("breakfast", v)}
            />

            <Text style={styles.label}>Lunch</Text>
            <TextInput
              style={styles.input}
              value={selectedMeal.lunch}
              onChangeText={(v) => updateMeal("lunch", v)}
            />

            <Text style={styles.label}>Dinner</Text>
            <TextInput
              style={styles.input}
              value={selectedMeal.dinner}
              onChangeText={(v) => updateMeal("dinner", v)}
            />

            <Text style={styles.label}>Fruit / Snack</Text>
            <TextInput
              style={styles.input}
              value={selectedMeal.fruit}
              onChangeText={(v) => updateMeal("fruit", v)}
            />
          </View>

          <Pressable style={styles.saveBtn} onPress={saveMeal}>
            <Text style={styles.saveText}>Save Meal</Text>
          </Pressable>

          <Pressable style={styles.cancelBtn} onPress={() => setSelectedMeal(null)}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </ScrollView>
      )}
    </Modal>

    <Modal visible={!!recipeMeal} animationType="slide">
      <ScrollView
        style={styles.modalScreen}
        contentContainerStyle={styles.modalContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.modalKicker}>Recipe guide</Text>
        <Text style={styles.modalTitle}>{recipeMeal}</Text>

        {recipeGuide?.image_url && (
          <SafeImage
            source={{ uri: recipeGuide.image_url }}
            style={styles.recipeImage}
            resizeMode="cover"
          />
        )}

        {recipeLoading && (
          <View style={styles.loadingCard}>
            <ActivityIndicator color="#0f7a43" />
            <Text style={styles.loadingText}>Preparing your recipe...</Text>
          </View>
        )}

        {!recipeLoading && recipeGuide && (
          <>
            <Text style={styles.recipeDescription}>{recipeGuide.description}</Text>

            <View style={styles.recipeCard}>
              <Text style={styles.recipeSectionTitle}>Ingredients</Text>
              {recipeGuide.ingredients?.map((item: string, index: number) => (
                <Text key={index} style={styles.recipeItem}>
                  • {item}
                </Text>
              ))}
            </View>

            <View style={styles.recipeCard}>
              <Text style={styles.recipeSectionTitle}>Step-by-step</Text>
              {recipeGuide.steps?.map((step: string, index: number) => (
                <Text key={index} style={styles.recipeItem}>
                  {index + 1}. {step}
                </Text>
              ))}
            </View>

        <Pressable
  style={styles.youtubeSearchBtn}
  onPress={() => openRecipeVideo(recipeMeal || "Nigerian recipe")}
>
  <Text style={styles.youtubeSearchText}>▶️ Watch Recipe Video</Text>
</Pressable>
          </>
        )}

        <Pressable
          style={styles.cancelBtn}
          onPress={() => {
            setRecipeMeal("");
            setRecipeGuide(null);
          }}
        >
          <Text style={styles.cancelText}>Close</Text>
        </Pressable>
      </ScrollView>
    </Modal>
  </View>
);}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#eef7f0",
  },
  content: {
    padding: 20,
    paddingTop: 28,
    paddingBottom: 180,
  },
  header: {
    marginBottom: 18,
  },
  kicker: {
    color: "#15803d",
    fontWeight: "900",
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  emptyCard: {
  backgroundColor: "#fff",
  padding: 24,
  borderRadius: 28,
  alignItems: "center",
  marginBottom: 16,
},

emptyEmoji: {
  fontSize: 34,
  marginBottom: 8,
},

emptyTitle: {
  color: "#0f172a",
  fontWeight: "900",
  fontSize: 17,
  marginTop: 8,
},

emptyText: {
  color: "#64748b",
  textAlign: "center",
  marginTop: 5,
  lineHeight: 20,
},
  title: {
    fontSize: 34,
    fontWeight: "900",
    color: "#0f172a",
    letterSpacing: -1,
  },
  subtitle: {
    color: "#64748b",
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
  },
  summaryCard: {
    backgroundColor: "#0f172a",
    borderRadius: 28,
    padding: 20,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalOverlay: {
  flex: 1,
  backgroundColor: "rgba(15, 23, 42, 0.45)",
  justifyContent: "center",
  padding: 24,
},

modalOption: {
  padding: 16,
  borderRadius: 18,
  backgroundColor: "#f8fafc",
  marginBottom: 10,
  borderWidth: 1,
  borderColor: "#e2e8f0",
},
youtubeSearchBtn: {
  backgroundColor: "#dc2626",
  paddingHorizontal: 14,
  paddingVertical: 12,
  borderRadius: 14,
  alignItems: "center",
  marginBottom: 10,
},

youtubeSearchText: {
  color: "#fff",
  fontWeight: "900",
  fontSize: 14,
},
modalOptionActive: {
  backgroundColor: "#dcfce7",
  borderColor: "#22c55e",
},

modalOptionText: {
  fontSize: 16,
  fontWeight: "800",
  color: "#334155",
},

modalOptionTextActive: {
  color: "#166534",
  fontWeight: "900",
},
  modalCancel: {
  marginTop: 8,
  padding: 14,
  borderRadius: 16,
  alignItems: "center",
  backgroundColor: "#f1f5f9",
},

modalCancelText: {
  color: "#0f172a",
  fontWeight: "900",
},
  summaryTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
  },
  summarySub: {
    color: "#cbd5e1",
    marginTop: 5,
    fontWeight: "700",
  },
  proBadge: {
    backgroundColor: "#dcfce7",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  proBadgeText: {
    color: "#166534",
    fontWeight: "900",
    fontSize: 12,
  },
  actionGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: "#fff",
    paddingVertical: 16,
    borderRadius: 22,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  selectorRow: {
  flexDirection: "row",
  gap: 12,
  marginBottom: 18,
},

selectorHalf: {
  flex: 1,
},

selectorCard: {
  backgroundColor: "#fff",
  borderRadius: 28,
  padding: 18,
  shadowColor: "#0f172a",
  shadowOpacity: 0.05,
  shadowRadius: 10,
  elevation: 2,
},

selectorLabel: {
  fontSize: 15,
  fontWeight: "900",
  color: "#334155",
  marginBottom: 12,
},

dropdownBtn: {
  borderWidth: 1,
  borderColor: "#bbf7d0",
  backgroundColor: "#ecfdf5",
  borderRadius: 18,
  paddingHorizontal: 14,
  paddingVertical: 14,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
},

dropdownText: {
  color: "#166534",
  fontWeight: "900",
  fontSize: 15,
},
  actionBtnDark: {
    flex: 1,
    backgroundColor: "#0f172a",
    paddingVertical: 16,
    borderRadius: 22,
    alignItems: "center",
  },
  actionBtnPro: {
    flex: 1,
    backgroundColor: "#7c3aed",
    paddingVertical: 16,
    borderRadius: 22,
    alignItems: "center",
  },
  actionIcon: {
    fontSize: 18,
    marginBottom: 5,
  },
  actionText: {
    color: "#0f172a",
    fontWeight: "900",
  },
  actionTextLight: {
    color: "#fff",
    fontWeight: "900",
  },
  mealCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 30,
    marginBottom: 16,
    shadowColor: "#0f172a",
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 2,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  day: {
    fontSize: 21,
    fontWeight: "900",
    color: "#0f172a",
  },
  daySub: {
    color: "#94a3b8",
    fontWeight: "700",
    marginTop: 4,
    fontSize: 12,
  },
  editBtn: {
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  editText: {
    color: "#0f7a43",
    fontWeight: "900",
    fontSize: 13,
  },
  mealsBlock: {
    gap: 12,
  },
  retryBtn: {
  marginTop: 16,
  backgroundColor: "#0f7a43",
  paddingVertical: 14,
  paddingHorizontal: 20,
  borderRadius: 20,
  alignItems: "center",
},

retryBtnText: {
  color: "#fff",
  fontWeight: "900",
  fontSize: 15,
},
  mealLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  mealLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  mealIcon: {
    width: 34,
    height: 34,
    borderRadius: 13,
    backgroundColor: "#f8fafc",
    textAlign: "center",
    lineHeight: 34,
    overflow: "hidden",
  },
  mealLabel: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 2,
  },
  mealText: {
    fontSize: 15,
    color: "#334155",
    fontWeight: "800",
  },
  cultureCard: {
  backgroundColor: "#fff",
  borderRadius: 24,
  padding: 16,
  marginBottom: 18,
},

cultureLabel: {
  color: "#334155",
  fontWeight: "900",
  fontSize: 13,
  marginBottom: 8,
},

cultureDropdown: {
  backgroundColor: "#ecfdf5",
  borderWidth: 1,
  borderColor: "#bbf7d0",
  borderRadius: 18,
  padding: 15,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
},

cultureDropdownText: {
  color: "#166534",
  fontWeight: "900",
  fontSize: 16,
},

cultureArrow: {
  color: "#166534",
  fontWeight: "900",
},

cultureMenu: {
  marginTop: 10,
  gap: 8,
},

cultureOption: {
  padding: 14,
  borderRadius: 16,
  backgroundColor: "#f8fafc",
  borderWidth: 1,
  borderColor: "#e2e8f0",
},

cultureOptionActive: {
  backgroundColor: "#dcfce7",
  borderColor: "#22c55e",
},

cultureOptionText: {
  color: "#334155",
  fontWeight: "800",
},

cultureOptionTextActive: {
  color: "#166534",
  fontWeight: "900",
},
  recipeBtn: {
    backgroundColor: "#ecfdf5",
    paddingVertical: 8,
    paddingHorizontal: 13,
    borderRadius: 999,
  },
  recipeLink: {
    color: "#0f7a43",
    fontWeight: "900",
    fontSize: 12,
  },
  fruitPill: {
    backgroundColor: "#fff7ed",
    borderRadius: 18,
    padding: 12,
    marginTop: 2,
  },
  fruitText: {
    color: "#c2410c",
    fontWeight: "900",
  },
  modalScreen: {
    flex: 1,
    backgroundColor: "#eef7f0",
  },
  premiumMealBox: {
  backgroundColor: "#f8fafc",
  borderRadius: 22,
  padding: 14,
  marginBottom: 12,
  borderWidth: 1,
  borderColor: "#e2e8f0",
},

checkStatus: {
  color: "#15803d",
  fontWeight: "900",
  fontSize: 11,
  marginTop: 4,
},

checkInRow: {
  flexDirection: "row",
  gap: 8,
  marginTop: 12,
},

checkChip: {
  flex: 1,
  backgroundColor: "#fff",
  borderWidth: 1,
  borderColor: "#e2e8f0",
  paddingVertical: 9,
  borderRadius: 999,
  alignItems: "center",
},

checkChipActive: {
  backgroundColor: "#dcfce7",
  borderColor: "#86efac",
},

skipChipActive: {
  backgroundColor: "#fee2e2",
  borderColor: "#fca5a5",
},

checkChipText: {
  color: "#64748b",
  fontWeight: "900",
  fontSize: 11,
},

checkChipTextActive: {
  color: "#166534",
},

skipChipTextActive: {
  color: "#b91c1c",
},
  modalContent: {
    padding: 22,
    paddingTop: 42,
    paddingBottom: 48,
  },
  modalKicker: {
    color: "#15803d",
    fontWeight: "900",
    fontSize: 13,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  modalTitle: {
    fontSize: 32,
    fontWeight: "900",
    color: "#0f172a",
    letterSpacing: -0.8,
  },
  modalSub: {
    color: "#64748b",
    marginTop: 6,
    marginBottom: 18,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 28,
    padding: 20,
    marginTop: 18,
    marginBottom: 12,
  },
  label: {
    fontWeight: "900",
    marginBottom: 8,
    color: "#0f172a",
  },
  input: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 16,
    borderRadius: 18,
    marginBottom: 16,
    fontSize: 16,
    color: "#0f172a",
    fontWeight: "700",
  },
  saveBtn: {
    backgroundColor: "#0f7a43",
    padding: 18,
    borderRadius: 22,
    alignItems: "center",
    marginTop: 10,
  },
  saveText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 16,
  },
  cancelBtn: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 17,
    borderRadius: 22,
    alignItems: "center",
    marginTop: 12,
  },
  cancelText: {
    color: "#0f172a",
    fontWeight: "900",
  },
  recipeImage: {
    width: "100%",
    height: 230,
    borderRadius: 28,
    marginTop: 18,
    marginBottom: 16,
    backgroundColor: "#e2e8f0",
  },
  loadingCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 24,
    alignItems: "center",
    marginTop: 18,
  },
  loadingText: {
    marginTop: 10,
    color: "#64748b",
    fontWeight: "800",
  },
  recipeDescription: {
    color: "#475569",
    fontSize: 15,
    lineHeight: 23,
    marginBottom: 16,
    marginTop: 14,
  },
  recipeCard: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 24,
    marginBottom: 14,
  },
  recipeSectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0f172a",
    marginBottom: 10,
  },
  recipeItem: {
    color: "#334155",
    marginBottom: 9,
    lineHeight: 22,
    fontWeight: "600",
  },
  videoBtn: {
    backgroundColor: "#dc2626",
    padding: 17,
    borderRadius: 22,
    alignItems: "center",
    marginBottom: 12,
  },
  videoText: {
    color: "#fff",
    fontWeight: "900",
  },
});