import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Linking,
    Alert,
    Modal,
    RefreshControl,
} from "react-native";
import { useAppContext } from "../../context/AppContext";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { router } from "expo-router";
import { apiFetch } from "../../utils/api";

function formatLocalMoney(amount: number, region: string) {
  const currency =
    region === "ng"
      ? "NGN"
      : region === "ca"
      ? "CAD"
      : region === "uk"
      ? "GBP"
      : region === "au"
      ? "AUD"
      : "USD";

  const locale =
    region === "ng"
      ? "en-NG"
      : region === "ca"
      ? "en-CA"
      : region === "uk"
      ? "en-GB"
      : region === "au"
      ? "en-AU"
      : "en-US";

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: region === "ng" ? 0 : 2,
  }).format(Number(amount || 0));
}
function findPrice(itemName: string, prices: any[]) {
  return prices.find((p) => {
    const savedName = String(p.item || "").toLowerCase();
    const groceryName = itemName.toLowerCase();
    return savedName.includes(groceryName) || groceryName.includes(savedName);
  });
}
const STORE_CONFIG: Record<
  string,
  { name: string; icon: string; searchUrl: (item: string) => string }[]
> = {
    uk: [
  {
    name: "Tesco",
    icon: "🛒",
    searchUrl: (item) =>
      `https://www.tesco.com/groceries/en-GB/search?query=${encodeURIComponent(item)}`,
  },
  {
    name: "Amazon UK",
    icon: "📦",
    searchUrl: (item) =>
      `https://www.amazon.co.uk/s?k=${encodeURIComponent(item)}`,
  },
  {
    name: "Asda",
    icon: "🥕",
    searchUrl: (item) =>
      `https://groceries.asda.com/search/${encodeURIComponent(item)}`,
  },
],au: [
  {
    name: "Woolworths",
    icon: "🛒",
    searchUrl: (item) =>
      `https://www.woolworths.com.au/shop/search/products?searchTerm=${encodeURIComponent(item)}`,
  },
  {
    name: "Coles",
    icon: "🥕",
    searchUrl: (item) =>
      `https://www.coles.com.au/search/products?q=${encodeURIComponent(item)}`,
  },
  {
    name: "Amazon AU",
    icon: "📦",
    searchUrl: (item) =>
      `https://www.amazon.com.au/s?k=${encodeURIComponent(item)}`,
  },
],
  us: [
    {
      name: "Walmart",
      icon: "🛒",
      searchUrl: (item) =>
        `https://www.walmart.com/search?q=${encodeURIComponent(item)}`,
    },
    {
      name: "Amazon",
      icon: "📦",
      searchUrl: (item) =>
        `https://www.amazon.com/s?k=${encodeURIComponent(item)}`,
    },
    {
      name: "Instacart",
      icon: "🥕",
      searchUrl: (item) =>
        `https://www.instacart.com/store/s?k=${encodeURIComponent(item)}`,
    },
  ],

  ca: [
    {
      name: "Walmart CA",
      icon: "🛒",
      searchUrl: (item) =>
        `https://www.walmart.ca/search?q=${encodeURIComponent(item)}`,
    },
    {
      name: "Amazon CA",
      icon: "📦",
      searchUrl: (item) =>
        `https://www.amazon.ca/s?k=${encodeURIComponent(item)}`,
    },
    {
      name: "Instacart CA",
      icon: "🥕",
      searchUrl: (item) =>
        `https://www.instacart.ca/store/s?k=${encodeURIComponent(item)}`,
    },
  ],

  ng: [
    {
      name: "Jumia",
      icon: "🛍️",
      searchUrl: (item) =>
        `https://www.jumia.com.ng/catalog/?q=${encodeURIComponent(item)}`,
    },
    {
      name: "Konga",
      icon: "🛒",
      searchUrl: (item) =>
        `https://www.konga.com/search?search=${encodeURIComponent(item)}`,
    },
    {
      name: "Supermart",
      icon: "🥬",
      searchUrl: (item) =>
        `https://www.supermart.ng/search?q=${encodeURIComponent(item)}`,
    },
    
  ],
};
export default function Groceries() {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [showOnlyNeedToBuy, setShowOnlyNeedToBuy] = useState(false);
  const [selectedStoreName, setSelectedStoreName] = useState("");
  const [cartDoneItems, setCartDoneItems] = useState<Record<string, boolean>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [showStoreBuilder, setShowStoreBuilder] = useState(false);
 const {
  region,
  city,
  state,
  aiGroceries,
  aiGroceriesLoading,
  refreshAIGroceries,
  isPro,
  boughtItems,
  setBoughtItems,
  pantryItems,
  setPantryItems,
} = useAppContext();
const stores = STORE_CONFIG[region] || STORE_CONFIG.us;

const openStorePrice = async (
  searchUrl: (item: string) => string,
  item: string
) => {
  const url = searchUrl(item);

  try {
    await Linking.openURL(url);
  } catch (err) {
    console.log("Could not open store link:", url, err);
    Alert.alert("Could not open store", "Please try again later.");
  }
};
const selectedStore =
  stores.find((s) => s.name === selectedStoreName) || stores[0];
  const money = (amount: number) => {
  return formatLocalMoney(amount, region);
};
  const [cartItems, setCartItems] = useState<any[]>([]);
const [cartModalVisible, setCartModalVisible] = useState(false);
const [resolvedPrices, setResolvedPrices] = useState<any[]>([]);

const openCartBuilder = () => {
  const itemsToBuy = displayedGroceryRows.filter(
    (grocery) => !pantryItems[grocery.item] && !boughtItems[grocery.item]
  );

  if (!itemsToBuy.length) {
    Alert.alert("No groceries", "There are no grocery items left to buy.");
    return;
  }

  setCartItems(itemsToBuy);
  setCartDoneItems({});
  setCartModalVisible(true);
};
const onRefresh = async () => {
  try {
    setRefreshing(true);
    await refreshAIGroceries();
  } finally {
    setRefreshing(false);
  }
};
useEffect(() => {
  async function loadResolvedPrices() {
    const itemNames = Object.keys(aiGroceries);

    if (!itemNames.length) {
      setResolvedPrices([]);
      return;
    }

    const location = city && state ? `${city}-${state}` : "default";

    try {
      const data = await apiFetch<{
        ok: boolean;
        prices?: any[];
      }>(
        `/api/public/grocery-prices?region=${encodeURIComponent(
          region
        )}&location=${encodeURIComponent(
          location
        )}&items=${encodeURIComponent(itemNames.join(","))}`,
        { timeout: 20000 }
      );

      setResolvedPrices(Array.isArray(data.prices) ? data.prices : []);
    } catch (err) {
      console.log("Load resolved grocery prices failed:", err);
      setResolvedPrices([]);
    }
  }

  loadResolvedPrices();
}, [aiGroceries, region, city, state]);
  const groceryRows = Object.entries(aiGroceries).map(([item, qty]) => {
  const priceRow = resolvedPrices.find((p) => {
    const savedName = String(p.item || "").toLowerCase();
    const groceryName = String(item || "").toLowerCase();

    return (
      savedName === groceryName ||
      savedName.includes(groceryName) ||
      groceryName.includes(savedName)
    );
  });

  const unitPrice = Number(priceRow?.price || 1);
  const unit = priceRow?.unit || "unit";
  const source = priceRow?.source || "fallback";

  const estimatedQty = Math.max(1, Math.ceil(Number(qty) || 0));
  const total = estimatedQty * unitPrice;

  return {
    item,
    qty: estimatedQty,
    unit,
    unitPrice,
    total,
    source,
    hasPrice: !!priceRow,
  };
});
const displayedGroceryRows = showOnlyNeedToBuy
  ? groceryRows.filter(
      (row) => !boughtItems[row.item] && !pantryItems[row.item]
    )
  : groceryRows;
const estimatedTotal = useMemo(() => {
  if (!Array.isArray(groceryRows)) return 0;

  return groceryRows.reduce((sum, row) => {
    if (boughtItems[row.item] || pantryItems[row.item]) {
      return sum;
    }

    return sum + Number(row?.total || 0);
  }, 0);
}, [groceryRows, boughtItems, pantryItems]);  const boughtCount = groceryRows.filter((row) => boughtItems[row.item]).length;
 const pantryCount = groceryRows.filter((row) => pantryItems[row.item]).length;
const needToBuyCount = groceryRows.filter(
  (row) => !pantryItems[row.item] && !boughtItems[row.item]
).length;

const togglePantry = (item: string) => {
  setPantryItems((prev) => ({
    ...prev,
    [item]: !prev[item],
  }));

  // remove bought if pantry selected
  setBoughtItems((prev) => ({
    ...prev,
    [item]: false,
  }));
};
const toggleBought = (item: string) => {
  setBoughtItems((prev) => ({
    ...prev,
    [item]: !prev[item],
  }));

  // remove pantry if bought selected
  setPantryItems((prev) => ({
    ...prev,
    [item]: false,
  }));
};
const toggleCartDone = (item: string) => {
  setCartDoneItems((prev) => ({
    ...prev,
    [item]: !prev[item],
  }));
};
useEffect(() => {
  setBoughtItems((prev) => {
    const next: Record<string, boolean> = {};

    groceryRows.forEach((row) => {
      next[row.item] = prev[row.item] || false;
    });

    return next;
  });
}, [aiGroceries]);
  const pricedCount = useMemo(() => {
  return Array.isArray(groceryRows)
    ? groceryRows.filter((row) => row?.hasPrice).length
    : 0;
}, [groceryRows]);

const getSuggestions = async () => {
  if (!isPro) {
    router.push("/paywall");
    return;
  }

  try {
    setLoadingAI(true);

    const data = await apiFetch<{
      ok: boolean;
      suggestions?: any[];
      error?: string;
    }>("/api/ai/optimize-budget", {
      method: "POST",
      timeout: 40000,
      body: JSON.stringify({
        groceries: Array.isArray(groceryRows) ? groceryRows : [],
        budget: Number(estimatedTotal) || 0,
        region,
      }),
    });

    if (!data.ok) {
      throw new Error(data.error || "Failed to generate suggestions");
    }

    setSuggestions(
      Array.isArray(data.suggestions) ? data.suggestions : []
    );
  } catch (err) {
    console.log("Budget suggestions failed:", err);

    Alert.alert(
      "AI unavailable",
      "Could not generate grocery suggestions right now."
    );

    setSuggestions([]);
  } finally {
    setLoadingAI(false);
  }
};
;
useEffect(() => {
  setPantryItems((prev) => {
    const next: Record<string, boolean> = {};

    groceryRows.forEach((row) => {
      next[row.item] = prev[row.item] || false;
    });

    return next;
  });
}, [aiGroceries]);
  const downloadGroceryPDF = async () => {
    const rows = groceryRows
      .map(
        (grocery) => `
          <tr>
            <td>${grocery.item}</td>
            <td>${grocery.qty} ${grocery.unit || ""}</td>
            <td>${money(grocery.unitPrice)}</td>
            <td>${money(grocery.total)}</td>
          </tr>
        `
      )
      .join("");

    const suggestionRows = suggestions
      .map(
        (s) => `
          <li>
            Replace <strong>${s.item}</strong> with <strong>${s.replace_with}</strong>.
            ${s.reason ? s.reason : ""}
          </li>
        `
      )
      .join("");

    const html = `
      <html>
        <body style="font-family: Arial; padding: 24px;">
          <h1>Naija Meal Planner Grocery List</h1>
          <p>Generated from your meal plan and saved market prices.</p>
          <table style="width:100%; border-collapse: collapse;">
            <thead>
              <tr>
                <th style="border:1px solid #ddd; padding:8px;">Item</th>
                <th style="border:1px solid #ddd; padding:8px;">Quantity</th>
                <th style="border:1px solid #ddd; padding:8px;">Unit Price</th>
                <th style="border:1px solid #ddd; padding:8px;">Total</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <h2>Total: ${money(estimatedTotal)}</h2>
          ${
            suggestions.length
              ? `<h2>AI Budget Suggestions</h2><ul>${suggestionRows}</ul>`
              : ""
          }
        </body>
      </html>
    `;

    const { uri } = await Print.printToFileAsync({ html });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: "Download Grocery List",
        UTI: "com.adobe.pdf",
      });
    }
  };

  return (
    <ScrollView
  style={styles.screen}
  contentContainerStyle={styles.content}
  showsVerticalScrollIndicator={false}
  refreshControl={
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor="#0f7a43"
    />
  }
>
    
      <View style={styles.header}>
        <Text style={styles.kicker}>Shopping assistant</Text>
        <Text style={styles.title}>Grocery List</Text>
      </View>

      <View style={styles.summaryCard}>
  <View>
    <Text style={styles.summaryLabel}>Estimated total</Text>
    <Text style={styles.summaryValue}>{money(estimatedTotal)}</Text>
    <Text style={styles.summarySub}>
      {boughtCount}/{needToBuyCount} bought • {pantryCount} at home
    </Text>
  </View>

  <View style={styles.cartBadge}>
    <Text style={styles.cartBadgeText}>🛒</Text>
  </View>
</View>
      <View style={styles.actionGrid}>
        <Pressable style={styles.actionBtn} onPress={downloadGroceryPDF}>
          <Text style={styles.actionIcon}>⬇️</Text>
          <Text style={styles.actionText}>PDF</Text>
        </Pressable>

        <Pressable style={styles.actionBtnPro} onPress={getSuggestions}>
          {loadingAI ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.actionIcon}>💰</Text>
              <Text style={styles.actionTextLight}>Optimize</Text>
            </>
          )}
        </Pressable>
      </View>
<Pressable
  style={[
    styles.filterBtn,
    showOnlyNeedToBuy && styles.filterBtnActive,
  ]}
  onPress={() => setShowOnlyNeedToBuy((v) => !v)}
>
  <Text
    style={[
      styles.filterText,
      showOnlyNeedToBuy && styles.filterTextActive,
    ]}
  >
    {showOnlyNeedToBuy
      ? "Showing: Need to buy only"
      : "Show need to buy only"}
  </Text>
</Pressable>

<Pressable
  style={styles.cartBuilderCompact}
  onPress={() => setShowStoreBuilder((v) => !v)}
>
  <View>
    <Text style={styles.cartBuilderTitle}>Store Cart Builder</Text>
    <Text style={styles.cartBuilderSub}>
      {showStoreBuilder
        ? "Choose one store and build your cart."
        : "Tap to choose store and build shopping cart."}
    </Text>
  </View>

  <Ionicons
    name={showStoreBuilder ? "chevron-up" : "chevron-down"}
    size={22}
    color="#0f172a"
  />
</Pressable>

{showStoreBuilder && (
  <View style={styles.cartBuilderCard}>
    <View style={styles.cartStoreGrid}>
      {stores.map((store) => (
        <Pressable
          key={store.name}
          style={[
            styles.cartStoreChip,
            selectedStore.name === store.name && styles.cartStoreChipActive,
          ]}
          onPress={() => setSelectedStoreName(store.name)}
        >
          <Text style={styles.cartStoreIcon}>{store.icon}</Text>
          <Text
            style={[
              styles.cartStoreName,
              selectedStore.name === store.name && styles.cartStoreNameActive,
            ]}
          >
            {store.name}
          </Text>
        </Pressable>
      ))}
    </View>

    <Pressable style={styles.buildCartBtn} onPress={openCartBuilder}>
      <Text style={styles.buildCartText}>
        Build list on {selectedStore.name}
      </Text>
    </Pressable>
  </View>
)}
      {loadingAI && (
        <View style={styles.loadingCard}>
          <ActivityIndicator color="#0f7a43" />
          <Text style={styles.loadingTitle}>Finding cheaper options</Text>
          <Text style={styles.loadingText}>AI is reviewing your grocery budget.</Text>
        </View>
      )}

      {suggestions.map((s, index) => (
        <View key={index} style={styles.suggestionCard}>
          <Text style={styles.suggestionBadge}>AI Suggestion</Text>
          <Text style={styles.suggestionTitle}>
            Replace {s.item} → {s.replace_with}
          </Text>
          <Text style={styles.reason}>{s.reason}</Text>
        </View>
      ))}

      {aiGroceriesLoading && groceryRows.length === 0 && (
        <View style={styles.emptyCard}>
          <ActivityIndicator color="#0f7a43" />
          <Text style={styles.emptyTitle}>Generating grocery list</Text>
          <Text style={styles.emptyText}>AI is extracting ingredients from your meals.</Text>
        </View>
      )}

      {!aiGroceriesLoading && groceryRows.length === 0 && (
        <View style={styles.emptyCard}>
  <Text style={styles.emptyEmoji}>🧺</Text>

  <Text style={styles.emptyTitle}>
    No grocery items yet
  </Text>

  <Text style={styles.emptyText}>
    Generate or refresh your meal plan first.
  </Text>

  <Pressable
    style={styles.retryBtn}
    onPress={refreshAIGroceries}
  >
    <Text style={styles.retryBtnText}>
      Refresh Grocery List
    </Text>
  </Pressable>
</View>
      )}

      {displayedGroceryRows.map((grocery) => {
  const expanded = expandedItem === grocery.item;
 const completed =
  boughtItems[grocery.item] || pantryItems[grocery.item];
  return (
    <View
      key={grocery.item}
      style={[
        styles.cleanCard,
        boughtItems[grocery.item] && styles.cleanCardBought,
      ]}
    >
      <Pressable
        style={styles.cleanHeader}
        onPress={() =>
          setExpandedItem(expanded ? null : grocery.item)
        }
      >
        <View style={styles.cleanLeft}>
          <View
  style={[
    styles.checkCircle,
    completed && styles.checkCircleActive,
  ]}
>
  {completed && (
    <Text style={styles.checkMark}>✓</Text>
  )}
</View>
          <View>
            <Text style={styles.cleanItem}>
              {grocery.qty} {grocery.unit} {grocery.item}
            </Text>

            <Text style={styles.cleanMeta}>
  {pantryItems[grocery.item]
    ? "Already at home"
    : boughtItems[grocery.item]
    ? "Already bought"
    : money(grocery.total)}
</Text>
          </View>
        </View>

        <Ionicons
          name={expanded ? "chevron-down" : "chevron-forward"}
          size={20}
          color="#64748b"
        />
      </Pressable>

      {expanded && (
        <View style={styles.expandArea}>
          <View style={styles.checkRow}>
            <Pressable
              style={[
                styles.boughtBtn,
                boughtItems[grocery.item] &&
                  styles.boughtBtnActive,
              ]}
              onPress={() => toggleBought(grocery.item)}
            >
              <Text
                style={[
                  styles.boughtBtnText,
                  boughtItems[grocery.item] &&
                    styles.boughtBtnTextActive,
                ]}
              >
                {boughtItems[grocery.item]
                  ? "✓ Bought"
                  : "Mark Bought"}
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.pantryBtn,
                pantryItems[grocery.item] &&
                  styles.pantryBtnActive,
              ]}
              onPress={() => togglePantry(grocery.item)}
            >
              <Text
                style={[
                  styles.pantryBtnText,
                  pantryItems[grocery.item] &&
                    styles.pantryBtnTextActive,
                ]}
              >
                {pantryItems[grocery.item]
                  ? "✓ Pantry"
                  : "Add Pantry"}
              </Text>
            </Pressable>
          </View>

          {!boughtItems[grocery.item] &&
 !pantryItems[grocery.item] && (
  <View style={styles.storeGrid}>
    {stores.map((store) => (
      <Pressable
        key={store.name}
        style={styles.storeMiniCard}
        onPress={() =>
          openStorePrice(
            store.searchUrl,
            grocery.item
          )
        }
      >
        <Text style={styles.storeMiniIcon}>
          {store.icon}
        </Text>

        <Text style={styles.storeMiniName}>
          {store.name}
        </Text>
      </Pressable>
    ))}
  </View>
)}
</View>
      )}
    </View>
  );
})}

{/* 👇 PASTE MODAL HERE */}
<Modal visible={cartModalVisible} animationType="slide">
  <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
    <Text style={styles.title}>Build list on {selectedStore.name}</Text>

    <Text style={styles.subtitle}>
      Open each grocery item, add it to your cart, then return here for the next item.
    </Text>

    {cartItems.map((grocery) => {
      const done = cartDoneItems[grocery.item];

      return (
        <View
          key={grocery.item}
          style={[styles.cartListItem, done && styles.cartListItemDone]}
        >
          <Pressable
            style={{ flex: 1 }}
            onPress={() => openStorePrice(selectedStore.searchUrl, grocery.item)}
          >
            <Text style={[styles.item, done && styles.doneText]}>
              {grocery.item}
            </Text>

            <Text style={styles.meta}>
              Tap to search on {selectedStore.name}
            </Text>
          </Pressable>

          <Pressable
            style={[styles.doneBtn, done && styles.doneBtnActive]}
            onPress={() => toggleCartDone(grocery.item)}
          >
            <Text style={[styles.doneBtnText, done && styles.doneBtnTextActive]}>
              {done ? "✓" : "Mark"}
            </Text>
          </Pressable>
        </View>
      );
    })}

    <Pressable
      style={styles.cancelBtn}
      onPress={() => setCartModalVisible(false)}
    >
      <Text style={styles.cancelText}>Close Cart Builder</Text>
    </Pressable>
  </ScrollView>
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
    paddingTop: 28,
    paddingBottom: 180,
  },
  header: {
    marginBottom: 18,
  },
  kicker: {
    color: "#15803d",
    fontWeight: "900",
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  cancelBtn: {
  backgroundColor: "#e2e8f0",
  padding: 16,
  borderRadius: 20,
  alignItems: "center",
  marginTop: 20,
},

cancelText: {
  color: "#0f172a",
  fontWeight: "900",
},
  title: {
    fontSize: 34,
    fontWeight: "900",
    color: "#0f172a",
    letterSpacing: -1,
  },
  refreshHint: {
  color: "#15803d",
  fontWeight: "900",
  fontSize: 12,
  marginTop: 8,
},
  cartListItem: {
  backgroundColor: "#fff",
  padding: 18,
  borderRadius: 24,
  marginBottom: 12,
  flexDirection: "row",
  alignItems: "center",
  gap: 12,
  shadowColor: "#0f172a",
  shadowOpacity: 0.05,
  shadowRadius: 14,
  elevation: 2,
},

cartListItemDone: {
  opacity: 0.5,
},

doneText: {
  textDecorationLine: "line-through",
  color: "#94a3b8",
},

doneBtn: {
  backgroundColor: "#f8fafc",
  borderWidth: 1,
  borderColor: "#e2e8f0",
  paddingVertical: 10,
  paddingHorizontal: 14,
  borderRadius: 16,
},

doneBtnActive: {
  backgroundColor: "#dcfce7",
  borderColor: "#86efac",
},

doneBtnText: {
  color: "#64748b",
  fontWeight: "900",
  fontSize: 12,
},
cartBuilderCompact: {
  backgroundColor: "#fff",
  padding: 18,
  borderRadius: 24,
  marginBottom: 12,
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  shadowColor: "#0f172a",
  shadowOpacity: 0.05,
  shadowRadius: 12,
  elevation: 2,
},
retryBtn: {
  marginTop: 16,
  backgroundColor: "#0f7a43",
  paddingVertical: 14,
  borderRadius: 20,
  alignItems: "center",
},

retryBtnText: {
  color: "#fff",
  fontWeight: "900",
  fontSize: 15,
},

doneBtnTextActive: {
  color: "#166534",
},
  subtitle: {
    color: "#64748b",
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
  },
  summaryCard: {
    backgroundColor: "#0f172a",
    borderRadius: 28,
    padding: 20,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLabel: {
    color: "#cbd5e1",
    fontWeight: "800",
    marginBottom: 5,
  },
  summaryValue: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "900",
  },
  summarySub: {
    color: "#94a3b8",
    marginTop: 5,
    fontWeight: "800",
  },
  cartBadge: {
    width: 58,
    height: 58,
    borderRadius: 22,
    backgroundColor: "#dcfce7",
    alignItems: "center",
    justifyContent: "center",
  },
  cartBadgeText: {
    fontSize: 26,
  },
  actionGrid: {
  flexDirection: "row",
  gap: 14,
  marginBottom: 18,
},
  actionBtn: {
    flex: 1,
    backgroundColor: "#fff",
    paddingVertical: 16,
    borderRadius: 22,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  actionBtnDark: {
    flex: 1,
    backgroundColor: "#0f172a",
    paddingVertical: 16,
    borderRadius: 22,
    alignItems: "center",
  },
  filterBtn: {
  backgroundColor: "#fff",
  borderWidth: 1,
  borderColor: "#dbeafe",
  padding: 14,
  borderRadius: 20,
  alignItems: "center",
  marginBottom: 16,
},

filterBtnActive: {
  backgroundColor: "#dcfce7",
  borderColor: "#86efac",
},

filterText: {
  color: "#0f172a",
  fontWeight: "900",
},

filterTextActive: {
  color: "#166534",
},
  actionBtnPro: {
    flex: 1,
    backgroundColor: "#7c3aed",
    paddingVertical: 16,
    borderRadius: 22,
    alignItems: "center",
  },
  actionIcon: {
    fontSize: 18,
    marginBottom: 5,
  },
  actionText: {
    color: "#0f172a",
    fontWeight: "900",
  },
  actionTextLight: {
    color: "#fff",
    fontWeight: "900",
  },
  loadingCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 26,
    alignItems: "center",
    marginBottom: 16,
  },
  loadingTitle: {
    color: "#0f172a",
    fontWeight: "900",
    marginTop: 10,
    fontSize: 16,
  },
  loadingText: {
    color: "#64748b",
    marginTop: 4,
    textAlign: "center",
  },
  suggestionCard: {
    backgroundColor: "#fffbeb",
    borderWidth: 1,
    borderColor: "#fde68a",
    padding: 18,
    borderRadius: 24,
    marginBottom: 12,
  },
  suggestionBadge: {
    color: "#92400e",
    fontWeight: "900",
    fontSize: 12,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  suggestionTitle: {
    fontWeight: "900",
    color: "#78350f",
    marginBottom: 5,
    fontSize: 15,
  },
  reason: {
    color: "#92400e",
    fontWeight: "700",
    lineHeight: 20,
  },
  emptyCard: {
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 28,
    alignItems: "center",
    marginBottom: 16,
  },
  emptyEmoji: {
    fontSize: 34,
    marginBottom: 8,
  },
  emptyTitle: {
    color: "#0f172a",
    fontWeight: "900",
    fontSize: 17,
    marginTop: 8,
  },
  
  emptyText: {
    color: "#64748b",
    textAlign: "center",
    marginTop: 5,
    lineHeight: 20,
  },
  card: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 30,
    marginBottom: 16,
    shadowColor: "#0f172a",
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 2,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  itemIcon: {
    width: 46,
    height: 46,
    borderRadius: 17,
    backgroundColor: "#f0fdf4",
    alignItems: "center",
    justifyContent: "center",
  },
  itemIconText: {
    fontSize: 20,
  },
  checkRow: {
  flexDirection: "row",
  gap: 10,
  marginTop: 16,
},

pantryBtn: {
  flex: 1,
  backgroundColor: "#fff7ed",
  borderWidth: 1,
  borderColor: "#fed7aa",
  padding: 13,
  borderRadius: 18,
  alignItems: "center",
},

pantryBtnActive: {
  backgroundColor: "#ffedd5",
  borderColor: "#fb923c",
},

pantryBtnText: {
  color: "#c2410c",
  fontWeight: "900",
  fontSize: 13,
},

pantryBtnTextActive: {
  color: "#9a3412",
},
  item: {
    fontSize: 17,
    fontWeight: "900",
    color: "#0f172a",
    textTransform: "capitalize",
  },
  meta: {
    color: "#64748b",
    marginTop: 4,
    fontWeight: "700",
  },
  total: {
    fontSize: 19,
    fontWeight: "900",
    color: "#0f7a43",
  },
  detailRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  detailPill: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderRadius: 18,
    padding: 14,
  },
  storeSection: {
  marginTop: 14,
},

storeSectionTitle: {
  color: "#64748b",
  fontWeight: "900",
  fontSize: 12,
  marginBottom: 8,
},

storeGrid: {
  flexDirection: "row",
  gap: 8,
},

storeMiniCard: {
  flex: 1,
  backgroundColor: "#0f172a",
  borderRadius: 18,
  paddingVertical: 13,
  paddingHorizontal: 8,
  alignItems: "center",
},

storeMiniIcon: {
  fontSize: 18,
  marginBottom: 5,
},

storeMiniName: {
  color: "#fff",
  fontWeight: "900",
  fontSize: 11,
  textAlign: "center",
},
  detailLabel: {
    color: "#94a3b8",
    fontWeight: "800",
    fontSize: 12,
    marginBottom: 4,
  },
  detailValue: {
    color: "#0f7a43",
    fontWeight: "900",
    fontSize: 16,
  },
  statusPill: {
    justifyContent: "center",
    paddingHorizontal: 14,
    borderRadius: 18,
  },
  statusGood: {
    backgroundColor: "#dcfce7",
  },
  statusWarn: {
    backgroundColor: "#ffedd5",
  },
  statusText: {
    fontWeight: "900",
    fontSize: 12,
  },
  statusGoodText: {
    color: "#166534",
  },
  statusWarnText: {
    color: "#c2410c",
  },
  addPriceBtn: {
    backgroundColor: "#fff7ed",
    borderRadius: 18,
    padding: 14,
    marginTop: 14,
  },
  addPriceText: {
    color: "#c2410c",
    fontWeight: "900",
    textAlign: "center",
  },
  boughtCard: {
  opacity: 0.55,
},

boughtBtn: {
  flex: 1,
  backgroundColor: "#f8fafc",
  borderWidth: 1,
  borderColor: "#e2e8f0",
  padding: 13,
  borderRadius: 18,
  alignItems: "center",
  marginTop: 0,
},
boughtBtnActive: {
  backgroundColor: "#dcfce7",
  borderColor: "#86efac",
},

boughtBtnText: {
  color: "#64748b",
  fontWeight: "900",
  fontSize: 13,
},

boughtBtnTextActive: {
  color: "#166534",
},
  noteCard: {
    backgroundColor: "#dcfce7",
    padding: 20,
    borderRadius: 28,
    marginTop: 4,
    marginBottom: 20,
  },
  noteTitle: {
    color: "#166534",
    fontWeight: "900",
    fontSize: 16,
    marginBottom: 6,
  },
  cartBuilderCard: {
  backgroundColor: "#fff",
  padding: 18,
  borderRadius: 28,
  marginBottom: 18,
  shadowColor: "#0f172a",
  shadowOpacity: 0.06,
  shadowRadius: 18,
  elevation: 2,
},

cartBuilderHeader: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 14,
},

cartBuilderTitle: {
  color: "#0f172a",
  fontWeight: "900",
  fontSize: 18,
},

cartBuilderSub: {
  color: "#64748b",
  marginTop: 4,
  fontWeight: "700",
  fontSize: 12,
  maxWidth: 260,
},

cartBuilderIcon: {
  fontSize: 28,
},

cartStoreGrid: {
  flexDirection: "row",
  gap: 8,
  marginBottom: 14,
},

cartStoreChip: {
  flex: 1,
  backgroundColor: "#f8fafc",
  borderWidth: 1,
  borderColor: "#e2e8f0",
  borderRadius: 18,
  paddingVertical: 12,
  alignItems: "center",
},

cartStoreChipActive: {
  backgroundColor: "#dcfce7",
  borderColor: "#86efac",
},

cartStoreIcon: {
  fontSize: 18,
  marginBottom: 5,
},

cartStoreName: {
  color: "#64748b",
  fontWeight: "900",
  fontSize: 11,
  textAlign: "center",
},

cartStoreNameActive: {
  color: "#166534",
},

buildCartBtn: {
  backgroundColor: "#0f172a",
  padding: 16,
  borderRadius: 20,
  alignItems: "center",
},

buildCartText: {
  color: "#fff",
  fontWeight: "900",
  fontSize: 15,
},
  noteText: {
    color: "#166534",
    lineHeight: 21,
    fontWeight: "700",
  },
  cleanCard: {
  backgroundColor: "#fff",
  borderRadius: 22,
  marginBottom: 12,
  overflow: "hidden",

  shadowColor: "#0f172a",
  shadowOpacity: 0.05,
  shadowRadius: 12,
  elevation: 2,
},

cleanCardBought: {
  opacity: 0.6,
},

cleanHeader: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  padding: 18,
},

cleanLeft: {
  flexDirection: "row",
  alignItems: "center",
  gap: 14,
  flex: 1,
},

checkCircle: {
  width: 24,
  height: 24,
  borderRadius: 999,
  borderWidth: 2,
  borderColor: "#d1d5db",
  alignItems: "center",
  justifyContent: "center",
},

checkCircleActive: {
  backgroundColor: "#15803d",
  borderColor: "#15803d",
},

checkMark: {
  color: "#fff",
  fontWeight: "900",
},

cleanItem: {
  fontSize: 16,
  fontWeight: "800",
  color: "#0f172a",
  textTransform: "capitalize",
},

cleanMeta: {
  color: "#64748b",
  marginTop: 4,
  fontSize: 12,
  fontWeight: "700",
},

expandArea: {
  paddingHorizontal: 18,
  paddingBottom: 18,
},
});