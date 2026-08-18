import { View, Text, Pressable, StyleSheet } from "react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TabActions } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { apiFetch } from "../utils/api";
import { useAppContext } from "../context/AppContext";
import { DeviceEventEmitter } from "react-native";
const TAB_META: Record<string, { label: string; icon: string }> = {
  index: { label: "Home", icon: "⌂" },
  meals: { label: "Meals", icon: "🍽️" },
  prices: { label: "Market", icon: "🏪" },
  groceries: { label: "Grocery", icon: "🛒" },
  community: { label: "Community", icon: "👥" },
  settings: { label: "More", icon: "•••" },
};

export default function PremiumTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { user,token } = useAppContext();
const [unreadCount, setUnreadCount] = useState(0);

useEffect(() => {
  const loadCount = async () => {
    try {
      if (!token) return;

      const data = await apiFetch<any>(
        "/api/community/notifications",
        { token }
      );

      if (data.ok) {
        setUnreadCount(Number(data.unreadCount || 0));
      }
    } catch (err) {
      console.log("Notification count failed:", err);
    }
  };

  loadCount();
}, [user?.id, state.index, token]);
useEffect(() => {
  const sub = DeviceEventEmitter.addListener(
    "communityNotificationsRead",
    () => {
      setUnreadCount(0);
    }
  );

  return () => sub.remove();
}, []);
  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.wrapper,
        { paddingBottom: Math.max(insets.bottom, 10) },
      ]}
    >
      <View style={styles.bar} pointerEvents="auto">
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const meta = TAB_META[route.name] || {
            label: route.name,
            icon: "•",
          };

          const { options } = descriptors[route.key];

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!event.defaultPrevented) {
              navigation.dispatch({
                ...TabActions.jumpTo(route.name),
                target: state.key,
              });
            }
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={onPress}
              style={({ pressed }) => [
                styles.tabItem,
                focused && styles.activeTab,
                pressed && { opacity: 0.7 },
              ]}
            >
             <View style={styles.iconWrap}>
  <Text style={[styles.icon, focused && styles.activeIcon]}>
    {meta.icon}
  </Text>

  {route.name === "community" && unreadCount > 0 && (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>
        {unreadCount > 99 ? "99+" : unreadCount}
      </Text>
    </View>
  )}
</View>
              <Text style={[styles.label, focused && styles.activeLabel]}>
                {meta.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 10,
    right: 10,
    bottom: 8,
    zIndex: 99999,
    elevation: 99999,
  },

  bar: {
    backgroundColor: "rgba(255,255,255,0.98)",
    borderRadius: 30,
    paddingHorizontal: 6,
    paddingTop: 8,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#0f172a",
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 50,
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.06)",
  },

  tabItem: {
    flex: 1,
    minHeight: 56,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
  },

  activeTab: {
    backgroundColor: "#e8f7ef",
  },

  icon: {
    fontSize: 17,
    marginBottom: 2,
    color: "#94a3b8",
  },

  activeIcon: {
    color: "#0f7a43",
  },

  label: {
    fontSize: 9,
    fontWeight: "800",
    color: "#94a3b8",
  },

  activeLabel: {
    color: "#0f7a43",
    fontWeight: "900",
  },
  iconWrap: {
  position: "relative",
},

badge: {
  position: "absolute",
  top: -8,
  right: -14,
  backgroundColor: "#dc2626",
  minWidth: 18,
  height: 18,
  borderRadius: 9,
  alignItems: "center",
  justifyContent: "center",
  paddingHorizontal: 4,
},

badgeText: {
  color: "#fff",
  fontSize: 10,
  fontWeight: "900",
},
});