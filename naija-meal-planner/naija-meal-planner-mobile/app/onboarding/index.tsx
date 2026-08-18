import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { useOnboarding } from "../../context/OnboardingContext";
import { TextInput } from "react-native";
export default function OnboardingFamily() {
const { familySize, setFamilySize, age, setAge } = useOnboarding();
  const options = ["1", "2", "3", "4", "5", "6", "7", "8"];
 const AGE_OPTIONS = Array.from({ length: 83 }, (_, i) => String(i + 18));
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.step}>Step 1 of 11</Text>
      <Text style={styles.title}>How many people are you cooking for?</Text>
      <Text style={styles.subtitle}>
        This helps us estimate portions, grocery quantity, and budget.
      </Text>
      <Text style={styles.ageLabel}>How old are you?</Text>

<TextInput
  style={styles.ageInput}
  value={age}
  onChangeText={setAge}
  placeholder="Enter your age"
  keyboardType="numeric"
  maxLength={3}
/>

      <View style={styles.grid}>
        {options.map((item) => {
          const active = familySize === item;

          return (
            <Pressable
              key={item}
              style={[styles.option, active && styles.optionActive]}
              onPress={() => setFamilySize(item)}
            >
              <Text style={[styles.optionText, active && styles.optionTextActive]}>
                {item}
              </Text>
              <Text style={[styles.optionSub, active && styles.optionTextActive]}>
                {item === "1" ? "person" : "people"}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
  style={[
    styles.btn,
    (!familySize || !age) && { opacity: 0.5 }
  ]}
  disabled={!familySize || !age}
  onPress={() => router.push("/onboarding/location" as any)}
>
        <Text style={styles.btnText}>Continue</Text>
      </Pressable>
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
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  option: {
    width: "47%",
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
  },
  optionActive: {
    backgroundColor: "#dcfce7",
    borderColor: "#22c55e",
  },
  optionText: {
    color: "#0f172a",
    fontSize: 28,
    fontWeight: "900",
  },
  optionSub: {
    color: "#64748b",
    fontWeight: "800",
    marginTop: 4,
  },
  optionTextActive: {
    color: "#166534",
  },
  btn: {
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
  ageLabel: {
  fontSize: 18,
  fontWeight: "800",
  color: "#0f172a",
  marginBottom: 10,
},

ageInput: {
  backgroundColor: "#fff",
  borderWidth: 1,
  borderColor: "#d1d5db",
  borderRadius: 16,
  padding: 16,
  fontSize: 18,
  marginBottom: 24,
},
});