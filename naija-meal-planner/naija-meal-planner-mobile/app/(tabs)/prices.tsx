import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
  Image,
  Linking,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { apiFetch } from "../../utils/api";
import { useAppContext } from "../../context/AppContext";
function getCurrency(region: string) {
  if (region === "ng") return "NGN";
  if (region === "ca") return "CAD";
  if (region === "uk") return "GBP";
  if (region === "au") return "AUD";
  return "USD";
}

function formatMoney(amount: number, region: string) {
  const currency = getCurrency(region);

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

function getUserCountryCode(countryCode?: string, region?: string) {
  if (countryCode) return countryCode.toUpperCase();
  if (region === "ng") return "NG";
  if (region === "ca") return "CA";
  if (region === "uk") return "UK";
  if (region === "au") return "AU";
  return "US";
}

export default function Prices() {
  const { user, token, region, city, state, countryCode } = useAppContext();
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategoryView, setSelectedCategoryView] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"all" | "mine" | "saved">("all");
  const [category, setCategory] = useState("all");

  const userCountryCode = getUserCountryCode(countryCode, region);

  const loadListings = async () => {
    try {
      const params = new URLSearchParams();

      if (tab === "mine") {
        params.append("mine", "1");
      } else {
        params.append("countryCode", userCountryCode);
      }
      if (tab === "saved") {
  params.append("saved", "1");
} else if (tab === "mine") {
  params.append("mine", "1");
} else {
  params.append("countryCode", userCountryCode);
}
      if (search.trim()) {
        params.append("search", search.trim());
      }

      if (category !== "all") {
        params.append("category", category);
      }

     const data = await apiFetch<{ ok: boolean; listings: any[]; error?: string }>(
  `/api/marketplace/listings?${params.toString()}`,
  {
    token,
  }
);

      if (!data.ok) {
        throw new Error(data.error || "Could not load marketplace.");
      }

      setListings(data.listings || []);
    } catch (err: any) {
      Alert.alert("Market Error", err?.message || "Could not load marketplace.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
 const getCategoryCount = (categoryKey: string) => {
  return listings.filter(
    (item) => String(item.category || "") === categoryKey
  ).length;
};
  useEffect(() => {
    const timer = setTimeout(() => {
      loadListings();
    }, 350);

    return () => clearTimeout(timer);
  }, [search, tab, category, userCountryCode]);

  const contactSeller = async (listing: any) => {
    const phone = String(listing.whatsapp || listing.phone || "").replace(/\D/g, "");

    if (!phone) {
      Alert.alert("No contact", "This seller has not added a phone or WhatsApp number.");
      return;
    }

    const message = `Hello, I saw your ${listing.product_name} on Naija Meal Planner Market. Is it still available?`;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert("Error", "Could not open WhatsApp.");
    }
  };

  const deleteListing = async (listing: any) => {
    Alert.alert("Delete Listing", "Do you want to remove this product?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const data = await apiFetch<{ ok: boolean; error?: string }>(
  `/api/marketplace/listings/${listing.id}`,
  {
    method: "DELETE",
    token,
    body: JSON.stringify({}),
  }
);

          if (!data.ok) {
            Alert.alert("Error", data.error || "Could not delete listing.");
            return;
          }

          setListings((prev) => prev.filter((item) => item.id !== listing.id));
        },
      },
    ]);
  };
const MARKET_CATEGORIES = [
  {
    key: "Grains",
    label: "Grains",
    image: require("../../assets/items-fixed/Garri.jpeg"),
  },
  {
    key: "Vegetables",
    label: "Vegetables",
    image: require("../../assets/items-fixed/vegetable.jpeg"),
  },
  {
    key: "Proteins",
    label: "Proteins",
    image: require("../../assets/items-fixed/beef.jpeg"),
  },
  {
    key: "Fruits",
    label: "Fruits",
    image: require("../../assets/items-fixed/apple.jpeg"),
  },
  {
    key: "Spices",
    label: "Spices",
    image: require("../../assets/items-fixed/spices.jpeg"),
  },
  {
    key: "Oils",
    label: "Oils",
    image: require("../../assets/items-fixed/vegetableoil.jpeg"),
  },
  {
    key: "Dairy",
    label: "Dairy",
    image: require("../../assets/items-fixed/yogurt.jpeg"),
  },
  {
    key: "Tubers",
    label: "Tubers",
    image: require("../../assets/items-fixed/yam.jpeg"),
  },
  {
    key: "Beans & Legumes",
    label: "Beans",
    image: require("../../assets/items-fixed/blackeyed.jpeg"),
  },
  {
    key: "Seafood",
    label: "Seafood",
    image: require("../../assets/items-fixed/fish.jpeg"),
  },
  {
    key: "Snacks",
    label: "Snacks",
    image: require("../../assets/items-fixed/plantainchips.jpeg"),
  },
  {
    key: "Beverages",
    label: "Drinks",
    image: require("../../assets/items-fixed/water.jpeg"),
  },
  {
    key: "Bakery",
    label: "Bakery",
    image: require("../../assets/items-fixed/bread.jpeg"),
  },
  {
    key: "Appetizers",
    label: "Appetizers",
    image: require("../../assets/items-fixed/moi-moi.jpeg"),
  },
  {
    key: "Cooked Meals",
    label: "Cooked Meals",
    image: require("../../assets/items-fixed/jollof.jpeg"),
  },
  {
    key: "Local Delicacies",
    label: "Delicacies",
    image: require("../../assets/items-fixed/suya.jpeg"),
  },
  {
    key: "Other",
    label: "Other",
    image: require("../../assets/items-fixed/blackeyed.jpeg"),
  },
];
  const saveListing = async (listing: any) => {
  if (!user?.id) {
    Alert.alert("Sign in required", "Please sign in to save products.");
    return;
  }

  const data = await apiFetch<{ ok: boolean; saved: boolean; error?: string }>(
  `/api/marketplace/listings/${listing.id}/save`,
  {
    method: "POST",
    token,
    body: JSON.stringify({}),
  }
);

  if (!data.ok) {
    Alert.alert("Error", data.error || "Could not save product.");
    return;
  }

  setListings((prev) =>
    prev.map((item) =>
      item.id === listing.id
        ? { ...item, saved_by_me: data.saved ? 1 : 0 }
        : item
    )
  );
};

  return (
  <View style={styles.screen}>
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={async () => {
            setRefreshing(true);
            await loadListings();
          }}
        />
      }
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>
            {selectedCategoryView || "Marketplace"}
          </Text>

          <Text style={styles.subtitle}>
            {selectedCategoryView
              ? "Products in this category"
              : "Buy and sell food items near you"}
          </Text>
        </View>

        <Pressable
          style={styles.addTopBtn}
          onPress={() =>
            router.push({
              pathname: "/create-marketplace-listing" as any,
            })
          }
        >
          <View style={styles.sellBtnContent}>
  <Ionicons name="add" size={18} color="#fff" />
  <Text style={styles.sellBtnText}>Sell</Text>
</View>
        </Pressable>
      </View>

      <View style={styles.locationCard}>
        <Ionicons name="location-outline" size={18} color="#15803d" />
        <Text style={styles.locationText} numberOfLines={1}>
          {city && state ? `${city}, ${state}` : "Your location"} •{" "}
          {userCountryCode}
        </Text>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={18} color="#64748b" />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search rice, tomatoes, chicken..."
          placeholderTextColor="#94a3b8"
          style={styles.searchInput}
        />
      </View>

      <View style={styles.tabRow}>
        {[
  { key: "all", label: "All" },
  { key: "mine", label: "Mine" },
  { key: "saved", label: "Saved" },
].map((item) => (
          <Pressable
            key={item.key}
            onPress={() => {
              setTab(item.key as any);
              setSelectedCategoryView(null);
              setCategory("all");
            }}
            style={[styles.tabBtn, tab === item.key && styles.tabBtnActive]}
          >
            <Text
              style={[
                styles.tabText,
                tab === item.key && styles.tabTextActive,
              ]}
            >
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color="#15803d" size="large" />
          <Text style={styles.loadingText}>Loading market...</Text>
        </View>
      ) : !selectedCategoryView && tab === "all" ? (
  <>
    <View style={styles.marketIntroCard}>
      <Text style={styles.marketIntroTitle}>Shop by category</Text>
      <Text style={styles.marketIntroText}>
        Find local food items from sellers in your country.
      </Text>
    </View>

    <View style={styles.categoryGrid}>
      {MARKET_CATEGORIES.map((item) => (
        <Pressable
          key={item.key}
          style={styles.categoryCard}
          onPress={() => {
            setSelectedCategoryView(item.key);
            setCategory(item.key);
          }}
        >
          <Image source={item.image} style={styles.categoryImage} />

          <View style={styles.categoryOverlay}>
            <Text style={styles.categoryCardText}>{item.label}</Text>
            <Text style={styles.categoryCountText}>
              {getCategoryCount(item.key)} products
            </Text>
          </View>
        </Pressable>
      ))}
    </View>
  </>) : (
        <>
          {selectedCategoryView && (
  <View style={styles.categoryHeader}>
    <Pressable
      style={styles.categoryBack}
      onPress={() => {
        setSelectedCategoryView(null);
        setCategory("all");
      }}
    >
      <Ionicons name="chevron-back" size={20} color="#0f172a" />
      <Text style={styles.categoryBackText}>All Categories</Text>
    </Pressable>

    <Text style={styles.categoryPageTitle}>{selectedCategoryView}</Text>
    <Text style={styles.categoryPageSubtitle}>
      Products available near you
    </Text>
  </View>
)}
          {listings.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="storefront-outline" size={42} color="#94a3b8" />
           <Text style={styles.emptyTitle}>
  {tab === "mine"
    ? "No listings yet"
    : tab === "saved"
    ? "No saved products"
    : "No products found"}
</Text>

<Text style={styles.emptyText}>
  {tab === "mine"
    ? "Post your first product and start selling."
    : tab === "saved"
    ? "Products you save will appear here."
    : "Try another search or check again later."}
</Text>

              {tab === "mine" && (
                <Pressable
                  style={styles.emptyBtn}
                  onPress={() =>
                    router.push({
                      pathname: "/create-marketplace-listing" as any,
                    })
                  }
                >
                  <Text style={styles.emptyBtnText}>Add Product</Text>
                </Pressable>
              )}
            </View>
          ) : (
            <View style={styles.productGrid}>
              {listings.map((listing) => (
                <Pressable
                  key={listing.id}
                  style={styles.gridCard}
                  onPress={() =>
                    router.push({
                      pathname: "/marketplace-product-detail" as any,
                      params: { id: String(listing.id) },
                    })
                  }
                >
                  <View style={styles.gridImageBox}>
                    {listing.image_url ? (
                      <Image
                        source={{ uri: listing.image_url }}
                        style={styles.gridImage}
                      />
                    ) : (
                      <View style={styles.gridImageFallback}>
                        <Ionicons
                          name="basket-outline"
                          size={26}
                          color="#15803d"
                        />
                      </View>
                    )}

                    <Pressable
                      style={styles.saveCircle}
                      onPress={(e) => {
                        e.stopPropagation();
                        saveListing(listing);
                      }}
                    >
                      <Ionicons
  name={listing.saved_by_me ? "bookmark" : "bookmark-outline"}
  size={17}
  color="#15803d"
/>
                    </Pressable>
                  </View>

                  <Text style={styles.gridName} numberOfLines={1}>
                    {listing.product_name}
                  </Text>

                  <Text style={styles.gridPrice} numberOfLines={1}>
                    {formatMoney(Number(listing.price || 0), region)}
                    <Text style={styles.gridUnit}>
                      {" "}
                      / {listing.unit || "unit"}
                    </Text>
                  </Text>

                  <View style={styles.locationRow}>
                    <Ionicons
                      name="location-outline"
                      size={11}
                      color="#64748b"
                    />
                    <Text style={styles.gridLocation} numberOfLines={1}>
                      {[listing.city, listing.state]
                        .filter(Boolean)
                        .join(", ") || "Local"}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </>
      )}
    </ScrollView>

  </View>
);
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f3f8f5",
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 58,
    paddingBottom: 150,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  title: {
    color: "#0f172a",
    fontSize: 31,
    fontWeight: "900",
    letterSpacing: -0.8,
  },

  subtitle: {
    color: "#64748b",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 2,
  },

 addTopBtn: {
  height: 42,
  borderRadius: 21,
  backgroundColor: "#15803d",
  paddingHorizontal: 14,
  alignItems: "center",
  justifyContent: "center",
},

  locationCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
sellBtnContent: {
  flexDirection: "row",
  alignItems: "center",
  gap: 4,
},

sellBtnText: {
  color: "#fff",
  fontWeight: "900",
  fontSize: 13,
},
  locationText: {
    color: "#166534",
    fontSize: 13,
    fontWeight: "900",
    flex: 1,
  },

  searchBox: {
    backgroundColor: "#ffffff",
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  searchInput: {
    flex: 1,
    marginLeft: 8,
    color: "#0f172a",
    fontSize: 14,
    fontWeight: "700",
    paddingVertical: 0,
  },

  tabRow: {
    flexDirection: "row",
    backgroundColor: "#e8f3ed",
    padding: 4,
    borderRadius: 22,
    marginBottom: 12,
  },

  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 18,
    alignItems: "center",
  },

  tabBtnActive: {
    backgroundColor: "#15803d",
  },
marketIntroCard: {
  backgroundColor: "#0f172a",
  borderRadius: 24,
  padding: 16,
  marginBottom: 14,
},

marketIntroTitle: {
  color: "#fff",
  fontSize: 18,
  fontWeight: "900",
},

marketIntroText: {
  color: "#cbd5e1",
  fontSize: 13,
  fontWeight: "700",
  marginTop: 4,
  lineHeight: 19,
},
  tabText: {
    color: "#64748b",
    fontSize: 13,
    fontWeight: "900",
  },

  tabTextActive: {
    color: "#fff",
  },
locationRow: {
  flexDirection: "row",
  alignItems: "center",
  marginTop: 4,
  gap: 3,
},
  categoryRow: {
    paddingBottom: 14,
    gap: 8,
  },

  categoryChip: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 18,
  },

  categoryChipActive: {
    backgroundColor: "#0f172a",
  },

  categoryText: {
    color: "#475569",
    fontSize: 12,
    fontWeight: "900",
  },

  categoryTextActive: {
    color: "#fff",
  },
categoryCountText: {
  color: "rgba(255,255,255,0.88)",
  fontSize: 11,
  fontWeight: "800",
  marginTop: 2,
},
  loadingBox: {
    alignItems: "center",
    paddingTop: 45,
  },

  loadingText: {
    color: "#64748b",
    fontWeight: "800",
    marginTop: 10,
  },

  emptyCard: {
    backgroundColor: "#fff",
    borderRadius: 28,
    padding: 28,
    alignItems: "center",
    marginTop: 20,
  },

  emptyTitle: {
    color: "#0f172a",
    fontSize: 18,
    fontWeight: "900",
    marginTop: 12,
  },

  emptyText: {
    color: "#64748b",
    textAlign: "center",
    lineHeight: 20,
    marginTop: 6,
    fontWeight: "700",
  },

  emptyBtn: {
    backgroundColor: "#15803d",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 18,
    marginTop: 16,
  },

  emptyBtnText: {
    color: "#fff",
    fontWeight: "900",
  },

  productCard: {
    backgroundColor: "#ffffff",
    borderRadius: 26,
    marginBottom: 14,
    overflow: "hidden",
    shadowColor: "#0f172a",
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },

  productImageBox: {
    height: 185,
    backgroundColor: "#e2e8f0",
  },

  productImage: {
    width: "100%",
    height: "100%",
  },

  productImageFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#dcfce7",
  },

  productBody: {
    padding: 14,
  },

  productTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  productName: {
    color: "#0f172a",
    fontSize: 18,
    fontWeight: "900",
    textTransform: "capitalize",
  },

  productLocation: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },

  priceText: {
    color: "#15803d",
    fontSize: 22,
    fontWeight: "900",
    marginTop: 9,
  },

  unitText: {
    color: "#64748b",
    fontSize: 13,
    fontWeight: "800",
  },

  quantityText: {
    color: "#475569",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 4,
  },

  sellerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    gap: 5,
  },

  sellerName: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: "800",
  },

  actionRow: {
    flexDirection: "row",
    marginTop: 13,
    gap: 10,
  },

  whatsappBtn: {
    backgroundColor: "#15803d",
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    flex: 1,
  },

  whatsappText: {
    color: "#fff",
    fontWeight: "900",
  },

  editBtn: {
    flex: 1,
    backgroundColor: "#e8f7ef",
    borderRadius: 18,
    paddingVertical: 12,
    alignItems: "center",
  },

  editText: {
    color: "#15803d",
    fontWeight: "900",
  },

  deleteBtn: {
    flex: 1,
    backgroundColor: "#fee2e2",
    borderRadius: 18,
    paddingVertical: 12,
    alignItems: "center",
  },

  deleteText: {
    color: "#dc2626",
    fontWeight: "900",
  },

 
  marketInfoRow: {
  flexDirection: "row",
  gap: 8,
  marginTop: 8,
},

marketInfoText: {
  backgroundColor: "#f0fdf4",
  color: "#15803d",
  paddingHorizontal: 9,
  paddingVertical: 5,
  borderRadius: 12,
  fontSize: 11,
  fontWeight: "900",
},
productGrid: {
  flexDirection: "row",
  flexWrap: "wrap",
  justifyContent: "space-between",
},

gridCard: {
  width: "31.5%",
  backgroundColor: "#ffffff",
  borderRadius: 18,
  padding: 7,
  marginBottom: 12,
  shadowColor: "#0f172a",
  shadowOpacity: 0.05,
  shadowRadius: 10,
  elevation: 2,
},

gridImageBox: {
  height: 90,
  borderRadius: 16,
  overflow: "hidden",
  backgroundColor: "#f1f5f9",
  position: "relative",
  marginBottom: 8,
},

gridImage: {
  width: "100%",
  height: "100%",
},

gridImageFallback: {
  flex: 1,
  backgroundColor: "#dcfce7",
  alignItems: "center",
  justifyContent: "center",
},

saveCircle: {
  position: "absolute",
  right: 8,
  bottom: 8,
  width: 28,
  height: 28,
  borderRadius: 14,
  backgroundColor: "rgba(255,255,255,0.94)",
  alignItems: "center",
  justifyContent: "center",
},

gridName: {
  color: "#0f172a",
  fontSize: 12,
  fontWeight: "900",
  textTransform: "capitalize",
},

gridPrice: {
  color: "#15803d",
  fontSize: 11,
  fontWeight: "900",
  marginTop: 4,
},

gridUnit: {
  color: "#64748b",
  fontSize: 8,
  fontWeight: "800",
},

gridLocation: {
  color: "#64748b",
  fontSize: 9,
  fontWeight: "700",
  marginTop: 3,
},
categoryGrid: {
  flexDirection: "row",
  flexWrap: "wrap",
  justifyContent: "space-between",
  marginTop: 8,
},

categoryCard: {
  width: "48%",
  height: 96,
  borderRadius: 22,
  overflow: "hidden",
  marginBottom: 12,
  backgroundColor: "#fff",
},

categoryImage: {
  width: "100%",
  height: "100%",
},

categoryOverlay: {
  position: "absolute",
  left: 0,
  right: 0,
  bottom: 0,
  padding: 12,
  backgroundColor: "rgba(15,23,42,0.45)",
},

categoryCardText: {
  color: "#fff",
  fontSize: 16,
  fontWeight: "900",
},

categoryBack: {
  flexDirection: "row",
  alignItems: "center",
  marginBottom: 14,
  gap: 6,
},

categoryBackText: {
  color: "#0f172a",
  fontSize: 14,
  fontWeight: "900",
},
categoryHeader: {
  marginBottom: 14,
},

categoryPageTitle: {
  color: "#0f172a",
  fontSize: 24,
  fontWeight: "900",
  marginTop: 6,
},

categoryPageSubtitle: {
  color: "#64748b",
  fontSize: 13,
  fontWeight: "700",
  marginTop: 2,
},
});