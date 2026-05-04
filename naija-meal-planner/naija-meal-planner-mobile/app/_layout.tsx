import { useEffect } from "react";
import { Stack, router, useSegments } from "expo-router";
import { AppProvider, useAppContext } from "../context/AppContext";
import { initPurchases } from "../lib/purchases";
function AuthGate() {
  const { token, authReady } = useAppContext();
  const segments = useSegments();

  useEffect(() => {
    if (!authReady) return;

    const inAuthScreen = segments[0] === "signin" || segments[0] === "signup";

    if (!token && !inAuthScreen) {
      router.replace("/signin");
    }

    if (token && inAuthScreen) {
      router.replace("/(tabs)");
    }
  }, [token, authReady, segments]);

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  useEffect(() => {
  initPurchases();
}, []);
  return (
    <AppProvider>
      <AuthGate />
    </AppProvider>
  );
}


