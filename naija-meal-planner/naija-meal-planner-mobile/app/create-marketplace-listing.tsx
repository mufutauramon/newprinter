import { useState } from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiFetch } from "../utils/api";
import { useAppContext } from "../context/AppContext";

export default function CreateMarketplaceListing() {
const { user, token, region, city, state, countryCode, isPro } = useAppContext();
 
  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState("Grains");
  const [price, setPrice] = useState("");
  const [unit, setUnit] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [deliveryAvailable, setDeliveryAvailable] = useState(false);
  const [pickupAvailable, setPickupAvailable] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

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

  const userCountryCode =
    countryCode?.toUpperCase() ||
    (region === "ng"
      ? "NG"
      : region === "ca"
      ? "CA"
      : region === "uk"
      ? "UK"
      : region === "au"
      ? "AU"
      : "US");

  const pickImage = async () => {
  const result = await ImagePicker.launchImageLibraryAsync({
  mediaTypes: ImagePicker.MediaTypeOptions.Images,
  quality: 0.7,
  allowsEditing: false,
});

    if (result.canceled) return;

    const asset = result.assets[0];

    try {
      setUploading(true);

      const formData = new FormData();

      formData.append("file", {
        uri: asset.uri,
        name: "marketplace-product.jpg",
        type: "image/jpeg",
      } as any);

      const response = await fetch(
        "https://naija-meal-planner-api.ramonmufutau16.workers.dev/api/community/upload-media",
        {
          method: "POST",
          headers: {
  Authorization: `Bearer ${token}`,
},
          body: formData,
        }
      );

      const data = await response.json();

      if (!data.ok) throw new Error(data.error || "Upload failed.");

      setImageUrl(data.mediaUrl);
    } catch (err: any) {
      Alert.alert("Upload Error", err?.message || "Could not upload image.");
    } finally {
      setUploading(false);
    }
  };

  const submitListing = async () => {
    if (!productName.trim() || !price.trim() || !unit.trim()) {
      Alert.alert("Missing details", "Product name, price, and unit are required.");
      return;
    }

    if (!userCountryCode) {
      Alert.alert("Location missing", "Please set your country/location first.");
      return;
    }

    try {
      setSaving(true);

      const data = await apiFetch<{ ok: boolean; error?: string; upgradeRequired?: boolean }>(
  "/api/marketplace/listings",
  {
    method: "POST",
    token,
    body: JSON.stringify({
      productName: productName.trim(),
      category,
      description: description.trim(),
      price: Number(price),
      currency,
      unit: unit.trim(),
      imageUrl,
      phone: phone.trim(),
      whatsapp: whatsapp.trim(),
      city,
      state,
      countryCode: userCountryCode,
      deliveryAvailable,
      pickupAvailable,
    }),
  }
);

      if (!data.ok) {
        if (data.upgradeRequired) {
          Alert.alert(
            "Upgrade Required",
            data.error || "Free users can list up to 3 active products."
          );
          return;
        }

        throw new Error(data.error || "Could not create listing.");
      }

      router.replace("/(tabs)/prices");
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Could not create listing.");
    } finally {
      setSaving(false);
    }
  };

  const canPost =
    !!productName.trim() &&
    !!price.trim() &&
    !!unit.trim() &&
    !saving &&
    !uploading;

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.topBar}>
        <Pressable style={styles.closeBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={22} color="#0f172a" />
        </Pressable>

        <Text style={styles.topTitle}>Add Product</Text>

        <Pressable
          style={[styles.postBtn, !canPost && styles.postBtnDisabled]}
          onPress={submitListing}
          disabled={!canPost}
        >
          {saving ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.postText}>Post</Text>
          )}
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable style={styles.imagePicker} onPress={pickImage}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.productImage} />
          ) : (
            <View style={styles.imageEmpty}>
              {uploading ? (
                <ActivityIndicator color="#15803d" />
              ) : (
                <>
                  <Ionicons name="camera-outline" size={34} color="#15803d" />
                  <Text style={styles.imageText}>Add product photo</Text>
                </>
              )}
            </View>
          )}
        </Pressable>

        <View style={styles.card}>
          <Text style={styles.label}>Product name</Text>
          <TextInput
            value={productName}
            onChangeText={setProductName}
            placeholder="Fresh tomatoes"
            placeholderTextColor="#94a3b8"
            style={styles.input}
          />

          <Text style={styles.label}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
           {[
  "Grains",
  "Vegetables",
  "Proteins",
  "Fruits",
  "Spices",
  "Oils",
  "Dairy",
  "Other",
].map((item) => (
                <Pressable
                  key={item}
                  style={[
                    styles.categoryChip,
                    category === item && styles.categoryChipActive,
                  ]}
                  onPress={() => setCategory(item)}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      category === item && styles.categoryTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                </Pressable>
              )
            )}
          </ScrollView>

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Price</Text>
              <TextInput
                value={price}
                onChangeText={(v) => setPrice(v.replace(/[^0-9.]/g, ""))}
                placeholder="4000"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                style={styles.input}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Unit</Text>
              <TextInput
                value={unit}
                onChangeText={setUnit}
                placeholder="basket, kg, bag"
                placeholderTextColor="#94a3b8"
                style={styles.input}
              />
            </View>
          </View>
          <Text style={styles.label}>Description</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Describe the product quality, pickup details, or delivery info..."
            placeholderTextColor="#94a3b8"
            style={styles.messageInput}
            multiline
            textAlignVertical="top"
          />

          <Text style={styles.sectionTitle}>Contact</Text>

          <TextInput
            value={whatsapp}
            onChangeText={setWhatsapp}
            placeholder="WhatsApp number with country code"
            placeholderTextColor="#94a3b8"
            keyboardType="phone-pad"
            style={styles.input}
          />

          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="Phone number optional"
            placeholderTextColor="#94a3b8"
            keyboardType="phone-pad"
            style={styles.input}
          />

          <Text style={styles.sectionTitle}>Availability</Text>

          <View style={styles.switchRow}>
            <View>
              <Text style={styles.switchTitle}>Delivery available</Text>
              <Text style={styles.switchSub}>Seller can deliver locally</Text>
            </View>
            <Switch
              value={deliveryAvailable}
              onValueChange={setDeliveryAvailable}
            />
          </View>

          <View style={styles.switchRow}>
            <View>
              <Text style={styles.switchTitle}>Pickup available</Text>
              <Text style={styles.switchSub}>Buyer can pick up item</Text>
            </View>
            <Switch value={pickupAvailable} onValueChange={setPickupAvailable} />
          </View>

          <View style={styles.locationBox}>
            <Ionicons name="location-outline" size={18} color="#15803d" />
            <Text style={styles.locationText}>
              {[city, state, userCountryCode].filter(Boolean).join(", ")}
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f3f8f5" },

  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    paddingTop: 54,
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: "rgba(243,248,245,0.96)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },

  topTitle: {
    color: "#0f172a",
    fontSize: 18,
    fontWeight: "900",
  },

  postBtn: {
    minWidth: 68,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#15803d",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },

  postBtnDisabled: {
    opacity: 0.45,
  },

  postText: {
    color: "#fff",
    fontWeight: "900",
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 104,
    paddingBottom: 70,
  },

  imagePicker: {
    height: 220,
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "#fff",
    marginBottom: 16,
  },

  productImage: {
    width: "100%",
    height: "100%",
  },

  imageEmpty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ecfdf5",
  },

  imageText: {
    color: "#15803d",
    fontWeight: "900",
    marginTop: 8,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 28,
    padding: 18,
  },

  label: {
    color: "#0f172a",
    fontSize: 13,
    fontWeight: "900",
    marginBottom: 8,
    marginTop: 10,
  },

  input: {
    backgroundColor: "#f8fafc",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: "#0f172a",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },

  messageInput: {
    minHeight: 110,
    backgroundColor: "#f8fafc",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: "#0f172a",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 21,
    marginBottom: 4,
  },

  row: {
    flexDirection: "row",
    gap: 12,
  },

  categoryChip: {
    backgroundColor: "#f8fafc",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 17,
    marginRight: 8,
  },

  categoryChipActive: {
    backgroundColor: "#15803d",
  },

  categoryText: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: "900",
  },

  categoryTextActive: {
    color: "#fff",
  },

  sectionTitle: {
    color: "#0f172a",
    fontSize: 16,
    fontWeight: "900",
    marginTop: 18,
    marginBottom: 6,
  },

  switchRow: {
    backgroundColor: "#f8fafc",
    borderRadius: 18,
    padding: 14,
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  switchTitle: {
    color: "#0f172a",
    fontWeight: "900",
    fontSize: 14,
  },

  switchSub: {
    color: "#64748b",
    fontWeight: "700",
    fontSize: 12,
    marginTop: 2,
  },

  locationBox: {
    backgroundColor: "#f0fdf4",
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
  },

  locationText: {
    color: "#15803d",
    fontWeight: "900",
    flex: 1,
  },
});