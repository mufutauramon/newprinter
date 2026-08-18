import { useEffect } from "react";
import { Stack, router, useSegments } from "expo-router";
import "../lib/google";
import { AppProvider, useAppContext } from "../context/AppContext";
import { initPurchases } from "../lib/purchases";
import { checkAppUpdate } from "../utils/checkAppUpdate";

function AuthGate() {
  const { token, authReady, user } = useAppContext();
  const segments = useSegments();

  useEffect(() => {
    if (!authReady) return;

    const firstSegment = String(segments[0] || "");

    const publicScreens = [
      "",
      "signin",
      "signup",
      "forgot-password",
      "reset-password",
    ];

    const inPublicScreen = publicScreens.includes(firstSegment);
    const inOnboarding = firstSegment === "onboarding";

    if (!token && !inPublicScreen) {
      router.replace("/");
      return;
    }

    if (token && user && Number(user.onboarding_completed || 0) !== 1) {
      if (!inOnboarding) {
        router.replace("/onboarding" as any);
      }
      return;
    }

    if (token && inPublicScreen) {
      router.replace("/(tabs)");
      return;
    }
  }, [token, authReady, user, segments]);

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  useEffect(() => {
    initPurchases();
  }, []);
useEffect(() => {
  checkAppUpdate();
}, []);
  return (
    <AppProvider>
      <AuthGate />
    </AppProvider>
  );
}