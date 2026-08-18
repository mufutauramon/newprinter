import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
  Linking,
} from "react-native";
import { router } from "expo-router";
import { apiFetch } from "../utils/api";
import { useAppContext } from "../context/AppContext";
import {
  purchasePro,
  restorePurchases,
  getProPackages,
} from "../lib/purchases";

const PRIVACY_URL =
  "https://www.termsfeed.com/live/a6f22247-b707-4953-8dcd-3cd36a81f069";

const TERMS_URL =
  "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/";

export default function Paywall() {
 const { user, token, isPro, setIsPro, refreshProStatus, region } = useAppContext();

  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [priceText, setPriceText] = useState("Loading...");
  const storeName = Platform.OS === "ios" ? "App Store" : "Google Play";

  const features = [
    "Unlimited meal plan generation",
    "Premium meal categories",
    "Wellness-based meal plans",
    "Health insights and reminders",
    "Smart grocery optimization",
  ];

  useEffect(() => {
    refreshProStatus();

    const loadPrice = async () => {
      try {
        const packages: any = await getProPackages();

        const selectedPackage =
          packages?.monthly ||
          packages?.availablePackages?.[0] ||
          packages?.[0];

        const storePrice =
          selectedPackage?.product?.priceString ||
          selectedPackage?.product?.price_string;

        if (storePrice) {
          setPriceText(storePrice);
        } else {
          setPriceText("$4.99");
        }
      } catch (err) {
        console.log("Paywall price error:", err);
        setPriceText("$4.99");
      }
    };

    loadPrice();
  }, [region]);

  const handlePurchase = async () => {
    try {
      setPurchasing(true);

      const ok = await purchasePro();

      if (ok) {
  setIsPro(true);

  try {
    await apiFetch("/api/subscription/sync", {
      method: "POST",
      token,
      body: JSON.stringify({
      }),
    });
  } catch (err) {
    console.log("Subscription sync failed:", err);
  }

  await refreshProStatus();

  Alert.alert("Pro activated", "Your Pro subscription is now active.");
}
else {
  Alert.alert(
    "Subscription unavailable",
    "Subscriptions are temporarily unavailable. Please try again later."
  );
}
    } catch (err) {
      console.log("Purchase error:", err);
      Alert.alert("Purchase failed", "Could not complete subscription.");
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    try {
      setRestoring(true);

      const ok = await restorePurchases();

      if (ok) {
  setIsPro(true);

  try {
    await apiFetch("/api/subscription/sync", {
      method: "POST",
      token,
      body: JSON.stringify({}),
    });
  } catch (err) {
    console.log("Subscription restore sync failed:", err);
  }

  await refreshProStatus();

  Alert.alert("Restored", "Your Pro subscription has been restored.");
}
else {
  Alert.alert("No subscription found", "No active Pro purchase was found.");
}
    } catch (err) {
      console.log("Restore error:", err);
      Alert.alert("Restore failed", "Could not restore purchases.");
    } finally {
      setRestoring(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Pressable style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backText}>← Back</Text>
      </Pressable>

      <View style={styles.hero}>
        <Text style={styles.kicker}>NAIJA MEAL PLANNER PRO</Text>

        <Text style={styles.title}>Plan better meals for your family.</Text>

        <Text style={styles.subtitle}>
          Unlock premium meal categories, wellness plans, grocery tools, and
          health reminders.
        </Text>

        <View style={styles.priceBox}>
          <Text style={styles.price}>{priceText}</Text>
          <Text style={styles.priceSub}>/ month</Text>
        </View>
      </View>

      <View style={styles.card}>
        {features.map((item) => (
          <View key={item} style={styles.featureRow}>
            <Text style={styles.check}>✓</Text>
            <Text style={styles.feature}>{item}</Text>
          </View>
        ))}
      </View>

      {!isPro ? (
        <>
          <Pressable
            style={[styles.btn, purchasing && styles.disabledBtn]}
            onPress={handlePurchase}
            disabled={purchasing || restoring}
          >
            {purchasing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Upgrade to Pro</Text>
            )}
          </Pressable>

          <Pressable
            style={styles.restoreBtn}
            onPress={handleRestore}
            disabled={purchasing || restoring}
          >
            {restoring ? (
              <ActivityIndicator color="#0f7a43" />
            ) : (
              <Text style={styles.restoreText}>Restore Purchase</Text>
            )}
          </Pressable>
        </>
      ) : (
        <View style={styles.activeBox}>
          <Text style={styles.activeText}>You are a Pro user 🎉</Text>
        </View>
      )}

      <View style={styles.subscriptionInfoCard}>
        <Text style={styles.subscriptionTitle}>Subscription Details</Text>

        <Text style={styles.subscriptionText}>
          Naija Meal Planner Pro is an auto-renewable monthly subscription.
          Price: {priceText} per month. Payment will be charged to your{" "}
          {storeName} account at confirmation of purchase. Subscription renews
          automatically unless canceled at least 24 hours before the end of the
          current period.
        </Text>

        <View style={styles.legalLinksRow}>
          <Pressable onPress={() => Linking.openURL(PRIVACY_URL)}>
            <Text style={styles.legalLink}>Privacy Policy</Text>
          </Pressable>

          <Text style={styles.dot}>•</Text>

          <Pressable onPress={() => Linking.openURL(TERMS_URL)}>
            <Text style={styles.legalLink}>Terms of Use</Text>
          </Pressable>
        </View>
      </View>

      <Text style={styles.footerText}>
        Subscriptions are managed securely through {storeName}.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#eef7f0",
  },
  content: {
    padding: 22,
    paddingTop: 60,
    paddingBottom: 100,
  },
  backBtn: {
    marginBottom: 24,
  },
  backText: {
    color: "#0f172a",
    fontWeight: "900",
    fontSize: 16,
  },
  hero: {
    backgroundColor: "#ffffff",
    borderRadius: 30,
    padding: 24,
    marginBottom: 18,
  },
  kicker: {
    color: "#15803d",
    fontWeight: "900",
    fontSize: 13,
    marginBottom: 10,
  },
  title: {
    color: "#0f172a",
    fontWeight: "900",
    fontSize: 34,
    lineHeight: 40,
  },
  subtitle: {
    color: "#64748b",
    fontWeight: "700",
    fontSize: 15,
    lineHeight: 23,
    marginTop: 12,
  },
  priceBox: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginTop: 22,
  },
  price: {
    color: "#0f172a",
    fontSize: 38,
    fontWeight: "900",
  },
  priceSub: {
    color: "#64748b",
    fontWeight: "800",
    marginLeft: 6,
    marginBottom: 7,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 26,
    padding: 20,
    marginBottom: 18,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  check: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#dcfce7",
    color: "#15803d",
    textAlign: "center",
    lineHeight: 26,
    fontWeight: "900",
    marginRight: 12,
  },
  feature: {
    color: "#0f172a",
    fontWeight: "800",
    fontSize: 15,
    flex: 1,
  },
  btn: {
    backgroundColor: "#15803d",
    borderRadius: 22,
    paddingVertical: 17,
    alignItems: "center",
    marginBottom: 14,
  },
  disabledBtn: {
    opacity: 0.65,
  },
  btnText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 16,
  },
  restoreBtn: {
    alignItems: "center",
    paddingVertical: 14,
  },
  restoreText: {
    color: "#0f7a43",
    fontWeight: "900",
    fontSize: 15,
  },
  activeBox: {
    backgroundColor: "#dcfce7",
    borderRadius: 22,
    padding: 18,
    alignItems: "center",
    marginBottom: 18,
  },
  activeText: {
    color: "#166534",
    fontWeight: "900",
    fontSize: 16,
  },
  subscriptionInfoCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 18,
    marginTop: 12,
  },
  subscriptionTitle: {
    color: "#0f172a",
    fontWeight: "900",
    fontSize: 17,
    marginBottom: 10,
  },
  subscriptionText: {
    color: "#64748b",
    fontWeight: "700",
    lineHeight: 21,
    fontSize: 13,
  },
  legalLinksRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
  },
  legalLink: {
    color: "#15803d",
    fontWeight: "900",
  },
  dot: {
    marginHorizontal: 10,
    color: "#94a3b8",
    fontWeight: "900",
  },
  footerText: {
    textAlign: "center",
    color: "#94a3b8",
    fontWeight: "700",
    fontSize: 12,
    marginTop: 18,
  },
});