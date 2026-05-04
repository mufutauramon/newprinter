import { useState } from "react";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { router } from "expo-router";
import { useAppContext } from "../../context/AppContext";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Modal,
  Linking,
  Image,
} from "react-native";

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

const initialMeals = Array.from({ length: 30 }, (_, index) => {
  const meal = weeklyMeals[index % weeklyMeals.length];

  return {
    day: index + 1,
    ...meal,
  };
});
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
} = useAppContext();
const [selectedMeal, setSelectedMeal] = useState<any>(null);
  const [generating, setGenerating] = useState(false);
  const [recipeMeal, setRecipeMeal] = useState("");
const [recipeGuide, setRecipeGuide] = useState<any>(null);
const [recipeLoading, setRecipeLoading] = useState(false);
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
const openRecipeGuide = async (mealName: string) => {
  if (!isPro) {
  router.push("/paywall");
  return;
}
  try {
    setRecipeMeal(mealName);
    setRecipeGuide(null);
    setRecipeLoading(true);
 
    const res = await fetch("http://10.0.2.2:8787/api/ai/meal-guide", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        meal: mealName,
        region,
      }),
    });

    const data = await res.json();

    if (!data.ok) {
      throw new Error(data.error || "Could not load recipe");
    }

    setRecipeGuide(data);
  } catch (err: any) {
    alert(err.message || "Could not load recipe");
  } finally {
    setRecipeLoading(false);
  }
};
const generateAIMealPlan = async () => {
  if (!isPro) {
  router.push("/paywall");
  return;
}
  try {
    setGenerating(true);

    const res = await fetch("http://10.0.2.2:8787/api/ai/generate-meal-plan", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        days: Number(planDays) || 30,
        familySize: Number(familySize) || 5,
        region,
        style: "low budget Nigerian meals with U.S. alternatives",
      }),
    });

    const data = await res.json();

    if (!data.ok || !Array.isArray(data.meals)) {
      throw new Error(data.error || "Failed to generate meal plan");
    }

    const start = Math.max(1, Number(startDay) || 1);

const generatedMeals = data.meals.map((meal: any, index: number) => ({
  ...meal,
  day: start + index,
}));

const updatedMeals = meals.map((meal) => {
  const replacement = generatedMeals.find((m: any) => m.day === meal.day);
  return replacement ? replacement : meal;
});

setMeals(updatedMeals);

    setTimeout(() => {
      saveMealPlan();
      refreshAIGroceries();
    }, 300);
  } catch (err: any) {
    alert(err.message || "Could not generate meal plan");
  } finally {
    setGenerating(false);
  }
};
const downloadMealPlan = async () => {
  const html = `
    <html>
      <body style="font-family: Arial; padding: 24px;">
        <h1>30-Day Meal Plan</h1>
        <table style="width:100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="border:1px solid #ddd; padding:8px;">Day</th>
              <th style="border:1px solid #ddd; padding:8px;">Breakfast</th>
              <th style="border:1px solid #ddd; padding:8px;">Lunch</th>
              <th style="border:1px solid #ddd; padding:8px;">Dinner</th>
              <th style="border:1px solid #ddd; padding:8px;">Fruit</th>
            </tr>
          </thead>
          <tbody>
            ${visibleMeals
              .map(
                (meal) => `
                  <tr>
                    <td style="border:1px solid #ddd; padding:8px;">${meal.day}</td>
                    <td style="border:1px solid #ddd; padding:8px;">${meal.breakfast}</td>
                    <td style="border:1px solid #ddd; padding:8px;">${meal.lunch}</td>
                    <td style="border:1px solid #ddd; padding:8px;">${meal.dinner}</td>
                    <td style="border:1px solid #ddd; padding:8px;">${meal.fruit}</td>
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

  return (
    <ScrollView
  style={styles.container}
  contentContainerStyle={styles.content}
>
      <Text style={styles.title}>Meal Timetable</Text>
      <Text style={styles.subtitle}>
        Tap any day to edit breakfast, lunch, dinner, or fruit.
      </Text>
      <Pressable style={styles.downloadBtn} onPress={downloadMealPlan}>
      <Text style={styles.downloadText}>⬇️ Download Meal Plan PDF</Text>
      </Pressable>
      <Pressable style={styles.savePlanBtn} onPress={saveMealPlan}>
  <Text style={styles.savePlanText}>
    {mealPlanSaving ? "Saving..." : "💾 Save Meal Plan"}
  </Text>
</Pressable>
<Pressable style={styles.aiBtn} onPress={generateAIMealPlan}>
  <Text style={styles.aiText}>
    {generating ? "Generating..." : "🤖 Generate AI Meal Plan"}
  </Text>
</Pressable>

      {visibleMeals.map((meal) => (
        <View key={meal.day} style={styles.mealCard}>
          <View style={styles.dayRow}>
  <Text style={styles.day}>Day {meal.day}</Text>

  <Pressable onPress={() => setSelectedMeal(meal)}>
    <Text style={styles.editLink}>Edit</Text>
  </Pressable>
</View>
          <View style={styles.mealLine}>
  <Text style={styles.mealText}>🍳 {meal.breakfast}</Text>
  <Pressable
  style={styles.recipeBtn}
  hitSlop={12}
  onPress={() => openRecipeGuide(meal.breakfast)}
>
  <Text style={styles.recipeLink}>Recipe</Text>
</Pressable>
</View>

<View style={styles.mealLine}>
  <Text style={styles.mealText}>🍛 {meal.lunch}</Text>
  <Pressable
  style={styles.recipeBtn}
  hitSlop={12}
  onPress={() => openRecipeGuide(meal.lunch)}
>
  <Text style={styles.recipeLink}>Recipe</Text>
</Pressable>
</View>

<View style={styles.mealLine}>
  <Text style={styles.mealText}>🍲 {meal.dinner}</Text>
 <Pressable
  style={styles.recipeBtn}
  hitSlop={12}
  onPress={() => openRecipeGuide(meal.dinner)}
>
  <Text style={styles.recipeLink}>Recipe</Text>
</Pressable>
</View>
          {showFruit && meal.fruit && (
  <Text style={styles.fruitText}>🍎 {meal.fruit}</Text>
)}
        </View>
      ))}

      <Modal visible={!!selectedMeal} animationType="slide">
        {selectedMeal && (
          <View style={styles.modalContainer}>
            <Text style={styles.title}>Edit Day {selectedMeal.day}</Text>

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
            <Pressable style={styles.saveBtn} onPress={saveMeal}>
              <Text style={styles.saveText}>Save Meal</Text>
            </Pressable>

            <Pressable
              style={styles.cancelBtn}
              onPress={() => setSelectedMeal(null)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        )}
      </Modal>
      <Modal visible={!!recipeMeal} animationType="slide">
  <ScrollView style={styles.modalContainer}>
    <Text style={styles.title}>{recipeMeal}</Text>
 {recipeGuide?.image_url && (
  <Image
    source={{ uri: recipeGuide.image_url }}
    style={styles.recipeImage}
    resizeMode="cover"
    onError={(e) => {
      console.log("Image failed:", e.nativeEvent.error);
      console.log("Image URL:", recipeGuide.image_url);
    }}
  />
)}
    {recipeLoading && (
      <Text style={styles.subtitle}>🤖 AI is preparing your recipe...</Text>
    )}

    {!recipeLoading && recipeGuide && (
      <>
        <Text style={styles.recipeDescription}>
          {recipeGuide.description}
        </Text>

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

        {recipeGuide.video_url && (
          <Pressable
            style={styles.videoBtn}
            onPress={() => Linking.openURL(recipeGuide.video_url)}
          >
            <Text style={styles.videoText}>▶️ Watch Video Tutorial</Text>
          </Pressable>
        )}
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f8f5",
  },
  content: {
  padding: 20,
  paddingBottom: 140,
},
dayRow: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 10,
},

editLink: {
  color: "#0f7a43",
  fontWeight: "900",
  fontSize: 13,
},
  title: {
    fontSize: 26,
    fontWeight: "900",
    marginBottom: 6,
    color: "#0f172a",
  },
  subtitle: {
    color: "#64748b",
    marginBottom: 18,
    fontSize: 15,
  },
  mealCard: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 22,
    marginBottom: 14,
  },
  day: {
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 10,
    color: "#0f172a",
  },
  mealText: {
    fontSize: 15,
    marginBottom: 8,
    color: "#334155",
  },
  recipeImage: {
  width: "100%",
  height: 220,
  borderRadius: 22,
  marginBottom: 16,
  backgroundColor: "#e2e8f0",
},
  fruitText: {
    fontSize: 15,
    marginTop: 4,
    color: "#0f7a43",
    fontWeight: "700",
  },
  modalContainer: {
    flex: 1,
    padding: 22,
    backgroundColor: "#f4f8f5",
  },
  label: {
    fontWeight: "800",
    marginBottom: 6,
    color: "#0f172a",
  },
  input: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 14,
    marginBottom: 14,
    fontSize: 15,
  },
  recipeBtn: {
  backgroundColor: "#ecfdf5",
  paddingVertical: 6,
  paddingHorizontal: 12,
  borderRadius: 12,
},
  saveBtn: {
    backgroundColor: "#0f7a43",
    padding: 15,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 10,
  },
  saveText: {
    color: "#fff",
    fontWeight: "900",
  },
  cancelBtn: {
    backgroundColor: "#e2e8f0",
    padding: 15,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 10,
  },
  downloadBtn: {
  backgroundColor: "#0f7a43",
  padding: 14,
  borderRadius: 16,
  alignItems: "center",
  marginBottom: 16,
},
savePlanBtn: {
  backgroundColor: "#0f172a",
  padding: 14,
  borderRadius: 16,
  alignItems: "center",
  marginBottom: 16,
},

savePlanText: {
  color: "#fff",
  fontWeight: "900",
},
downloadText: {
  color: "#fff",
  fontWeight: "900",
},
aiBtn: {
  backgroundColor: "#7c3aed",
  padding: 14,
  borderRadius: 16,
  alignItems: "center",
  marginBottom: 16,
},

aiText: {
  color: "#fff",
  fontWeight: "900",
},
mealLine: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 10,
  marginBottom: 8,
},

recipeLink: {
  color: "#0f7a43",
  fontWeight: "900",
  fontSize: 13,
},

recipeDescription: {
  color: "#475569",
  fontSize: 15,
  lineHeight: 22,
  marginBottom: 16,
},

recipeCard: {
  backgroundColor: "#fff",
  padding: 16,
  borderRadius: 18,
  marginBottom: 14,
},

recipeSectionTitle: {
  fontSize: 17,
  fontWeight: "900",
  color: "#0f172a",
  marginBottom: 8,
},

recipeItem: {
  color: "#334155",
  marginBottom: 8,
  lineHeight: 21,
},

videoBtn: {
  backgroundColor: "#dc2626",
  padding: 15,
  borderRadius: 14,
  alignItems: "center",
  marginBottom: 12,
},

videoText: {
  color: "#fff",
  fontWeight: "900",
},
  cancelText: {
    color: "#0f172a",
    fontWeight: "900",
  },
});