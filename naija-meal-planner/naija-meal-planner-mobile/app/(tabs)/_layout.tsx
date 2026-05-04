import { Tabs } from "expo-router";
import PremiumTabBar from "../../components/PremiumTabBar";

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <PremiumTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="meals" />
      <Tabs.Screen name="prices" />
      <Tabs.Screen name="groceries" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}