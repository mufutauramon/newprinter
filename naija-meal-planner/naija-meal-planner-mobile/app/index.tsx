import { useState } from "react";
import SafeImage from "../components/SafeImage";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  Dimensions,
} from "react-native";
import { router } from "expo-router";


const { width } = Dimensions.get("window");

const slides = [
  {
    title: "Plan better meals for your family",
    text: "Create Nigerian meal plans, track recipes, and organize meals in one place.",
    emoji: "🍲",
  },
  {
    title: "Shop smarter with groceries",
    text: "Generate grocery lists automatically from your meal timetable.",
    emoji: "🛒",
  },
  {
    title: "Control your food budget",
    text: "Track market prices, compare stores, and estimate your grocery cost.",
    emoji: "💵",
  },
];

export default function Welcome() {
  const [step, setStep] = useState(0);

  const slide = slides[step];
  const isLast = step === slides.length - 1;

  const goNext = () => {
    if (isLast) {
      router.push("/signup");
      return;
    }

    setStep((prev) => prev + 1);
  };

  return (
    <View style={styles.screen}>
      <View style={styles.hero}>
        <Text style={styles.appName}>Naija Meal Planner</Text>

        <View style={styles.logoCircle}>
          <SafeImage
            source={require("../assets/images/icon.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.emoji}>{slide.emoji}</Text>

        <Text style={styles.title}>{slide.title}</Text>

        <Text style={styles.subtitle}>{slide.text}</Text>

        <View style={styles.dots}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[styles.dot, index === step && styles.dotActive]}
            />
          ))}
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable style={styles.primaryBtn} onPress={goNext}>
          <Text style={styles.primaryText}>
            {isLast ? "Get Started" : "Next"}
          </Text>
        </Pressable>

        <Pressable
          style={styles.secondaryBtn}
          onPress={() => router.push("/signin")}
        >
          <Text style={styles.secondaryText}>Log In</Text>
        </Pressable>

        {!isLast && (
          <Pressable onPress={() => router.push("/signup")}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#064e3b",
    padding: 24,
    justifyContent: "space-between",
  },
  hero: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  appName: {
    color: "#ecfdf5",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 24,
  },
  logoCircle: {
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: "#fef3c7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 22,
    overflow: "hidden",
  },
  logo: {
    width: 170,
    height: 170,
  },
  emoji: {
    fontSize: 42,
    marginBottom: 12,
  },
  title: {
    color: "#fff",
    fontSize: 27,
    fontWeight: "900",
    textAlign: "center",
    lineHeight: 34,
    marginBottom: 12,
    maxWidth: width - 50,
  },
  subtitle: {
    color: "#d1fae5",
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 320,
  },
  dots: {
    flexDirection: "row",
    gap: 8,
    marginTop: 28,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 99,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  dotActive: {
    width: 28,
    backgroundColor: "#d4a72c",
  },
  actions: {
    paddingBottom: 32,
    gap: 14,
  },
  primaryBtn: {
    backgroundColor: "#d4a72c",
    padding: 18,
    borderRadius: 16,
    alignItems: "center",
  },
  primaryText: {
    color: "#052e16",
    fontWeight: "900",
    fontSize: 16,
  },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    backgroundColor: "rgba(255,255,255,0.06)",
    padding: 18,
    borderRadius: 16,
    alignItems: "center",
  },
  secondaryText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 16,
  },
  skipText: {
    color: "#d1fae5",
    textAlign: "center",
    fontWeight: "800",
    marginTop: 4,
  },
});