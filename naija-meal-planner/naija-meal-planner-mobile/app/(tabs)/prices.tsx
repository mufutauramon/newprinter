import { useEffect, useState } from "react";
import { useAppContext } from "../../context/AppContext";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
} from "react-native";

const API_BASE = "http://10.0.2.2:8787";

export default function Prices() {
  const {
    region,
    city,
    state,
    countryCode,
    detectUserLocation,
    setPrices,
    prices,
    aiGroceries,
    aiGroceriesLoading,
    refreshAIGroceries,
  } = useAppContext();

  const [store, setStore] = useState("");
  const [items, setItems] = useState<any[]>([]);

  const symbol = region === "ng" ? "₦" : region === "ca" ? "C$" : "$";

  useEffect(() => {
    const generatedItems = Object.keys(aiGroceries).map((itemName) => {
      const savedPrice = prices.find(
        (p) => String(p.item).toLowerCase() === itemName.toLowerCase()
      );

      return {
        item: itemName,
        category: "Grocery",
        unit: "unit",
        price: savedPrice ? String(savedPrice.price) : "0",
      };
    });

    setItems(generatedItems);
  }, [aiGroceries, prices]);

  const updatePrice = (index: number, value: string) => {
    const clean = value.replace(/[^0-9.]/g, "");

    setItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, price: clean } : item
      )
    );
  };

  const savePrice = async (item: any) => {
    try {
      if (!city || !state) {
        Alert.alert("Location needed", "Please detect your location first.");
        return;
      }

      const location = `${city}-${state}`;

      const res = await fetch(`${API_BASE}/api/prices`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          item: item.item,
          category: item.category,
          unit: item.unit,
          price: Number(item.price),
          region,
          location,
          store,
        }),
      });

      const data = await res.json();

      if (!data.ok) {
        throw new Error(data.error || "Failed to save price");
      }

      setPrices((prev: any[]) => {
        const exists = prev.some(
          (p) => String(p.item).toLowerCase() === String(item.item).toLowerCase()
        );

        if (exists) {
          return prev.map((p) =>
            String(p.item).toLowerCase() === String(item.item).toLowerCase()
              ? { ...p, price: Number(item.price) }
              : p
          );
        }

        return [
          ...prev,
          {
            item: item.item,
            price: Number(item.price),
          },
        ];
      });

      Alert.alert("Saved", `${item.item} price saved for ${city}, ${state}`);
    } catch (err) {
      console.log(err);
      Alert.alert("Error", "Could not save price. Make sure backend is running.");
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Market Prices</Text>

      <Text style={styles.subtitle}>
        Prices are generated from your current AI grocery list.
      </Text>

      <Pressable style={styles.refreshBtn} onPress={refreshAIGroceries}>
        <Text style={styles.refreshText}>🤖 Refresh Grocery Items</Text>
      </Pressable>

      <View style={styles.formCard}>
        <Text style={styles.label}>Store / Market</Text>

        <TextInput
          style={styles.input}
          value={store}
          onChangeText={setStore}
          placeholder="e.g. Walmart, Shoprite, Local Market"
        />

        <View style={styles.locationBox}>
          <Text style={styles.locationLabel}>Detected Location</Text>

          <Text style={styles.locationValue}>
            {city && state ? `${city}, ${state}` : "No location detected"}
          </Text>

          <Text style={styles.locationSub}>
            Country: {countryCode || "Unknown"} • Currency:{" "}
           {region === "ng"
  ? "₦ Nigeria"
  : region === "ca"
  ? "C$ Canada"
  : "$ U.S."}
          </Text>

          <Pressable style={styles.detectBtn} onPress={detectUserLocation}>
            <Text style={styles.detectText}>📍 Refresh Location</Text>
          </Pressable>
        </View>
      </View>

      {aiGroceriesLoading && items.length === 0 && (
        <View style={styles.loadingBox}>
          <Text style={styles.loadingText}>
            🤖 Loading grocery items from meal plan...
          </Text>
        </View>
      )}

      {!aiGroceriesLoading && items.length === 0 && (
        <View style={styles.loadingBox}>
          <Text style={styles.loadingText}>
            No grocery items yet. Tap “Refresh Grocery Items”.
          </Text>
        </View>
      )}

      {!aiGroceriesLoading &&
        items.map((item, index) => (
          <View style={styles.priceCard} key={item.item}>
            <View>
              <Text style={styles.itemName}>{item.item}</Text>
              <Text style={styles.meta}>
                {item.category} • per {item.unit}
              </Text>
            </View>

            <View style={styles.priceRow}>
              <Text style={styles.symbol}>{symbol}</Text>

              <TextInput
                style={styles.priceInput}
                keyboardType="numeric"
                value={item.price}
                onChangeText={(value) => updatePrice(index, value)}
                placeholder="Enter price"
              />
            </View>

            <Pressable style={styles.saveBtn} onPress={() => savePrice(item)}>
              <Text style={styles.saveText}>Save Price</Text>
            </Pressable>
          </View>
        ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f8f5",
  },
  content: {
    padding: 20,
    paddingBottom: 140,
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    marginBottom: 6,
    color: "#0f172a",
  },
  subtitle: {
    color: "#64748b",
    marginBottom: 18,
    fontSize: 15,
  },
  refreshBtn: {
    backgroundColor: "#0f172a",
    padding: 14,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  refreshText: {
    color: "#fff",
    fontWeight: "900",
  },
  formCard: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 22,
    marginBottom: 18,
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
  locationBox: {
    backgroundColor: "#ecfdf5",
    padding: 16,
    borderRadius: 18,
  },
  locationLabel: {
    color: "#166534",
    fontWeight: "800",
    marginBottom: 4,
  },
  locationValue: {
    fontSize: 18,
    fontWeight: "900",
    color: "#052e16",
  },
  locationSub: {
    marginTop: 4,
    color: "#166534",
    fontWeight: "700",
  },
  detectBtn: {
    backgroundColor: "#0f172a",
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 14,
  },
  detectText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 14,
  },
  loadingBox: {
    backgroundColor: "#ecfdf5",
    padding: 16,
    borderRadius: 18,
    marginBottom: 16,
  },
  loadingText: {
    color: "#166534",
    fontWeight: "800",
  },
  priceCard: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 22,
    marginBottom: 14,
  },
  itemName: {
    fontSize: 17,
    fontWeight: "900",
    color: "#0f172a",
    textTransform: "capitalize",
  },
  meta: {
    color: "#64748b",
    marginTop: 4,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 14,
    paddingHorizontal: 14,
    marginTop: 14,
  },
  symbol: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0f6b3f",
    marginRight: 8,
  },
  priceInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 18,
    fontWeight: "900",
  },
  saveBtn: {
    marginTop: 14,
    backgroundColor: "#0f7a43",
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  saveText: {
    color: "#fff",
    fontWeight: "900",
  },
});