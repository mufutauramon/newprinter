import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Modal,
} from "react-native";
import { router } from "expo-router";
import { useOnboarding } from "../../context/OnboardingContext";

type MealCulture = "general" | "yoruba" | "hausa" | "igbo";
type WellnessGoal =
  | "general"
  | "weight_loss"
  | "blood_pressure"
  | "diabetes"
  | "ulcer"
  | "heart_health";

const CULTURES: { key: MealCulture; label: string; sub: string }[] = [
  { key: "general", label: "General", sub: "Mixed everyday meals" },
  { key: "yoruba", label: "Yoruba", sub: "Amala, Ewedu, Ofada, Efo Riro" },
  { key: "hausa", label: "Hausa", sub: "Tuwo, Masa, Koko, Miyan Kuka" },
  { key: "igbo", label: "Igbo", sub: "Oha, Nsala, Abacha, Onugbu" },
];

const WELLNESS: { key: WellnessGoal; label: string; sub: string }[] = [
  { key: "general", label: "General", sub: "Balanced family meals" },
  { key: "weight_loss", label: "Weight Loss", sub: "Lighter meal choices" },
  { key: "blood_pressure", label: "Blood Pressure", sub: "Less fried/salty meals" },
  { key: "diabetes", label: "Diabetes", sub: "Lower sugar meal choices" },
  { key: "ulcer", label: "Ulcer", sub: "Gentler, less spicy options" },
  { key: "heart_health", label: "Heart Health", sub: "Heart-conscious meal choices" },
];

export default function OnboardingPreferences() {
  const {
    preferredMealCulture,
    setPreferredMealCulture,
    preferredWellnessGoal,
    setPreferredWellnessGoal,
  } = useOnboarding();

  const [picker, setPicker] = useState<"culture" | "wellness" | null>(null);

  const selectedCulture =
    CULTURES.find((x) => x.key === preferredMealCulture) || CULTURES[0];

  const selectedWellness =
    WELLNESS.find((x) => x.key === preferredWellnessGoal) || WELLNESS[0];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.step}>Step 3 of 11</Text>

      <Text style={styles.title}>What do you prefer?</Text>

      <Text style={styles.subtitle}>
        Tell us what you like. We will save your preference and personalize more
        when Pro features are active.
      </Text>

      <View style={styles.card}>
        <Text style={styles.label}>Food Preference</Text>

        <Pressable style={styles.selectBtn} onPress={() => setPicker("culture")}>
          <View style={{ flex: 1 }}>
            <Text style={styles.selectText}>{selectedCulture.label}</Text>
            <Text style={styles.selectSub}>{selectedCulture.sub}</Text>
          </View>

          <Text style={styles.chevron}>⌄</Text>
        </Pressable>

        <Text style={styles.label}>Wellness Goal</Text>

        <Pressable style={styles.selectBtn} onPress={() => setPicker("wellness")}>
          <View style={{ flex: 1 }}>
            <Text style={styles.selectText}>{selectedWellness.label}</Text>
            <Text style={styles.selectSub}>{selectedWellness.sub}</Text>
          </View>

          <Text style={styles.chevron}>⌄</Text>
        </Pressable>
      </View>

      <View style={styles.navRow}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        <Pressable
          style={styles.btn}
          onPress={() => router.push("/onboarding/duration" as any)}
        >
          <Text style={styles.btnText}>Continue</Text>
        </Pressable>
      </View>

      <Modal visible={!!picker} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              Select {picker === "culture" ? "Food Preference" : "Wellness Goal"}
            </Text>

            <ScrollView style={{ maxHeight: 420 }}>
              {picker === "culture" &&
                CULTURES.map((item) => (
                  <Pressable
                    key={item.key}
                    style={[
                      styles.modalOption,
                      preferredMealCulture === item.key && styles.modalOptionActive,
                    ]}
                    onPress={() => {
                      setPreferredMealCulture(item.key);
                      setPicker(null);
                    }}
                  >
                    <Text style={styles.modalText}>{item.label}</Text>
                    <Text style={styles.modalSub}>{item.sub}</Text>
                  </Pressable>
                ))}

              {picker === "wellness" &&
                WELLNESS.map((item) => (
                  <Pressable
                    key={item.key}
                    style={[
                      styles.modalOption,
                      preferredWellnessGoal === item.key && styles.modalOptionActive,
                    ]}
                    onPress={() => {
                      setPreferredWellnessGoal(item.key);
                      setPicker(null);
                    }}
                  >
                    <Text style={styles.modalText}>{item.label}</Text>
                    <Text style={styles.modalSub}>{item.sub}</Text>
                  </Pressable>
                ))}
            </ScrollView>

            <Pressable style={styles.cancelBtn} onPress={() => setPicker(null)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#eef7f0" },
  content: { padding: 24, paddingTop: 70, paddingBottom: 50 },
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
    marginBottom: 22,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 28,
    padding: 20,
    marginBottom: 20,
  },
  label: {
    color: "#334155",
    fontWeight: "900",
    fontSize: 15,
    marginBottom: 8,
    marginTop: 12,
  },
  selectBtn: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 22,
    padding: 17,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectText: {
    color: "#0f172a",
    fontWeight: "900",
    fontSize: 17,
  },
  selectSub: {
    color: "#64748b",
    fontWeight: "700",
    marginTop: 4,
    lineHeight: 18,
  },
  chevron: {
    color: "#15803d",
    fontWeight: "900",
    fontSize: 24,
    marginLeft: 12,
  },
  navRow: { flexDirection: "row", gap: 12 },
  backBtn: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 22,
    alignItems: "center",
  },
  backText: { color: "#0f172a", fontWeight: "900", fontSize: 16 },
  btn: {
    flex: 1,
    backgroundColor: "#0f7a43",
    padding: 18,
    borderRadius: 22,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "900", fontSize: 16 },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.45)",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 28,
    padding: 18,
  },
  modalTitle: {
    color: "#0f172a",
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 12,
  },
  modalOption: {
    padding: 15,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
    marginBottom: 10,
  },
  modalOptionActive: {
    backgroundColor: "#dcfce7",
    borderColor: "#22c55e",
  },
  modalText: {
    color: "#0f172a",
    fontWeight: "900",
    fontSize: 16,
  },
  modalSub: {
    color: "#64748b",
    fontWeight: "700",
    marginTop: 4,
  },
  cancelBtn: {
    marginTop: 8,
    backgroundColor: "#f1f5f9",
    padding: 16,
    borderRadius: 18,
    alignItems: "center",
  },
  cancelText: {
    color: "#0f172a",
    fontWeight: "900",
  },
});