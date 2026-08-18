import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { apiFetch } from "../../utils/api";
import { getErrorMessage } from "../../utils/errorMessage";
import { useAppContext } from "../../context/AppContext";
import { useOnboarding } from "../../context/OnboardingContext";

export default function OnboardingComplete() {
  const { user, signIn, token } = useAppContext();

  const {
  familySize,
  age,
  region,
  state,
  city,
  countryCode,
  preferredMealCulture,
  preferredWellnessGoal,
  planDays,

  healthGoals,
  healthChallenges,
  dietaryPreferences,
  healthConditions,
  activityLevel,
  waterHabit,
  wantsMealTracking,
} = useOnboarding();

  const [saving, setSaving] = useState(false);

  const handleFinish = async () => {
    try {
      setSaving(true);

      const data = await apiFetch<{
  ok: boolean;
  user?: any;
  error?: string;
}>("/api/user/onboarding", {
  method: "POST",
  token,
  body: JSON.stringify({
    family_size: Number(familySize), 
       age: Number(age),
          region,
          state,
          city,
          country_code: countryCode,

          // Save preference for future use
          preferred_meal_culture: preferredMealCulture,
          preferred_wellness_goal: preferredWellnessGoal,

          // Keep actual active values GENERAL for free users
          meal_culture: "general",
          wellness_goal: "general",

          plan_days: Number(planDays),
          health_goals: healthGoals,
          health_challenges: healthChallenges,
          dietary_preferences: dietaryPreferences,
          health_conditions: healthConditions,
          activity_level: activityLevel,
          water_habit: waterHabit,
          wants_meal_tracking: wantsMealTracking,
        }),
      });

      if (!data.ok) {
        throw new Error(data.error || "Unable to save onboarding.");
      }

      if (data.user) {
        await signIn(token!, data.user);
      }

      router.replace("/(tabs)");
    } catch (err: any) {
      Alert.alert(
        "Onboarding failed",
        getErrorMessage(err)
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.step}>Review Setup</Text>

      <Text style={styles.title}>
        You're all set 🎉
      </Text>

      <Text style={styles.subtitle}>
        Review your information before creating your personalized meal experience.
      </Text>

      <View style={styles.card}>
        <SummaryRow
          label="Family Size"
          value={`${familySize} people`}
        />
      <SummaryRow
         label="Age"
          value={`${age} years`}
            />
        <SummaryRow
          label="Country"
          value={region.toUpperCase()}
        />

        <SummaryRow
          label="State"
          value={state}
        />

        <SummaryRow
          label="City"
          value={city}
        />

        <SummaryRow
          label="Food Preference"
          value={preferredMealCulture}
        />

        <SummaryRow
          label="Wellness Goal"
          value={preferredWellnessGoal}
        />
       <SummaryRow
  label="Health Goals"
  value={`${healthGoals.length} selected`}
/>

<SummaryRow
  label="Challenges"
  value={`${healthChallenges.length} selected`}
/>

<SummaryRow
  label="Diet Preferences"
  value={`${dietaryPreferences.length} selected`}
/>

<SummaryRow
  label="Conditions"
  value={`${healthConditions.length} selected`}
/>

<SummaryRow
  label="Activity"
  value={activityLevel}
/>

<SummaryRow
  label="Hydration"
  value={waterHabit}
/>

<SummaryRow
  label="Meal Tracking"
  value={wantsMealTracking ? "Enabled" : "Not now"}
/>
        <SummaryRow
          label="Plan Duration"
          value={`${planDays} days`}
        />
      </View>

      {/* <View style={styles.noteCard}>
        <Text style={styles.noteTitle}>
          Premium Preferences
        </Text>

        <Text style={styles.noteText}>
          Your food and wellness preferences are saved now.
          Meal generation will remain on General mode until you upgrade to Pro.
        </Text>
      </View> */}

      <View style={styles.navRow}>
        <Pressable
          style={styles.backBtn}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        <Pressable
          style={styles.finishBtn}
          onPress={handleFinish}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.finishText}>
              Finish Setup
            </Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>
        {label}
      </Text>

      <Text style={styles.rowValue}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#eef7f0",
  },

  content: {
    padding: 24,
    paddingTop: 80,
    paddingBottom: 60,
  },

  step: {
    color: "#15803d",
    fontWeight: "900",
    textTransform: "uppercase",
    marginBottom: 10,
  },

  title: {
    fontSize: 34,
    fontWeight: "900",
    color: "#0f172a",
  },

  subtitle: {
    color: "#64748b",
    marginTop: 10,
    lineHeight: 22,
    marginBottom: 22,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 26,
    padding: 20,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },

  rowLabel: {
    color: "#64748b",
    fontWeight: "800",
  },

  rowValue: {
    color: "#0f172a",
    fontWeight: "900",
    maxWidth: "55%",
    textAlign: "right",
  },

  noteCard: {
    backgroundColor: "#dcfce7",
    borderRadius: 22,
    padding: 18,
    marginTop: 18,
  },

  noteTitle: {
    color: "#166534",
    fontWeight: "900",
    marginBottom: 6,
  },

  noteText: {
    color: "#166534",
    lineHeight: 20,
  },

  navRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },

  backBtn: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 22,
    alignItems: "center",
  },

  backText: {
    color: "#0f172a",
    fontWeight: "900",
    fontSize: 16,
  },

  finishBtn: {
    flex: 1,
    backgroundColor: "#0f7a43",
    padding: 18,
    borderRadius: 22,
    alignItems: "center",
  },

  finishText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 16,
  },
});