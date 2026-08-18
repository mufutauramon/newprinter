import { router } from "expo-router";
import { useState } from "react";
import {
  ScrollView,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAppContext } from "../context/AppContext";

type Region = "ng" | "us" | "uk" | "ca" | "au";

const REGIONS: { code: Region; label: string }[] = [
  { code: "ng", label: "🇳🇬 Nigeria" },
  { code: "us", label: "🇺🇸 United States" },
  { code: "uk", label: "🇬🇧 United Kingdom" },
  { code: "ca", label: "🇨🇦 Canada" },
  { code: "au", label: "🇦🇺 Australia" },
];

export default function MealSettings() {
  const {
    familySize,
    setFamilySize,
    planDays,
    setPlanDays,
    startDay,
    setStartDay,
    region,
    setRegion,
  } = useAppContext();

  const [regionModalOpen, setRegionModalOpen] = useState(false);

  const selectedRegion =
    REGIONS.find((item) => item.code === region) || REGIONS[1];

  const saveSettings = () => {
    const days = Number(planDays);
    const fam = Number(familySize);

    if (!fam || fam < 1) {
      setFamilySize("1");
      Alert.alert("Updated", "Family size must be at least 1.");
      return;
    }

    if (!days || days < 1) {
      setPlanDays("1");
      Alert.alert("Updated", "Plan days must be at least 1.");
      return;
    }

    if (days > 30) {
      setPlanDays("30");
      Alert.alert("Updated", "Meal plan cannot be more than 30 days.");
      return;
    }

    Alert.alert("Saved", "Meal plan settings updated.");
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <Pressable style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={24} color="#0f172a" />
        <Text style={styles.backText}>More</Text>
      </Pressable>

      <Text style={styles.kicker}>Meal plan</Text>
      <Text style={styles.title}>Plan Settings</Text>
      <Text style={styles.subtitle}>
        Control family size, meal duration, region, and where your timetable starts.
      </Text>

      <View style={styles.card}>
        <Text style={styles.label}>Family Size</Text>
        <TextInput
          style={styles.input}
          value={String(familySize)}
          onChangeText={(v) => setFamilySize(v.replace(/[^0-9]/g, ""))}
          keyboardType="numeric"
          placeholder="1"
        />

        <View style={styles.twoCol}>
          <View style={styles.col}>
            <Text style={styles.label}>Plan Days</Text>
            <TextInput
              style={styles.input}
              value={String(planDays)}
              onChangeText={(v) => {
                const clean = v.replace(/[^0-9]/g, "");
                const num = Number(clean);

                if (!clean) {
                  setPlanDays("");
                  return;
                }

                setPlanDays(num > 30 ? "30" : clean);
              }}
              onBlur={() => {
                const num = Number(planDays);

                if (!planDays || num < 1) setPlanDays("1");
                if (num > 30) setPlanDays("30");
              }}
              keyboardType="numeric"
              placeholder="Max 30"
            />
          </View>

          <View style={styles.col}>
            <Text style={styles.label}>Start Day</Text>
            <TextInput
              style={styles.input}
              value={String(startDay)}
              onChangeText={(v) => setStartDay(v.replace(/[^0-9]/g, ""))}
              keyboardType="numeric"
              placeholder="1"
            />
          </View>
        </View>

        <Text style={styles.label}>Region</Text>
        <Text style={styles.helperText}>
          Choose manually if location access is denied or incorrect.
        </Text>

        <Pressable
          style={styles.dropdownBtn}
          onPress={() => setRegionModalOpen(true)}
        >
          <Text style={styles.dropdownText}>{selectedRegion.label}</Text>
          <Ionicons name="chevron-down" size={22} color="#166534" />
        </Pressable>
      </View>

      <Pressable style={styles.saveBtn} onPress={saveSettings}>
        <Text style={styles.saveText}>Save Settings</Text>
      </Pressable>

      <Modal
        visible={regionModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setRegionModalOpen(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setRegionModalOpen(false)}
        >
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>Select Region</Text>

            {REGIONS.map((item) => {
              const active = region === item.code;

              return (
                <Pressable
                  key={item.code}
                  style={[
                    styles.modalOption,
                    active && styles.modalOptionActive,
                  ]}
                  onPress={() => {
                    setRegion(item.code);
                    setRegionModalOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      active && styles.modalOptionTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#eef7f0",
  },
  content: {
    padding: 20,
    paddingTop: 55,
    paddingBottom: 160,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 20,
  },
  backText: {
    color: "#0f172a",
    fontWeight: "900",
    fontSize: 16,
  },
  kicker: {
    color: "#15803d",
    fontWeight: "900",
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  title: {
    fontSize: 34,
    fontWeight: "900",
    color: "#0f172a",
    letterSpacing: -1,
  },
  subtitle: {
    color: "#64748b",
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 30,
    padding: 22,
    shadowColor: "#0f172a",
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 3,
  },
  label: {
    fontSize: 13,
    color: "#334155",
    fontWeight: "900",
    marginBottom: 8,
  },
  helperText: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: "700",
    marginTop: -2,
    marginBottom: 12,
  },
  input: {
    backgroundColor: "#f6faf8",
    borderWidth: 1,
    borderColor: "#e4eee8",
    padding: 16,
    borderRadius: 20,
    fontSize: 17,
    color: "#0f172a",
    fontWeight: "800",
    marginBottom: 18,
  },
  twoCol: {
    flexDirection: "row",
    gap: 12,
  },
  col: {
    flex: 1,
  },
  dropdownBtn: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: "#ecfdf5",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dropdownText: {
    color: "#166534",
    fontWeight: "900",
    fontSize: 17,
  },
  saveBtn: {
    marginTop: 20,
    backgroundColor: "#0f7a43",
    padding: 18,
    borderRadius: 22,
    alignItems: "center",
  },
  saveText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 26,
    padding: 18,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0f172a",
    marginBottom: 14,
  },
  modalOption: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: "#f8fafc",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  modalOptionActive: {
    backgroundColor: "#dcfce7",
    borderColor: "#22c55e",
  },
  modalOptionText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#334155",
  },
  modalOptionTextActive: {
    color: "#166534",
  },
});