import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { router } from "expo-router";
import { useOnboarding } from "../../context/OnboardingContext";

const OPTIONS = [
  {
    id: "sedentary",
    title: "Sedentary",
    sub: "Mostly sitting, little movement",
    emoji: "🪑",
  },
  {
    id: "light",
    title: "Lightly active",
    sub: "Light walking or occasional movement",
    emoji: "🚶",
  },
  {
    id: "moderate",
    title: "Moderately active",
    sub: "Some exercise or regular movement",
    emoji: "🏃",
  },
  {
    id: "active",
    title: "Active",
    sub: "Frequent exercise or physical work",
    emoji: "💪",
  },
  {
    id: "very_active",
    title: "Very active",
    sub: "Intense exercise most days",
    emoji: "🔥",
  },
];

export default function ActivityScreen() {
  const { activityLevel, setActivityLevel } = useOnboarding();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.step}>Step 9 of 11</Text>

      <Text style={styles.title}>How active are you?</Text>

      <Text style={styles.subtitle}>
        This helps us personalize your health score, hydration target, and coach tips.
      </Text>

      <View style={styles.card}>
        {OPTIONS.map((item) => {
          const selected = activityLevel === item.id;

          return (
            <Pressable
              key={item.id}
              style={[styles.option, selected && styles.optionSelected]}
              onPress={() => setActivityLevel(item.id as any)}
            >
              <Text style={styles.emoji}>{item.emoji}</Text>

              <View style={{ flex: 1 }}>
                <Text style={[styles.optionTitle, selected && styles.optionTitleSelected]}>
                  {item.title}
                </Text>
                <Text style={styles.optionSub}>{item.sub}</Text>
              </View>

              <Text style={[styles.radio, selected && styles.radioSelected]}>
                {selected ? "●" : "○"}
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
          onPress={() => router.push("/onboarding/water-habit" as any)}
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
  optionTitle: {
    color: "#0f172a",
    fontWeight: "900",
    fontSize: 16,
  },
  optionTitleSelected: {
    color: "#166534",
  },
  optionSub: {
    color: "#64748b",
    fontWeight: "700",
    fontSize: 12,
    marginTop: 3,
    lineHeight: 18,
  },
  radio: {
    color: "#94a3b8",
    fontSize: 22,
    fontWeight: "900",
  },
  radioSelected: {
    color: "#16a34a",
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