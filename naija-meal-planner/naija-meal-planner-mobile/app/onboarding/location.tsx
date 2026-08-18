import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Modal,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { useOnboarding } from "../../context/OnboardingContext";
import { apiFetch } from "../../utils/api";

type Region = "us" | "ng" | "uk" | "ca" | "au";

const SUPPORTED_COUNTRIES = [
  { region: "us" as Region, iso: "US", label: "🇺🇸 United States" },
  { region: "ng" as Region, iso: "NG", label: "🇳🇬 Nigeria" },
  { region: "uk" as Region, iso: "GB", label: "🇬🇧 United Kingdom" },
  { region: "ca" as Region, iso: "CA", label: "🇨🇦 Canada" },
  { region: "au" as Region, iso: "AU", label: "🇦🇺 Australia" },
];

export default function OnboardingLocation() {
  const {
    region,
    setRegion,
    state,
    setState,
    city,
    setCity,
    countryCode,
    setCountryCode,
  } = useOnboarding();

  const [picker, setPicker] = useState<"country" | "state" | "city" | null>(null);
  const [states, setStates] = useState<any[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);

  const selectedCountry =
    SUPPORTED_COUNTRIES.find((c) => c.region === region || c.iso === countryCode) ||
    SUPPORTED_COUNTRIES[0];

  const loadStates = async (
    iso: string,
    options?: {
      preferredState?: string;
      preferredCity?: string;
      selectFirst?: boolean;
    }
  ) => {
    try {
      setLoadingStates(true);

      const data = await apiFetch<{ ok: boolean; states: any[] }>(
        `/api/location/states?country=${encodeURIComponent(iso)}`
      );

      const list = data.ok ? data.states || [] : [];
      setStates(list);

      if (!list.length) {
        setState("");
        setCity("");
        setCities([]);
        return;
      }

      const matchedState =
        options?.preferredState
          ? list.find(
              (item) =>
                String(item.name).toLowerCase() ===
                String(options.preferredState).toLowerCase()
            )
          : null;

      const nextState =
        matchedState || (options?.selectFirst === false ? null : list[0]);

      if (nextState) {
        setState(nextState.name);
        await loadCities(iso, nextState.name, {
          preferredCity: options?.preferredCity,
          selectFirst: options?.selectFirst !== false,
        });
      }
    } finally {
      setLoadingStates(false);
    }
  };

  const loadCities = async (
    iso: string,
    stateName: string,
    options?: {
      preferredCity?: string;
      selectFirst?: boolean;
    }
  ) => {
    try {
      setLoadingCities(true);

      const data = await apiFetch<{ ok: boolean; cities: string[] }>(
        `/api/location/cities?country=${encodeURIComponent(
          iso
        )}&state=${encodeURIComponent(stateName)}`
      );

      const list = data.ok ? data.cities || [] : [];
      setCities(list);

      if (!list.length) {
        setCity("");
        return;
      }

      const matchedCity =
        options?.preferredCity
          ? list.find(
              (item) =>
                String(item).toLowerCase() ===
                String(options.preferredCity).toLowerCase()
            )
          : null;

      if (matchedCity) {
        setCity(matchedCity);
        return;
      }

      if (options?.selectFirst !== false) {
        setCity(list[0]);
      }
    } finally {
      setLoadingCities(false);
    }
  };

  const autoDetectLocationByIp = async () => {
    try {
      setDetectingLocation(true);

      const data = await apiFetch<{
        ok: boolean;
        countryCode?: string;
        state?: string;
        city?: string;
      }>("/api/location/guess");

      if (!data.ok) {
        await loadStates(selectedCountry.iso);
        return;
      }

      const country = SUPPORTED_COUNTRIES.find(
        (item) => item.iso === String(data.countryCode || "").toUpperCase()
      );

      if (!country) {
        await loadStates(selectedCountry.iso);
        return;
      }

      setRegion(country.region);
      setCountryCode(country.iso);

      await loadStates(country.iso, {
        preferredState: data.state,
        preferredCity: data.city,
        selectFirst: true,
      });
    } catch (err) {
      await loadStates(selectedCountry.iso);
    } finally {
      setDetectingLocation(false);
    }
  };

  useEffect(() => {
    autoDetectLocationByIp();
  }, []);

  const chooseCountry = async (item: (typeof SUPPORTED_COUNTRIES)[number]) => {
    setRegion(item.region);
    setCountryCode(item.iso);
    setState("");
    setCity("");
    setCities([]);
    setPicker(null);

    await loadStates(item.iso, { selectFirst: true });
  };

  const chooseState = async (item: any) => {
    setState(item.name);
    setCity("");
    setPicker(null);

    await loadCities(selectedCountry.iso, item.name, { selectFirst: true });
  };

  const chooseCity = (item: string) => {
    setCity(item);
    setPicker(null);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.step}>Step 2 of 11</Text>

      <Text style={styles.title}>Where should we plan for?</Text>

      <Text style={styles.subtitle}>
        We’ll set your location automatically using your internet connection.
        You can change it below.
      </Text>

      {detectingLocation && (
        <View style={styles.detectingBox}>
          <ActivityIndicator color="#15803d" />
          <Text style={styles.detectingText}>Setting your location...</Text>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.label}>Country</Text>
        <Pressable style={styles.selectBtn} onPress={() => setPicker("country")}>
          <Text style={styles.selectText}>{selectedCountry.label}</Text>
          <Text style={styles.chevron}>⌄</Text>
        </Pressable>

        <Text style={styles.label}>State / Province</Text>
        <Pressable
          style={styles.selectBtn}
          onPress={() => !loadingStates && setPicker("state")}
        >
          <Text style={styles.selectText}>
            {loadingStates ? "Loading states..." : state || "Select state"}
          </Text>
          {loadingStates ? (
            <ActivityIndicator color="#15803d" />
          ) : (
            <Text style={styles.chevron}>⌄</Text>
          )}
        </Pressable>

        <Text style={styles.label}>City</Text>
        <Pressable
          style={styles.selectBtn}
          onPress={() => !loadingCities && setPicker("city")}
        >
          <Text style={styles.selectText}>
            {loadingCities ? "Loading cities..." : city || "Select city"}
          </Text>
          {loadingCities ? (
            <ActivityIndicator color="#15803d" />
          ) : (
            <Text style={styles.chevron}>⌄</Text>
          )}
        </Pressable>
      </View>

      <View style={styles.navRow}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        <Pressable
          style={styles.btn}
          onPress={() => router.push("/onboarding/preferences" as any)}
        >
          <Text style={styles.btnText}>Continue</Text>
        </Pressable>
      </View>

      <Modal visible={!!picker} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              Select{" "}
              {picker === "country"
                ? "Country"
                : picker === "state"
                ? "State"
                : "City"}
            </Text>

            <ScrollView style={{ maxHeight: 420 }}>
              {picker === "country" &&
                SUPPORTED_COUNTRIES.map((item) => (
                  <Pressable
                    key={item.iso}
                    style={styles.modalOption}
                    onPress={() => chooseCountry(item)}
                  >
                    <Text style={styles.modalText}>{item.label}</Text>
                  </Pressable>
                ))}

              {picker === "state" &&
                states.map((item) => (
                  <Pressable
                    key={item.name}
                    style={styles.modalOption}
                    onPress={() => chooseState(item)}
                  >
                    <Text style={styles.modalText}>{item.name}</Text>
                  </Pressable>
                ))}

              {picker === "city" &&
                cities.map((item) => (
                  <Pressable
                    key={item}
                    style={styles.modalOption}
                    onPress={() => chooseCity(item)}
                  >
                    <Text style={styles.modalText}>{item}</Text>
                  </Pressable>
                ))}
            </ScrollView>

            <Pressable style={styles.cancelBtn} onPress={() => setPicker(null)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#eef7f0" },
  content: { padding: 24, paddingTop: 70, paddingBottom: 50 },
  step: {
    color: "#15803d",
    fontWeight: "900",
    textTransform: "uppercase",
    marginBottom: 10,
  },
  title: {
    fontSize: 34,
    fontWeight: "900",
    color: "#0f172a",
    lineHeight: 40,
  },
  subtitle: {
    color: "#64748b",
    fontSize: 15,
    lineHeight: 22,
    marginTop: 10,
    marginBottom: 22,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 28,
    padding: 20,
    marginBottom: 20,
  },
  label: {
    color: "#334155",
    fontWeight: "900",
    fontSize: 15,
    marginBottom: 8,
    marginTop: 12,
  },
  selectBtn: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 20,
    padding: 17,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectText: {
    color: "#0f172a",
    fontWeight: "900",
    fontSize: 16,
  },
  chevron: {
    color: "#15803d",
    fontWeight: "900",
    fontSize: 22,
  },
  navRow: { flexDirection: "row", gap: 12 },
  backBtn: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 22,
    alignItems: "center",
  },
  backText: { color: "#0f172a", fontWeight: "900", fontSize: 16 },
  btn: {
    flex: 1,
    backgroundColor: "#0f7a43",
    padding: 18,
    borderRadius: 22,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "900", fontSize: 16 },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.45)",
    justifyContent: "center",
    padding: 24,
  },
  detectingBox: {
  flexDirection: "row",
  alignItems: "center",
  gap: 8,
  marginBottom: 16,
},

detectingText: {
  color: "#15803d",
  fontWeight: "800",
},
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 28,
    padding: 18,
  },
  modalTitle: {
    color: "#0f172a",
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 12,
  },
  modalOption: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  modalText: {
    color: "#334155",
    fontWeight: "800",
    fontSize: 16,
  },
  cancelBtn: {
    marginTop: 14,
    backgroundColor: "#f1f5f9",
    padding: 16,
    borderRadius: 18,
    alignItems: "center",
  },
  cancelText: {
    color: "#0f172a",
    fontWeight: "900",
  },
});