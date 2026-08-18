import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { router } from "expo-router";
import { useOnboarding } from "../../context/OnboardingContext";

const OPTIONS = [
  {
    id: "less_than_2",
    title: "Less than 2 glasses",
    emoji: "🥵",
    sub: "I rarely drink water",
  },
  {
    id: "three_to_four",
    title: "3–4 glasses",
    emoji: "🙂",
    sub: "I drink some water daily",
  },
  {
    id: "five_to_seven",
    title: "5–7 glasses",
    emoji: "💧",
    sub: "I'm usually hydrated",
  },
  {
    id: "eight_plus",
    title: "8+ glasses",
    emoji: "🏆",
    sub: "Hydration is already a habit",
  },
];

export default function WaterHabitScreen() {
  const { waterHabit, setWaterHabit } = useOnboarding();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.step}>Step 10 of 11</Text>

      <Text style={styles.title}>
        How much water do you drink?
      </Text>

      <Text style={styles.subtitle}>
        We'll use this to create hydration goals and reminders.
      </Text>

      <View style={styles.card}>
        {OPTIONS.map((item) => {
          const selected = waterHabit === item.id;

          return (
            <Pressable
              key={item.id}
              style={[
                styles.option,
                selected && styles.optionSelected,
              ]}
              onPress={() => setWaterHabit(item.id as any)}
            >
              <Text style={styles.emoji}>
                {item.emoji}
              </Text>

              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.optionTitle,
                    selected &&
                      styles.optionTitleSelected,
                  ]}
                >
                  {item.title}
                </Text>

                <Text style={styles.optionSub}>
                  {item.sub}
                </Text>
              </View>

              <Text
                style={[
                  styles.radio,
                  selected &&
                    styles.radioSelected,
                ]}
              >
                {selected ? "●" : "○"}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.tipCard}>
        <Text style={styles.tipTitle}>
          💡 Health Tip
        </Text>

        <Text style={styles.tipText}>
          People who consistently hit their water goals
          tend to maintain better eating habits and
          higher energy levels.
        </Text>
      </View>

      <View style={styles.navRow}>
        <Pressable
          style={styles.backBtn}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>
            Back
          </Text>
        </Pressable>

        <Pressable
          style={styles.nextBtn}
          onPress={() =>
            router.push(
              "/onboarding/meal-tracking" as any
            )
          }
        >
          <Text style={styles.nextText}>
            Continue
          </Text>
        </Pressable>
      </View>
    </ScrollView>
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

  emoji: {
    fontSize: 22,
    marginRight: 12,
  },

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
  },

  radio: {
    color: "#94a3b8",
    fontSize: 22,
    fontWeight: "900",
  },

  radioSelected: {
    color: "#16a34a",
  },

  tipCard: {
    backgroundColor: "#dbeafe",
    borderRadius: 22,
    padding: 18,
    marginTop: 18,
  },

  tipTitle: {
    color: "#1e3a8a",
    fontWeight: "900",
    marginBottom: 6,
  },

  tipText: {
    color: "#1e40af",
    lineHeight: 20,
    fontWeight: "700",
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

  nextBtn: {
    flex: 1,
    backgroundColor: "#0f7a43",
    padding: 18,
    borderRadius: 22,
    alignItems: "center",
  },

  nextText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 16,
  },
});