import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { router } from "expo-router";
import { useOnboarding } from "../../context/OnboardingContext";

export default function MealTrackingScreen() {
  const { wantsMealTracking, setWantsMealTracking } = useOnboarding();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.step}>Step 11 of 11</Text>

      <Text style={styles.title}>Help Health Insights learn from you</Text>

      <Text style={styles.subtitle}>
        After each meal, mark what happened. Your health score, streak, coach tips,
        and weekly report become more accurate when you check in.
      </Text>

      <View style={styles.demoCard}>
        <TrackingRow
          emoji="✅"
          title="Ate"
          text="You ate the planned meal."
        />

        <TrackingRow
          emoji="🥄"
          title="Small"
          text="You ate a smaller portion."
        />

        <TrackingRow
          emoji="🍽️"
          title="Large"
          text="You ate a larger portion."
        />

        <TrackingRow
          emoji="❌"
          title="Skip"
          text="You skipped the meal."
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Will you track your meals?</Text>

        <Pressable
          style={[
            styles.choice,
            wantsMealTracking && styles.choiceSelected,
          ]}
          onPress={() => setWantsMealTracking(true)}
        >
          <Text
            style={[
              styles.choiceText,
              wantsMealTracking && styles.choiceTextSelected,
            ]}
          >
            Yes, remind me to check in
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.choice,
            !wantsMealTracking && styles.choiceSelected,
          ]}
          onPress={() => setWantsMealTracking(false)}
        >
          <Text
            style={[
              styles.choiceText,
              !wantsMealTracking && styles.choiceTextSelected,
            ]}
          >
            Maybe later
          </Text>
        </Pressable>
      </View>

      <View style={styles.tipCard}>
        <Text style={styles.tipTitle}>Why this matters</Text>
        <Text style={styles.tipText}>
          Health Insights uses your meal check-ins and water tracking to explain
          your score, suggest better actions, and show weekly progress.
        </Text>
      </View>

      <View style={styles.navRow}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        <Pressable
          style={styles.nextBtn}
          onPress={() => router.push("/onboarding/complete" as any)}
        >
          <Text style={styles.nextText}>Review Setup</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function TrackingRow({
  emoji,
  title,
  text,
}: {
  emoji: string;
  title: string;
  text: string;
}) {
  return (
    <View style={styles.trackingRow}>
      <Text style={styles.trackingEmoji}>{emoji}</Text>

      <View style={{ flex: 1 }}>
        <Text style={styles.trackingTitle}>{title}</Text>
        <Text style={styles.trackingText}>{text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#eef7f0" },
  content: { padding: 24, paddingTop: 70, paddingBottom: 60 },
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
  demoCard: {
    backgroundColor: "#fff",
    borderRadius: 28,
    padding: 18,
    gap: 14,
    marginBottom: 16,
  },
  trackingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#f8fafc",
    borderRadius: 18,
    padding: 14,
  },
  trackingEmoji: {
    fontSize: 24,
  },
  trackingTitle: {
    color: "#0f172a",
    fontWeight: "900",
    fontSize: 15,
  },
  trackingText: {
    color: "#64748b",
    fontWeight: "700",
    fontSize: 12,
    marginTop: 3,
    lineHeight: 17,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 28,
    padding: 18,
    marginBottom: 16,
  },
  cardTitle: {
    color: "#0f172a",
    fontWeight: "900",
    fontSize: 17,
    marginBottom: 12,
  },
  choice: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
  },
  choiceSelected: {
    backgroundColor: "#dcfce7",
    borderColor: "#22c55e",
  },
  choiceText: {
    color: "#64748b",
    fontWeight: "900",
    fontSize: 15,
  },
  choiceTextSelected: {
    color: "#166534",
  },
  tipCard: {
    backgroundColor: "#ecfdf5",
    borderRadius: 22,
    padding: 18,
  },
  tipTitle: {
    color: "#166534",
    fontWeight: "900",
    marginBottom: 6,
  },
  tipText: {
    color: "#166534",
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