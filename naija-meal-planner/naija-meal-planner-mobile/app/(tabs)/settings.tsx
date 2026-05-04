import { router } from "expo-router";
import { useAppContext } from "../../context/AppContext";
import {
  ScrollView,
  View,
  Text,
  TextInput,
  Switch,
  Pressable,
  StyleSheet,
  Alert,
} from "react-native";

export default function Settings() {
  const {
  familySize,
  setFamilySize,
  region,
  showFruit,
  setShowFruit,
  showAppetizer,
  setShowAppetizer,
  planDays,
  setPlanDays,
  user,
  signOut,
  startDay,
setStartDay,
} = useAppContext();
  const saveSettings = () => {
    Alert.alert("Saved", "Your settings have been saved.");
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace("/signin");
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.subtitle}>Customize your meal planner.</Text>

      {user && (
        <View style={styles.card}>
          <Text style={styles.optionTitle}>{user.name}</Text>
          <Text style={styles.optionSub}>{user.email}</Text>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.label}>Family Size</Text>
        <TextInput
          style={styles.input}
          value={familySize}
          onChangeText={setFamilySize}
          keyboardType="numeric"
        />
        <Text style={styles.label}>Plan Days</Text>
<TextInput
  style={styles.input}
  value={planDays}
  onChangeText={setPlanDays}
  keyboardType="numeric"
  placeholder="e.g. 7, 14, 30"
/>
<Text style={styles.label}>Start Day</Text>
<TextInput
  style={styles.input}
  value={startDay}
  onChangeText={setStartDay}
  keyboardType="numeric"
  placeholder="e.g. 1, 8, 15"
/>

        <Text style={styles.label}>Detected Region</Text>

<View style={styles.detectedRegionBox}>
  <Text style={styles.detectedRegionText}>
    {region === "ng"
      ? "🇳🇬 Nigeria"
      : region === "ca"
      ? "🇨🇦 Canada"
      : "🇺🇸 United States"}
  </Text>
</View>
      </View>

      <View style={styles.card}>
        <View style={styles.switchRow}>
          <View>
            <Text style={styles.optionTitle}>Fruit Plan</Text>
            <Text style={styles.optionSub}>Separate fruit/snack from meals</Text>
          </View>

          <Switch value={showFruit} onValueChange={setShowFruit} />
        </View>

        <View style={styles.divider} />

        <View style={styles.switchRow}>
          <View>
            <Text style={styles.optionTitle}>Appetizer</Text>
            <Text style={styles.optionSub}>Add optional starter section</Text>
          </View>

          <Switch value={showAppetizer} onValueChange={setShowAppetizer} />
        </View>
      </View>

      <Pressable style={styles.saveBtn} onPress={saveSettings}>
        <Text style={styles.saveText}>Save Settings</Text>
      </Pressable>
<Pressable style={styles.proBtn} onPress={() => router.push("/paywall")}>
  <Text style={styles.proText}>🚀 Upgrade / Manage Pro</Text>
</Pressable>
      <Pressable style={styles.logoutBtn} onPress={handleSignOut}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingBottom: 120,
    backgroundColor: "#f4f8f5",
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    color: "#0f172a",
  },
  detectedRegionBox: {
  backgroundColor: "#ecfdf5",
  padding: 14,
  borderRadius: 14,
  marginBottom: 14,
},

detectedRegionText: {
  color: "#166534",
  fontWeight: "900",
  fontSize: 15,
},
  subtitle: {
    color: "#64748b",
    marginTop: 6,
    marginBottom: 18,
  },
  card: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 22,
    marginBottom: 16,
  },
  label: {
    fontWeight: "800",
    marginBottom: 6,
    color: "#0f172a",
  },
  input: {
    backgroundColor: "#f8fafc",
    padding: 14,
    borderRadius: 14,
    marginBottom: 14,
    fontSize: 15,
  },
  regionRow: {
    flexDirection: "row",
    gap: 10,
  },
  regionBtn: {
    flex: 1,
    padding: 13,
    borderRadius: 14,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
  },
  activeBtn: {
    backgroundColor: "#0f172a",
  },
  regionText: {
    fontWeight: "800",
    color: "#64748b",
  },
  activeText: {
    fontWeight: "900",
    color: "#fff",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "center",
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0f172a",
  },
  optionSub: {
    color: "#64748b",
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: "#e2e8f0",
    marginVertical: 16,
  },
  saveBtn: {
    backgroundColor: "#0f7a43",
    padding: 15,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  saveText: {
    color: "#fff",
    fontWeight: "900",
  },
  logoutBtn: {
    backgroundColor: "#fee2e2",
    padding: 15,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 40,
  },
  proBtn: {
  backgroundColor: "#7c3aed",
  padding: 15,
  borderRadius: 14,
  alignItems: "center",
  marginBottom: 12,
},

proText: {
  color: "#fff",
  fontWeight: "900",
},
  logoutText: {
    color: "#991b1b",
    fontWeight: "900",
  },
});