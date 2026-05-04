import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useAppContext } from "../../context/AppContext";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
export default function Home() {
const { familySize, region, monthlyBudget, showFruit, showAppetizer, startDay,
planDays, } =
  useAppContext();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.badge}>Naija Meal Planner</Text>
        <Text style={styles.title}>Plan better meals for your family</Text>
        <Text style={styles.subtitle}>
          Track meals, grocery prices, fruits, and budget in one place.
        </Text>
      </View>

      <View style={styles.grid}>
        <View style={styles.card}>
          <Text style={styles.icon}>📅</Text>
          <Text style={styles.label}>Meal Plan</Text>
          <Text style={styles.value}>{planDays} Days</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.icon}>👨‍👩‍👧‍👦</Text>
          <Text style={styles.label}>Family Size</Text>
          <Text style={styles.value}>{familySize} People</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.icon}>💰</Text>
          <Text style={styles.label}>Budget</Text>
          <Text style={styles.value}>{monthlyBudget}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.icon}>🌍</Text>
          <Text style={styles.label}>Region</Text>
          <Text style={styles.value}>{region === "ng" ? "Nigeria" : region === "ca" ? "Canada" : "U.S."}</Text>
        </View>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Current Plan</Text>
        <Text style={styles.planText}>🍽️ Main meals: Breakfast, Lunch, Dinner</Text>
        <Text style={styles.planText}>
          🍎 Fruit plan: {showFruit ? "Enabled" : "Disabled"}
        </Text>
        <Text style={styles.planText}>
          🥗 Appetizer: {showAppetizer ? "Enabled" : "Disabled"}
        </Text>
      </View>

      <View style={styles.tipBox}>
        <Text style={styles.tipTitle}>Smart Tip</Text>
        <Text style={styles.tipText}>
          Update prices in the Prices tab. Your grocery budget will become more accurate for your location.
        </Text>
      </View>
    </ScrollView>
  );
}
<Ionicons name="home" size={30} color="red" />

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f8f5",
    padding: 20,
    paddingBottom: 120,
  },
  hero: {
    backgroundColor: "#062417",
    padding: 24,
    borderRadius: 28,
    marginBottom: 18,
  },
  badge: {
    color: "#bbf7d0",
    fontWeight: "800",
    marginBottom: 10,
  },
  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "900",
    lineHeight: 34,
  },
  subtitle: {
    color: "#d1fae5",
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  card: {
    width: "48%",
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 22,
    minHeight: 135,
  },
  icon: {
    fontSize: 26,
    marginBottom: 14,
  },
  label: {
    color: "#64748b",
    fontWeight: "700",
  },
  value: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0f172a",
    marginTop: 6,
  },
  panel: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 24,
    marginTop: 18,
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 12,
  },
  planText: {
    color: "#334155",
    marginBottom: 8,
    fontWeight: "700",
  },
  tipBox: {
    backgroundColor: "#dcfce7",
    padding: 20,
    borderRadius: 24,
    marginTop: 16,
    marginBottom: 40,
  },
  tipTitle: {
    color: "#166534",
    fontWeight: "900",
    marginBottom: 8,
  },
  tipText: {
    color: "#14532d",
    lineHeight: 22,
  },
});