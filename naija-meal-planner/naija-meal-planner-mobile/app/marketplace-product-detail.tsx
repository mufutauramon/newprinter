import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  ActivityIndicator,
  Alert,
  Linking,
  Share,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiFetch } from "../utils/api";
import { useAppContext } from "../context/AppContext";


function formatMoney(amount: number, region: string) {
  const currency =
    region === "ng" ? "NGN" : region === "ca" ? "CAD" : region === "uk" ? "GBP" : region === "au" ? "AUD" : "USD";

  const locale =
    region === "ng" ? "en-NG" : region === "ca" ? "en-CA" : region === "uk" ? "en-GB" : region === "au" ? "en-AU" : "en-US";

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: region === "ng" ? 0 : 2,
  }).format(Number(amount || 0));
}

export default function MarketplaceProductDetail() {
  const { id } = useLocalSearchParams();
const { user, token, region, countryCode } = useAppContext();
  const listingId = Array.isArray(id) ? id[0] : id;

  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const userCountryCode = countryCode?.toUpperCase() || (region === "ng" ? "NG" : "US");
 
  const loadListing = async () => {
    try {
      setLoading(true);

      const data = await apiFetch<{ ok: boolean; listings: any[] }>(
       `/api/marketplace/listings?countryCode=${encodeURIComponent(userCountryCode)}`,
       { token }
      );
     
      if (data.ok) {
        const found = (data.listings || []).find(
          (item) => String(item.id) === String(listingId)
        );
        setListing(found || null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (listingId) loadListing();
  }, [listingId]);

  const contactSeller = async () => {
    const phone = String(listing?.whatsapp || listing?.phone || "").replace(/\D/g, "");

    if (!phone) {
      Alert.alert("No contact", "This seller has not added a WhatsApp number.");
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

  const shareListing = async () => {
    if (!listing) return;

    await Share.share({
      message: `${listing.product_name}\n${formatMoney(Number(listing.price || 0), region)} / ${listing.unit || "unit"}\n${[listing.city, listing.state, listing.country_code].filter(Boolean).join(", ")}\n\nShared from Naija Meal Planner Market`,
    });
  };

  const reportListing = () => {
    Alert.alert("Report Listing", "Why are you reporting this product?", [
      { text: "Spam", onPress: () => submitReport("Spam") },
      { text: "Wrong price", onPress: () => submitReport("Wrong price") },
      { text: "Inappropriate", onPress: () => submitReport("Inappropriate") },
      { text: "Cancel", style: "cancel" },
    ]);
  };
const deleteListing = async () => {
  Alert.alert(
    "Delete Listing",
    "Do you want to permanently remove this product?",
    [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const data = await apiFetch<{
              ok: boolean;
              error?: string;
            }>(
              `/api/marketplace/listings/${listing.id}`,
              {
                method: "DELETE",
                token,
                body: JSON.stringify({}),
              }
            );

            if (!data.ok) {
              throw new Error(
                data.error || "Could not delete listing."
              );
            }

            Alert.alert(
              "Deleted",
              "Listing removed successfully."
            );

            router.replace("/(tabs)/prices");
          } catch (err: any) {
            Alert.alert(
              "Error",
              err?.message || "Could not delete listing."
            );
          }
        },
      },
    ]
  );
};
  const submitReport = async (reason: string) => {
   const data = await apiFetch<{ ok: boolean; error?: string }>(
  `/api/marketplace/listings/${listing.id}/report`,
  {
    method: "POST",
    token,
    body: JSON.stringify({
      reason,
      details: "",
    }),
  }
);

    if (!data.ok) {
      Alert.alert("Error", data.error || "Could not report listing.");
      return;
    }

    Alert.alert("Report sent", "Thank you. We will review this listing.");
  };

  if (loading) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator color="#15803d" size="large" />
      </View>
    );
  }

  if (!listing) {
    return (
      <View style={styles.loadingBox}>
        <Text style={styles.notFound}>Product not found.</Text>
      </View>
    );
  }

  const isOwner = Number(listing.user_id) === Number(user?.id);

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.imageWrap}>
          {listing.image_url ? (
            <Image source={{ uri: listing.image_url }} style={styles.image} />
          ) : (
            <View style={styles.imageFallback}>
              <Ionicons name="basket-outline" size={48} color="#15803d" />
            </View>
          )}

          <View style={styles.topBar}>
            <Pressable style={styles.roundBtn} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={24} color="#0f172a" />
            </Pressable>

            <View style={styles.topActions}>
  <Pressable style={styles.roundBtn} onPress={shareListing}>
    <Ionicons name="share-social-outline" size={21} color="#0f172a" />
  </Pressable>

  <Pressable
    style={styles.roundBtn}
    onPress={() => setSaved((prev) => !prev)}
  >
    <Ionicons
      name={saved ? "bookmark" : "bookmark-outline"}
      size={21}
      color="#0f172a"
    />
  </Pressable>

  {!isOwner && (
    <Pressable style={styles.roundBtn} onPress={reportListing}>
      <Ionicons name="flag-outline" size={21} color="#0f172a" />
    </Pressable>
  )}
</View>
          </View>
        </View>
        <View style={styles.card}>
  <Text style={styles.productName}>{listing.product_name}</Text>

  <Text style={styles.price}>
    {formatMoney(Number(listing.price || 0), region)}
    <Text style={styles.unit}> / {listing.unit || "unit"}</Text>
  </Text>

  <View style={styles.locationLine}>
    <Ionicons name="location-outline" size={16} color="#64748b" />
    <Text style={styles.location}>
      {[listing.city, listing.state, listing.country_code]
        .filter(Boolean)
        .join(", ") || "Local seller"}
    </Text>
    <View style={styles.metaRow}>
  <Ionicons name="time-outline" size={14} color="#64748b" />
  <Text style={styles.metaText}>
    {listing.created_at_human || "Recently posted"}
  </Text>
</View>
  </View>
<View style={styles.infoGrid}>
  <View style={styles.infoPill}>
    <Ionicons name="cube-outline" size={15} color="#15803d" />
    <Text style={styles.infoText}>{listing.category || "Product"}</Text>
  </View>

  {Number(listing.delivery_available) === 1 && (
    <View style={styles.infoPill}>
      <Ionicons name="bicycle-outline" size={15} color="#15803d" />
      <Text style={styles.infoText}>Delivery</Text>
    </View>
  )}

  {Number(listing.pickup_available) === 1 && (
    <View style={styles.infoPill}>
      <Ionicons name="bag-handle-outline" size={15} color="#15803d" />
      <Text style={styles.infoText}>Pickup</Text>
    </View>
  )}
</View>

{!!listing.description && (
  <View style={styles.descriptionBox}>
    <Text style={styles.descriptionTitle}>About this product</Text>
    <Text style={styles.description}>{listing.description}</Text>
  </View>
)}

  {!!listing.description && (
    <Text style={styles.description}>{listing.description}</Text>
  )}

  <View style={styles.sellerBox}>
    <View style={styles.sellerAvatar}>
      <Ionicons name="person" size={20} color="#15803d" />
    </View>

    <View style={{ flex: 1 }}>
      <Text style={styles.sellerName}>{listing.seller_name || "Seller"}</Text>
      <Text style={styles.sellerMeta}>
  {[listing.city, listing.state]
    .filter(Boolean)
    .join(", ") || "Marketplace seller"}
</Text>
    </View>
  </View>

  {isOwner ? (
    <View style={styles.ownerActions}>
      <Pressable
  style={styles.ownerBtn}
  onPress={() =>
    router.push({
      pathname: "/edit-marketplace-listing" as any,
      params: { id: String(listing.id) },
    })
  }
>
  <Ionicons name="create-outline" size={18} color="#15803d" />
  <Text style={styles.ownerText}>Edit</Text>
</Pressable>
      <Pressable
  style={styles.deleteBtn}
  onPress={deleteListing}
>
  <Ionicons name="trash-outline" size={18} color="#dc2626" />
  <Text style={styles.deleteText}>Delete</Text>
</Pressable>
    </View>
  ) : (
    <Pressable style={styles.whatsappBtn} onPress={contactSeller}>
      <Ionicons name="logo-whatsapp" size={21} color="#fff" />
      <Text style={styles.whatsappText}>Chat on WhatsApp</Text>
    </Pressable>
  )}
</View>
{isOwner && (
  <View style={styles.ownerInfoCard}>
    <Text style={styles.ownerInfoTitle}>
      Buyer Contact Information
    </Text>

    {!!listing.whatsapp && (
      <Text style={styles.ownerInfoText}>
        WhatsApp: {listing.whatsapp}
      </Text>
    )}

    {!!listing.phone && (
      <Text style={styles.ownerInfoText}>
        Phone: {listing.phone}
      </Text>
    )}
  </View>
)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f3f8f5" },
  content: { paddingBottom: 120 },
  loadingBox: {
    flex: 1,
    backgroundColor: "#f3f8f5",
    alignItems: "center",
    justifyContent: "center",
  },
  notFound: { color: "#64748b", fontWeight: "900" },

  image: { width: "100%", height: "100%" },
  imageFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  topBar: {
    position: "absolute",
    top: 54,
    left: 14,
    right: 14,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  topActions: { flexDirection: "row", gap: 10 },
  roundBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
 
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
 
  statusPill: {
    backgroundColor: "#dcfce7",
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 16,
  },
  statusText: {
    color: "#15803d",
    fontSize: 11,
    fontWeight: "900",
  },
 
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    color: "#0f172a",
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 9,
  },
 
  whatsappBtn: {
    marginTop: 26,
    backgroundColor: "#15803d",
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  whatsappText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
  },

  statsRow: {
  flexDirection: "row",
  gap: 10,
  marginTop: 14,
},

statBox: {
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: "#f8fafc",
  paddingHorizontal: 12,
  paddingVertical: 8,
  borderRadius: 14,
},

statText: {
  marginLeft: 6,
  color: "#475569",
  fontSize: 12,
  fontWeight: "800",
},
ownerInfoCard: {
  backgroundColor: "#ecfdf5",
  borderRadius: 18,
  padding: 14,
  marginTop: 16,
},

ownerInfoTitle: {
  color: "#14532d",
  fontSize: 14,
  fontWeight: "900",
  marginBottom: 6,
},

ownerInfoText: {
  color: "#166534",
  fontSize: 13,
  fontWeight: "700",
},
imageWrap: {
  height: 245,
  backgroundColor: "#dcfce7",
  position: "relative",
},

card: {
  marginTop: -24,
  backgroundColor: "#fff",
  borderTopLeftRadius: 32,
  borderTopRightRadius: 32,
  paddingHorizontal: 18,
  paddingTop: 20,
  paddingBottom: 28,
  minHeight: 420,
},

productName: {
  color: "#0f172a",
  fontSize: 24,
  fontWeight: "900",
  textTransform: "capitalize",
},

price: {
  color: "#15803d",
  fontSize: 28,
  fontWeight: "900",
  marginTop: 12,
},

unit: {
  color: "#64748b",
  fontSize: 14,
  fontWeight: "800",
},

locationLine: {
  flexDirection: "row",
  alignItems: "center",
  marginTop: 10,
  gap: 5,
},

location: {
  color: "#64748b",
  fontSize: 13,
  fontWeight: "800",
},

sellerBox: {
  backgroundColor: "#f8fafc",
  borderRadius: 24,
  padding: 14,
  flexDirection: "row",
  alignItems: "center",
  marginTop: 22,
},

sellerAvatar: {
  width: 42,
  height: 42,
  borderRadius: 21,
  backgroundColor: "#dcfce7",
  alignItems: "center",
  justifyContent: "center",
  marginRight: 11,
},

sellerName: {
  color: "#0f172a",
  fontSize: 15,
  fontWeight: "900",
},

sellerMeta: {
  color: "#64748b",
  fontSize: 12,
  fontWeight: "700",
  marginTop: 2,
},

ownerActions: {
  flexDirection: "row",
  gap: 10,
  marginTop: 24,
},

ownerBtn: {
  flex: 1,
  height: 54,
  borderRadius: 27,
  backgroundColor: "#e8f7ef",
  alignItems: "center",
  justifyContent: "center",
  flexDirection: "row",
  gap: 7,
},
metaRow: {
  flexDirection: "row",
  alignItems: "center",
  marginTop: 8,
  gap: 5,
},

metaText: {
  color: "#64748b",
  fontSize: 12,
  fontWeight: "700",
},
ownerText: {
  color: "#15803d",
  fontSize: 15,
  fontWeight: "900",
},

deleteBtn: {
  flex: 1,
  height: 54,
  borderRadius: 27,
  backgroundColor: "#fee2e2",
  alignItems: "center",
  justifyContent: "center",
  flexDirection: "row",
  gap: 7,
},

deleteText: {
  color: "#dc2626",
  fontSize: 15,
  fontWeight: "900",
},
infoGrid: {
  flexDirection: "row",
  flexWrap: "wrap",
  gap: 8,
  marginTop: 16,
},

infoPill: {
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: "#f0fdf4",
  borderRadius: 16,
  paddingHorizontal: 11,
  paddingVertical: 8,
  gap: 5,
},

infoText: {
  color: "#166534",
  fontSize: 12,
  fontWeight: "900",
},

descriptionBox: {
  backgroundColor: "#f8fafc",
  borderRadius: 22,
  padding: 14,
  marginTop: 18,
},

descriptionTitle: {
  color: "#0f172a",
  fontSize: 14,
  fontWeight: "900",
  marginBottom: 6,
},

description: {
  color: "#475569",
  fontSize: 14,
  lineHeight: 22,
  fontWeight: "600",
},
});