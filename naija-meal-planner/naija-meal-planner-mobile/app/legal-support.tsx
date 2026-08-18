import { router } from "expo-router";
import {
  ScrollView,
  View,
  Text,
  Pressable,
  StyleSheet,
  Alert,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { apiFetch } from "../utils/api";
import { getErrorMessage } from "../utils/errorMessage";
import { useAppContext } from "../context/AppContext";

const PRIVACY_URL =
  "https://www.termsfeed.com/live/a6f22247-b707-4953-8dcd-3cd36a81f069";

const TERMS_URL =
  "https://www.termsfeed.com/live/a6f22247-b707-4953-8dcd-3cd36a81f069";

const SUPPORT_EMAIL = "admin@matcityedu.com";
const DELETE_ACCOUNT_SUBJECT = "Delete My Naija Meal Planner Account";

export default function LegalSupport() {
 const { user, token, signOut } = useAppContext();
 const handleDeleteAccount = () => {
  Alert.alert(
    "Delete Account",
    "This will permanently delete your account and app data. This action cannot be undone.",
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete Account",
        style: "destructive",
        onPress: confirmDeleteAccount,
      },
    ]
  );
};

const confirmDeleteAccount = async () => {
  try {
       console.log("TOKEN:", token);
  const res = await apiFetch("/api/account/delete", {
  method: "DELETE",
  token,
});

    await signOut();

    Alert.alert(
      "Account Deleted",
      "Your account has been permanently deleted."
    );

    router.replace("/signin");
  } catch (err: any) {
    Alert.alert("Delete failed", getErrorMessage(err));
  }
};

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Pressable style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={24} color="#0f172a" />
        <Text style={styles.backText}>More</Text>
      </Pressable>

      <Text style={styles.kicker}>Legal & Support</Text>
      <Text style={styles.title}>Help Center</Text>
      <Text style={styles.subtitle}>
        Manage policies, support, account deletion, and app information.
      </Text>

      <View style={styles.card}>
        <MenuRow
          icon="shield-checkmark-outline"
          title="Privacy Policy"
          subtitle="How user data is handled"
          onPress={() => Linking.openURL(PRIVACY_URL)}
        />

        <MenuRow
          icon="document-text-outline"
          title="Terms of Service"
          subtitle="Rules for using this app"
          onPress={() => Linking.openURL(TERMS_URL)}
        />

        <MenuRow
          icon="mail-outline"
          title="Contact Support"
          subtitle={SUPPORT_EMAIL}
          onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
        />

        <MenuRow
          icon="trash-outline"
          title="Delete Account"
          subtitle="Permanently delete your account and data"
          danger
          onPress={handleDeleteAccount}
        />

        <View style={styles.versionRow}>
          <View style={styles.iconBox}>
            <Ionicons name="information-circle-outline" size={22} color="#15803d" />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>App Version</Text>
            <Text style={styles.rowSub}>Naija Meal Planner</Text>
          </View>

          <Text style={styles.versionText}>v1.0.0</Text>
        </View>
      </View>
    </ScrollView>
  );
}

function MenuRow({
  icon,
  title,
  subtitle,
  onPress,
  danger,
}: {
  icon: any;
  title: string;
  subtitle: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={[styles.iconBox, danger && styles.dangerIconBox]}>
        <Ionicons
          name={icon}
          size={22}
          color={danger ? "#be123c" : "#15803d"}
        />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={[styles.rowTitle, danger && styles.dangerText]}>
          {title}
        </Text>
        <Text style={styles.rowSub}>{subtitle}</Text>
      </View>

      <Ionicons name="chevron-forward" size={22} color="#94a3b8" />
    </Pressable>
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
    overflow: "hidden",
    shadowColor: "#0f172a",
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 3,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  versionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 18,
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: "#f0fdf4",
    alignItems: "center",
    justifyContent: "center",
  },
  dangerIconBox: {
    backgroundColor: "#fff1f2",
  },
  rowTitle: {
    color: "#0f172a",
    fontWeight: "900",
    fontSize: 16,
  },
  dangerText: {
    color: "#be123c",
  },
  rowSub: {
    color: "#64748b",
    marginTop: 4,
    fontWeight: "700",
    fontSize: 12,
  },
  versionText: {
    color: "#166534",
    fontWeight: "900",
  },
});