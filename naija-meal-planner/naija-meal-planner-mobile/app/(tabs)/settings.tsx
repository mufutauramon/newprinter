import { router } from "expo-router";
import { useAppContext } from "../../context/AppContext";
import {
  ScrollView,
  View,
  Text,
  Pressable,
  StyleSheet,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { checkIsPro } from "../../lib/purchases";

export default function More() {
  const { user, signOut, region } = useAppContext();
  const isAdmin =
  String(user?.email || "").toLowerCase() === "amufutau@unilag.edu.ng";

  const handleSignOut = () => {
    Alert.alert("Sign out", "Do you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/signin");
        },
      },
    ]);
  };

  const openHealthInsights = async () => {
    const isPro = await checkIsPro();

    if (!isPro) {
      router.push("/paywall");
      return;
    }

    router.push("/health-insights");
  };

  const regionLabel =
    region === "ng"
      ? "Nigeria"
      : region === "ca"
      ? "Canada"
      : region === "uk"
      ? "United Kingdom"
      : region === "au"
      ? "Australia"
      : "United States";

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.hero}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(user?.name || "N").charAt(0).toUpperCase()}
          </Text>
        </View>

        <View>
          <Text style={styles.name}>{user?.name || "Guest User"}</Text>
          <Text style={styles.email}>{user?.email || "Not signed in"}</Text>
          <Text style={styles.region}>Region: {regionLabel}</Text>
        </View>
      </View>

      <View style={styles.menuCard}>
        <MenuRow
          icon="calendar-outline"
          title="Meal Plan Settings"
          subtitle="Family size, plan days, start day"
          onPress={() => router.push("/meal-settings")}
        />

        <MenuRow
          icon="notifications-outline"
          title="Preferences & Reminders"
          subtitle="Fruit plan, appetizer, meal reminders"
          onPress={() => router.push("/preferences")}
        />

        <MenuRow
          icon="fitness-outline"
          title="Health Insights"
          subtitle="Weekly nutrition and meal balance"
          onPress={openHealthInsights}
        />

                <MenuRow
          icon="person-circle-outline"
          title="Edit Profile Photo"
          subtitle="Add or update your community avatar"
          onPress={() => router.push("/edit-profile")}
        />

        <MenuRow
          icon="bookmark-outline"
          title="Saved Posts"
          subtitle="View recipes and posts you saved"
          onPress={() => router.push("/saved-posts")}
        />

        <MenuRow
          icon="chatbubble-ellipses-outline"
          title="Send Feedback"
          subtitle="Share bugs, ideas, or suggestions"
          onPress={() => router.push("/feedback")}
        />
{isAdmin && (
  <MenuRow
    icon="speedometer-outline"
    title="Admin Dashboard"
    subtitle="Users, feedback, and growth metrics"
    onPress={() => router.push("/admin")}
  />
)}
        <MenuRow
          icon="document-text-outline"
          title="Legal & Support"
          subtitle="Privacy, terms, contact, delete account"
          onPress={() => router.push("/legal-support")}
        />
      </View>
      <Pressable style={styles.logoutBtn} onPress={handleSignOut}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </Pressable>
    </ScrollView>
  );
}

function MenuRow({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: any;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={styles.iconBox}>
        <Ionicons name={icon} size={22} color="#15803d" />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{title}</Text>
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
  hero: {
    backgroundColor: "#15803d",
    borderRadius: 30,
    padding: 22,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 22,
  },
  avatar: {
    width: 66,
    height: 66,
    borderRadius: 999,
    backgroundColor: "#dcfce7",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#14532d",
    fontSize: 28,
    fontWeight: "900",
  },
  name: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "900",
  },
  email: {
    color: "#dcfce7",
    marginTop: 4,
    fontWeight: "700",
  },
  region: {
    color: "#bbf7d0",
    marginTop: 5,
    fontWeight: "800",
    fontSize: 12,
  },
  menuCard: {
    backgroundColor: "#fff",
    borderRadius: 28,
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
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: "#f0fdf4",
    alignItems: "center",
    justifyContent: "center",
  },
  rowTitle: {
    color: "#0f172a",
    fontWeight: "900",
    fontSize: 16,
  },
  rowSub: {
    color: "#64748b",
    marginTop: 4,
    fontWeight: "700",
    fontSize: 12,
  },
  logoutBtn: {
    marginTop: 22,
    backgroundColor: "#fff1f2",
    borderWidth: 1,
    borderColor: "#fecdd3",
    padding: 18,
    borderRadius: 24,
    alignItems: "center",
  },
  logoutText: {
    color: "#be123c",
    fontWeight: "900",
    fontSize: 16,
  },
});