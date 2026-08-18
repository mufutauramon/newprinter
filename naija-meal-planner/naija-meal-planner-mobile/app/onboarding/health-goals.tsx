import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { router } from "expo-router";
import { useOnboarding } from "../../context/OnboardingContext";

const OPTIONS = [
  { id: "lose_weight", title: "Lose weight", emoji: "⚖️" },
  { id: "maintain_weight", title: "Maintain weight", emoji: "✅" },
  { id: "gain_weight", title: "Gain weight", emoji: "📈" },
  { id: "build_muscle", title: "Build muscle", emoji: "💪" },
  { id: "eat_healthier", title: "Eat healthier", emoji: "🥗" },
  { id: "improve_hydration", title: "Improve hydration", emoji: "💧" },
  { id: "reduce_sugar", title: "Reduce sugar intake", emoji: "🍬" },
  { id: "more_energy", title: "Improve energy", emoji: "⚡" },
  { id: "meal_consistency", title: "Better meal consistency", emoji: "📅" },
  { id: "family_health", title: "Feed my family healthier meals", emoji: "👨‍👩‍👧" },
];

export default function HealthGoalsScreen() {
  const { healthGoals, setHealthGoals } = useOnboarding();

  const toggle = (id: string) => {
    if (healthGoals.includes(id)) {
      setHealthGoals(healthGoals.filter((x) => x !== id));
    } else {
      setHealthGoals([...healthGoals, id]);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.step}>Step 5 of 11</Text>

      <Text style={styles.title}>What are your health goals?</Text>

      <Text style={styles.subtitle}>
        Select all that apply. We will use this to make your Health Insights feel more personal.
      </Text>

      <View style={styles.card}>
        {OPTIONS.map((item) => {
          const selected = healthGoals.includes(item.id);

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
          onPress={() => router.push("/onboarding/health-challenges" as any)}
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