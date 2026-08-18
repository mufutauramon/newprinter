import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { useOnboarding } from "../../context/OnboardingContext";

export default function OnboardingDuration() {
  const { planDays, setPlanDays } = useOnboarding();

  const options = [
    {
      key: "7",
      title: "7 days",
      sub: "Quick weekly plan",
    },
    {
      key: "14",
      title: "14 days",
      sub: "Two-week family plan",
    },
    {
      key: "30",
      title: "30 days",
      sub: "Full monthly plan",
    },
  ];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.step}>Step 4 of 11</Text>
      <Text style={styles.title}>How long should your plan be?</Text>
      <Text style={styles.subtitle}>
        You can change this later in meal settings.
      </Text>

      <View style={styles.card}>
        {options.map((item) => {
          const active = planDays === item.key;

          return (
            <Pressable
              key={item.key}
              style={[styles.option, active && styles.optionActive]}
              onPress={() => setPlanDays(item.key)}
            >
              <View>
                <Text
                  style={[
                    styles.optionTitle,
                    active && styles.optionTitleActive,
                  ]}
                >
                  {item.title}
                </Text>

                <Text style={styles.optionSub}>{item.sub}</Text>
              </View>

              <Text style={[styles.radio, active && styles.radioActive]}>
                {active ? "●" : "○"}
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
          style={styles.btn}
          onPress={() => router.push("/onboarding/health-goals" as any)}
        >
          <Text style={styles.btnText}>Continue</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#eef7f0" },
  content: { padding: 24, paddingTop: 80, paddingBottom: 50 },
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
    fontSize: 15,
    lineHeight: 22,
    marginTop: 10,
    marginBottom: 24,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 26,
    padding: 18,
    marginBottom: 20,
  },
  option: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  optionActive: {
    backgroundColor: "#dcfce7",
    borderColor: "#22c55e",
  },
  optionTitle: {
    color: "#0f172a",
    fontWeight: "900",
    fontSize: 17,
  },
  optionTitleActive: {
    color: "#166534",
  },
  optionSub: {
    color: "#64748b",
    fontWeight: "700",
    marginTop: 4,
  },
  radio: {
    color: "#94a3b8",
    fontSize: 22,
    fontWeight: "900",
  },
  radioActive: {
    color: "#16a34a",
  },
  navRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
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
  btn: {
    flex: 1,
    backgroundColor: "#0f7a43",
    padding: 18,
    borderRadius: 22,
    alignItems: "center",
  },
  btnText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 16,
  },
});