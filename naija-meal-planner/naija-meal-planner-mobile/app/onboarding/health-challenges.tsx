import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { router } from "expo-router";
import { useOnboarding } from "../../context/OnboardingContext";

const OPTIONS = [
  { id: "skip_meals", title: "I skip meals", emoji: "⏰" },
  { id: "forget_water", title: "I forget to drink water", emoji: "💧" },
  { id: "too_much_snacking", title: "I snack too often", emoji: "🍪" },
  { id: "portion_control", title: "I struggle with portion control", emoji: "🍽️" },
  { id: "grocery_cost", title: "Grocery costs are too high", emoji: "💰" },
  { id: "meal_variety", title: "I need more meal variety", emoji: "🥘" },
  { id: "dont_know_what_to_cook", title: "I don’t know what to cook", emoji: "🤔" },
  { id: "nutrition_tracking", title: "I don’t track my nutrition", emoji: "📊" },
];

export default function HealthChallengesScreen() {
  const { healthChallenges, setHealthChallenges } = useOnboarding();

  const toggle = (id: string) => {
    if (healthChallenges.includes(id)) {
      setHealthChallenges(healthChallenges.filter((x) => x !== id));
    } else {
      setHealthChallenges([...healthChallenges, id]);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.step}>Step 6 of 11</Text>

      <Text style={styles.title}>What makes healthy eating difficult?</Text>

      <Text style={styles.subtitle}>
        Select all that apply. Your Health Coach will use this to suggest better daily actions.
      </Text>

      <View style={styles.card}>
        {OPTIONS.map((item) => {
          const selected = healthChallenges.includes(item.id);

          return (
            <Pressable
              key={item.id}
              style={[styles.option, selected && styles.optionSelected]}
              onPress={() => toggle(item.id)}
            >
              <Text style={styles.emoji}>{item.emoji}</Text>

              <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                {item.title}
              </Text>

              <Text style={[styles.check, selected && styles.checkSelected]}>
                {selected ? "✓" : "+"}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.navRow}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        <Pressable
          style={styles.nextBtn}
          onPress={() => router.push("/onboarding/dietary-preferences" as any)}
        >
          <Text style={styles.nextText}>Continue</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#eef7f0" },
  content: { padding: 24, paddingTop: 80, paddingBottom: 60 },
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
    lineHeight: 40,
  },
  subtitle: {
    color: "#64748b",
    fontSize: 16,
    lineHeight: 24,
    marginTop: 12,
    marginBottom: 22,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 28,
    padding: 16,
    gap: 12,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 20,
    padding: 16,
  },
  optionSelected: {
    backgroundColor: "#dcfce7",
    borderColor: "#22c55e",
  },
  emoji: { fontSize: 22, marginRight: 12 },
  optionText: {
    flex: 1,
    color: "#0f172a",
    fontWeight: "900",
    fontSize: 15,
  },
  optionTextSelected: { color: "#166534" },
  check: {
    color: "#94a3b8",
    fontWeight: "900",
    fontSize: 18,
  },
  checkSelected: { color: "#16a34a" },
  navRow: { flexDirection: "row", gap: 12, marginTop: 20 },
  backBtn: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 22,
    alignItems: "center",
  },
  backText: { color: "#0f172a", fontWeight: "900", fontSize: 16 },
  nextBtn: {
    flex: 1,
    backgroundColor: "#0f7a43",
    padding: 18,
    borderRadius: 22,
    alignItems: "center",
  },
  nextText: { color: "#fff", fontWeight: "900", fontSize: 16 },
});