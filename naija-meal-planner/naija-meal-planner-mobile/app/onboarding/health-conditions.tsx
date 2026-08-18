import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { router } from "expo-router";
import { useOnboarding } from "../../context/OnboardingContext";

const OPTIONS = [
  { id: "none", title: "None", emoji: "✅" },
  { id: "diabetes", title: "Diabetes", emoji: "🩺" },
  { id: "high_blood_pressure", title: "High Blood Pressure", emoji: "❤️" },
  { id: "high_cholesterol", title: "High Cholesterol", emoji: "🥑" },
  { id: "kidney_disease", title: "Kidney Disease", emoji: "💧" },
  { id: "food_allergies", title: "Food Allergies", emoji: "⚠️" },
  { id: "pregnancy", title: "Pregnancy", emoji: "🤰" },
];

export default function HealthConditionsScreen() {
  const { healthConditions, setHealthConditions } = useOnboarding();

  const toggle = (id: string) => {
    if (id === "none") {
      setHealthConditions(["none"]);
      return;
    }

    let updated = healthConditions.filter((x) => x !== "none");

    if (updated.includes(id)) {
      updated = updated.filter((x) => x !== id);
    } else {
      updated.push(id);
    }

    setHealthConditions(updated.length ? updated : ["none"]);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.step}>Step 8 of 11</Text>

      <Text style={styles.title}>Any health conditions to consider?</Text>

      <Text style={styles.subtitle}>
        Select all that apply. This helps us make your insights more helpful.
      </Text>

      <View style={styles.card}>
        {OPTIONS.map((item) => {
          const selected = healthConditions.includes(item.id);

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

      <View style={styles.noteCard}>
        <Text style={styles.noteTitle}>Important</Text>
        <Text style={styles.noteText}>
          These insights are for meal planning support only and do not replace medical advice.
        </Text>
      </View>

      <View style={styles.navRow}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        <Pressable
          style={styles.nextBtn}
          onPress={() => router.push("/onboarding/activity" as any)}
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
  noteCard: {
    backgroundColor: "#fff7ed",
    borderWidth: 1,
    borderColor: "#fed7aa",
    borderRadius: 22,
    padding: 16,
    marginTop: 16,
  },
  noteTitle: {
    color: "#9a3412",
    fontWeight: "900",
    marginBottom: 5,
  },
  noteText: {
    color: "#9a3412",
    fontWeight: "700",
    lineHeight: 20,
  },
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