import { BlurView } from "expo-blur";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Pressable, StyleSheet, Text, View } from "react-native";

const icons: any = {
  index: { type: "ion", active: "home", inactive: "home-outline", label: "Home" },
  meals: { type: "material", active: "restaurant-menu", inactive: "restaurant-menu", label: "Meals" },
  prices: { type: "ion", active: "cash", inactive: "cash-outline", label: "Prices" },
  groceries: { type: "ion", active: "cart", inactive: "cart-outline", label: "Grocery" },
  settings: { type: "ion", active: "settings", inactive: "settings-outline", label: "Settings" },
};

export default function PremiumTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  return (
    <View style={styles.wrapper}>
      <BlurView intensity={85} tint="light" style={styles.bar}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const item = icons[route.name];

          if (!item) return null;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const color = focused ? "#0f7a43" : "#94a3b8";

          const Icon =
            item.type === "material" ? MaterialIcons : Ionicons;

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={[styles.tabItem, focused && styles.activeTab]}
            >
              <Icon
                name={focused ? item.active : item.inactive}
                size={focused ? 24 : 22}
                color={color}
              />
              <Text style={[styles.label, focused && styles.activeLabel]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </BlurView>

      <Pressable style={styles.fab}>
        <Ionicons name="add" size={30} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 18,
    height: 86,
    justifyContent: "center",
  },
  bar: {
    height: 72,
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.82)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    shadowColor: "#0f172a",
    shadowOpacity: 0.18,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.75)",
  },
  tabItem: {
    flex: 1,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
  },
  activeTab: {
    backgroundColor: "rgba(15,122,67,0.10)",
  },
  label: {
    fontSize: 11,
    color: "#94a3b8",
    fontWeight: "800",
    marginTop: 3,
  },
  activeLabel: {
    color: "#0f7a43",
  },
  fab: {
    position: "absolute",
    alignSelf: "center",
    top: -20,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#0f7a43",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0f7a43",
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 20,
    borderWidth: 4,
    borderColor: "#f4f8f5",
  },
});