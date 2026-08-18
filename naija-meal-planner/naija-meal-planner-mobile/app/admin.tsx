import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAppContext } from "../context/AppContext";
import { apiFetch } from "../utils/api";

const ADMIN_EMAILS = ["amufutau@unilag.edu.ng"];

export default function AdminDashboard() {
  const { user } = useAppContext();

  const [loading, setLoading] = useState(true);
  const [showCountries, setShowCountries] = useState(false);
 const [stats, setStats] = useState({
  totalUsers: 0,
  totalFeedback: 0,

  todaySignups: 0,
  weekSignups: 0,
  monthSignups: 0,

  activeSubscribers: 0,
  freeUsers: 0,

  monthlySubscribers: 0,
  yearlySubscribers: 0,

  estimatedMonthlyRevenue: 0,

  countryBreakdown: [] as any[],

  totalMealCheckins: 0,
  activeMealUsers: 0,
  waterEntries: 0,
  healthRecords: 0,
  activeToday: 0,
});
  const isAdmin = ADMIN_EMAILS.includes(
    String(user?.email || "").toLowerCase()
  );

  useEffect(() => {
    if (!isAdmin) return;

    async function loadStats() {
      try {
        setLoading(true);

      const data = await apiFetch<{
  ok: boolean;

  totalUsers: number;
  totalFeedback: number;

  todaySignups: number;
  weekSignups: number;
  monthSignups: number;

  activeSubscribers: number;
  freeUsers: number;

  monthlySubscribers: number;
  yearlySubscribers: number;

  estimatedMonthlyRevenue: number;

  countryBreakdown: any[];
  totalMealCheckins: number;
  activeMealUsers: number;
  waterEntries: number;
  healthRecords: number;
  activeToday: number;

  error?: string;
}>("/api/admin/stats");
        if (!data.ok) {
          throw new Error(data.error || "Unable to load admin stats.");
        }

setStats({
  totalUsers: data.totalUsers || 0,
  totalFeedback: data.totalFeedback || 0,

  todaySignups: data.todaySignups || 0,
  weekSignups: data.weekSignups || 0,
  monthSignups: data.monthSignups || 0,

  activeSubscribers: data.activeSubscribers || 0,
  freeUsers: data.freeUsers || 0,

  monthlySubscribers: data.monthlySubscribers || 0,
  yearlySubscribers: data.yearlySubscribers || 0,

  estimatedMonthlyRevenue:
    data.estimatedMonthlyRevenue || 0,

  countryBreakdown: data.countryBreakdown || [],
  totalMealCheckins: data.totalMealCheckins || 0,
activeMealUsers: data.activeMealUsers || 0,
waterEntries: data.waterEntries || 0,
healthRecords: data.healthRecords || 0,
activeToday: data.activeToday || 0,
});
      } catch (err: any) {
        Alert.alert("Admin Error", err?.message || "Could not load stats.");
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <View style={styles.blockedScreen}>
        <Text style={styles.blockedTitle}>Access Restricted</Text>
        <Text style={styles.blockedText}>
          This page is only available to the app administrator.
        </Text>

        <Pressable style={styles.backHomeBtn} onPress={() => router.back()}>
          <Text style={styles.backHomeText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Pressable style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={24} color="#0f172a" />
        <Text style={styles.backText}>Back</Text>
      </Pressable>

      <Text style={styles.title}>Admin Dashboard</Text>

      <Text style={styles.subtitle}>
        Track early growth and user feedback for Naija Meal Planner.
      </Text>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color="#0f7a43" />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      ) : (
        <>
<View style={styles.grid}>
  <StatCard
    icon="people-outline"
    label="Users"
    value={stats.totalUsers}
  />

  <StatCard
    icon="person-add-outline"
    label="Today"
    value={stats.todaySignups}
  />

  <StatCard
    icon="calendar-outline"
    label="This Week"
    value={stats.weekSignups}
  />

  <StatCard
    icon="trending-up-outline"
    label="This Month"
    value={stats.monthSignups}
  />

  <StatCard
    icon="diamond-outline"
    label="Pro Users"
    value={stats.activeSubscribers}
  />

  <StatCard
    icon="person-outline"
    label="Free Users"
    value={stats.freeUsers}
  />

  <StatCard
    icon="cash-outline"
    label="Revenue"
    value={`$${stats.estimatedMonthlyRevenue.toFixed(2)}`}
  />
   <StatCard
    icon="chatbubble-outline"
    label="Feedback"
    value={stats.totalFeedback}
  />
</View>

<View style={styles.subscriptionCard}>
  <Text style={styles.subscriptionTitle}>
    Subscription Overview
  </Text>

  <View style={styles.subscriptionRow}>
    <Text style={styles.subscriptionLabel}>
      Active Subscribers
    </Text>

    <Text style={styles.subscriptionValue}>
      {stats.activeSubscribers}
    </Text>
  </View>

  <View style={styles.subscriptionRow}>
    <Text style={styles.subscriptionLabel}>
      Monthly Plans
    </Text>

    <Text style={styles.subscriptionValue}>
      {stats.monthlySubscribers}
    </Text>
  </View>

  <View style={styles.subscriptionRow}>
    <Text style={styles.subscriptionLabel}>
      Yearly Plans
    </Text>

    <Text style={styles.subscriptionValue}>
      {stats.yearlySubscribers}
    </Text>
  </View>
</View>
<View style={styles.actionsCard}>
  <Text style={styles.actionsTitle}>View Details</Text>

  <AdminAction
    icon="people-outline"
    title="View Users"
    subtitle="See registered users"
    onPress={() => router.push("/admin-users")}
  />

  <AdminAction
    icon="chatbubble-ellipses-outline"
    title="View Feedback"
    subtitle="Read user feedback"
    onPress={() => router.push("/admin-feedback")}
  />
  <AdminAction
  icon="mail-outline"
  title="Email Campaigns"
  subtitle="Send announcements to users"
  onPress={() => router.push("/admin-email-campaign")}
/>
  <AdminAction
    icon="card-outline"
    title="View Subscribers"
    subtitle="See active subscriptions"
    onPress={() => router.push("/admin-subscribers")}
  />
  <AdminAction
  icon="flag-outline"
  title="Community Reports"
  subtitle="Review reported posts"
  onPress={() => router.push("/admin-community-reports")}
/>
<AdminAction
  icon="notifications-outline"
  title="Push Update Alert"
  subtitle="Notify users about app updates"
  onPress={() => router.push("/admin-push-update")}
/>
<AdminAction
  icon="logo-youtube"
  title="Recipe Videos"
  subtitle="Manage recipe YouTube links"
  onPress={() => router.push("/admin-recipe-videos")}
/>
</View>
<View style={styles.countryCard}>
  <Pressable
    style={styles.countryHeader}
    onPress={() => setShowCountries((prev) => !prev)}
  >
    <Text style={styles.countryTitle}>Users by Country</Text>

    <Ionicons
      name={showCountries ? "chevron-up" : "chevron-down"}
      size={22}
      color="#15803d"
    />
  </Pressable>

  {showCountries && (
    <View style={styles.countryList}>
      {stats.countryBreakdown.length === 0 ? (
        <Text style={styles.countryEmpty}>No country data yet</Text>
      ) : (
        stats.countryBreakdown.map((item: any, index: number) => (
          <View key={index} style={styles.countryRow}>
            <Text style={styles.countryName}>{item.country}</Text>
            <Text style={styles.countryCount}>{item.count}</Text>
          </View>
        ))
      )}
    </View>
  )}
</View>
        </>
      )}
      <View style={styles.engagementCard}>
  <Text style={styles.engagementTitle}>
    Engagement Metrics
  </Text>

  <MetricRow
    label="Active Users Today"
    value={stats.activeToday}
  />

  <MetricRow
    label="Users Tracking Meals"
    value={stats.activeMealUsers}
  />

  <MetricRow
    label="Meal Check-ins"
    value={stats.totalMealCheckins}
  />

  <MetricRow
    label="Water Logs"
    value={stats.waterEntries}
  />

  <MetricRow
    label="Health Records"
    value={stats.healthRecords}
  />
</View>
    </ScrollView>
  );
}
function AdminAction({
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
    <Pressable style={styles.actionRow} onPress={onPress}>
      <View style={styles.actionIcon}>
        <Ionicons name={icon} size={22} color="#15803d" />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionSub}>{subtitle}</Text>
      </View>

      <Ionicons name="chevron-forward" size={22} color="#94a3b8" />
    </Pressable>
  );
}
function MetricRow({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 12,
      }}
    >
      <Text
        style={{
          color: "#64748b",
          fontWeight: "700",
        }}
      >
        {label}
      </Text>

      <Text
        style={{
          color: "#0f7a43",
          fontWeight: "900",
        }}
      >
        {value}
      </Text>
    </View>
  );
}
function StatCard({
  icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: number | string;
}) {
  return (
    <View style={styles.statCard}>
      <View style={styles.iconBox}>
        <Ionicons name={icon} size={24} color="#15803d" />
      </View>

      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
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
    paddingBottom: 80,
  },

  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },

  backText: {
    color: "#0f172a",
    fontWeight: "900",
    fontSize: 16,
  },

  title: {
    color: "#0f172a",
    fontSize: 34,
    fontWeight: "900",
  },

  subtitle: {
    color: "#64748b",
    marginTop: 10,
    lineHeight: 22,
    marginBottom: 22,
    fontWeight: "700",
  },

  grid: {
  flexDirection: "row",
  flexWrap: "wrap",
  gap: 14,
},

  statCard: {
  width: "47%",
    backgroundColor: "#fff",
    borderRadius: 26,
    padding: 20,
    alignItems: "center",
  },

  iconBox: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: "#dcfce7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  statValue: {
    color: "#0f172a",
    fontSize: 34,
    fontWeight: "900",
  },

  statLabel: {
    color: "#64748b",
    fontWeight: "800",
    marginTop: 4,
  },

  loadingBox: {
    backgroundColor: "#fff",
    borderRadius: 26,
    padding: 24,
    alignItems: "center",
  },

  loadingText: {
    marginTop: 12,
    color: "#64748b",
    fontWeight: "800",
  },

  noteCard: {
    backgroundColor: "#dcfce7",
    borderRadius: 24,
    padding: 18,
    marginTop: 18,
  },

  noteTitle: {
    color: "#166534",
    fontWeight: "900",
    fontSize: 16,
    marginBottom: 8,
  },

  noteText: {
    color: "#14532d",
    lineHeight: 22,
    fontWeight: "700",
  },

  blockedScreen: {
    flex: 1,
    backgroundColor: "#eef7f0",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },

  blockedTitle: {
    color: "#0f172a",
    fontSize: 28,
    fontWeight: "900",
    marginBottom: 10,
  },

  blockedText: {
    color: "#64748b",
    textAlign: "center",
    lineHeight: 22,
    fontWeight: "700",
    marginBottom: 20,
  },

  backHomeBtn: {
    backgroundColor: "#0f7a43",
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 18,
  },

  backHomeText: {
    color: "#fff",
    fontWeight: "900",
  },
  subscriptionCard: {
  backgroundColor: "#ffffff",
  borderRadius: 24,
  padding: 20,
  marginTop: 18,
},

subscriptionTitle: {
  fontSize: 18,
  fontWeight: "900",
  color: "#0f172a",
  marginBottom: 14,
},

subscriptionRow: {
  flexDirection: "row",
  justifyContent: "space-between",
  marginBottom: 12,
},

subscriptionLabel: {
  color: "#64748b",
  fontWeight: "700",
},

subscriptionValue: {
  color: "#15803d",
  fontWeight: "900",
  fontSize: 16,
},
actionsCard: {
  backgroundColor: "#fff",
  borderRadius: 24,
  padding: 18,
  marginTop: 18,
},

actionsTitle: {
  color: "#0f172a",
  fontSize: 18,
  fontWeight: "900",
  marginBottom: 10,
},

actionRow: {
  flexDirection: "row",
  alignItems: "center",
  paddingVertical: 14,
  borderBottomWidth: 1,
  borderBottomColor: "#e5e7eb",
},

actionIcon: {
  width: 46,
  height: 46,
  borderRadius: 16,
  backgroundColor: "#dcfce7",
  alignItems: "center",
  justifyContent: "center",
  marginRight: 12,
},

actionTitle: {
  color: "#0f172a",
  fontWeight: "900",
  fontSize: 15,
},

actionSub: {
  color: "#64748b",
  fontWeight: "700",
  marginTop: 3,
  fontSize: 12,
},
countryCard: {
  backgroundColor: "#dcfce7",
  borderRadius: 24,
  padding: 18,
  marginTop: 18,
},

countryHeader: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
},

countryTitle: {
  color: "#166534",
  fontWeight: "900",
  fontSize: 16,
},

countryList: {
  marginTop: 12,
},

countryRow: {
  flexDirection: "row",
  justifyContent: "space-between",
  paddingVertical: 8,
  borderTopWidth: 1,
  borderTopColor: "rgba(21, 128, 61, 0.15)",
},

countryName: {
  color: "#14532d",
  fontWeight: "800",
},

countryCount: {
  color: "#14532d",
  fontWeight: "900",
},

countryEmpty: {
  color: "#64748b",
  fontWeight: "700",
  marginTop: 10,
},
engagementCard: {
  backgroundColor: "#fff",
  borderRadius: 24,
  padding: 18,
  marginTop: 18,
},

engagementTitle: {
  fontSize: 18,
  fontWeight: "900",
  color: "#0f172a",
},
});