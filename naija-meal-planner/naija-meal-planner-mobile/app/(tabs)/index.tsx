//(tabs)/index.tsx
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { useAppContext } from "../../context/AppContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import SafeImage from "../../components/SafeImage";
function cleanMealName(meal?: string) {
  return String(meal || "")
    .replace(/\bNigerian\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}
function getMealImage(title: string) {
  const name = String(title || "").toLowerCase();
if (name.includes("pap")&& name.includes("akara")) return require("../../assets/meals/pap-akara.png");
if (name.includes("akara")&& name.includes("bread")) return require("../../assets/meals/akara-bread.png");
if (name.includes("fried rice")&& name.includes("chicken")) return require("../../assets/meals/fried-rice-chicken.png");
if (name.includes("ogbono")&& name.includes("eba")) return require("../../assets/meals/ogbono-eba.png");
if (name.includes("bread") && name.includes("egg") && name.includes("tea")) {return require("../../assets/meals/bread-egg-tea.png");}
if (name.includes("white rice") && name.includes("stew") && name.includes("beef")) {return require("../../assets/meals/white-rice-stew-beef.png");}
if (name.includes("white rice") && name.includes("stew") && name.includes("chicken")) {return require("../../assets/meals/white-rice-stew-chicken.jpeg");}
if (name.includes("vegetable soup")&& name.includes("semo")) return require("../../assets/meals/vegetable-soup-semo.png");
if (name.includes("oats")&& name.includes("milk")) return require("../../assets/meals/oats-milk.png");
if (name.includes("okro")&& name.includes("eba")) return require("../../assets/meals/okro-eba.png");
if (name.includes("toast")&& name.includes("omelette")) return require("../../assets/meals/toast-omelette.jpeg");
if (name.includes("fried rice")&& name.includes("chicken")) return require("../../assets/meals/fried-rice-chicken.png");
if (name.includes("yam")&& name.includes("egg sauce")) return require("../../assets/meals/yam-egg-sauce.png");
if (name.includes("yam porridge")&& name.includes("beef")) return require("../../assets/meals/yam-porridge-beef.png");
if (name.includes("amala")&& name.includes("ewedu")) return require("../../assets/meals/amala-ewedu.png");
if (name.includes("custard")&& name.includes("bread")) return require("../../assets/meals/custard-bread.png");
if (name.includes("fisherman soup")) return require("../../assets/meals/fisherman-soup.jpeg");
if (name.includes("spaghetti")) return require("../../assets/meals/jollof-spaghetti.png");
if (name.includes("pepper")) return require("../../assets/meals/pepper-soup.png");
if (name.includes("beans porridge")) return require("../../assets/meals/beans-porridge.png");
if (name.includes("egusi")&& name.includes("eba")) return require("../../assets/meals/egusi-eba.png");
if (name.includes("egusi")&& name.includes("pounded yam")) return require("../../assets/meals/egusi-pounded-yam.png");
if (name.includes("rice")&& name.includes("beans")) return require("../../assets/meals/rice-beans.png");
if (name.includes("akara")&& name.includes("bread")) return require("../../assets/meals/akara-bread.png");
if (name.includes("okro")&& name.includes("pounded yam")) return require("../../assets/meals/okro-pounded-yam.png");
if (name.includes("moi moi")&& name.includes("pap")) return require("../../assets/meals/moi-moi-pap.png"); 
if (name.includes("ofada rice")&& name.includes("sauce")) return require("../../assets/meals/ofada-rice-sauce.png");
if (name.includes("pancakes")&& name.includes("syrup")) return require("../../assets/meals/pancakes-syrup.png");
if (name.includes("coconut rice")&& name.includes("chicken")) return require("../../assets/meals/coconut-rice-chicken.jpeg");
if (name.includes("cornflakes")&& name.includes("milk")) return require("../../assets/meals/cornflakes-milk.png");
if (name.includes("noodles")&& name.includes("egg")) return require("../../assets/meals/noodles-egg.png");
if (name.includes("indomie")&& name.includes("chicken")) return require("../../assets/meals/indomie-chicken.jpeg");
if (name.includes("banga soup")&& name.includes("starch")) return require("../../assets/meals/banga-soup-starch.jpeg");
if (name.includes("plantain")&& name.includes("egg")) return require("../../assets/meals/plantain-egg.jpeg");
if (name.includes("jollof spaghetti")&& name.includes("chicken")) return require("../../assets/meals/jollof-spaghetti-chicken.jpeg");
if (name.includes("jollof rice")&& name.includes("chicken")) return require("../../assets/meals/jollof-rice-chicken.png");
if (name.includes("afang soup")&& name.includes("fufu")) return require("../../assets/meals/afang-soup-fufu.jpeg");
if (name.includes("golden morn")&& name.includes("milk")) return require("../../assets/meals/golden-morn-milk.jpeg");
if (name.includes("beans")&& name.includes("plantain")) return require("../../assets/meals/beans-plantain.jpeg");
if (name.includes("oha soup")&& name.includes("fufu")) return require("../../assets/meals/oha-soup-fufu.jpeg");
if (name.includes("ewa agoyin")&& name.includes("plantain")) return require("../../assets/meals/ewa-agoyin-plantain.jpeg");
if (name.includes("tea")&& name.includes("toast")) return require("../../assets/meals/tea-toast.jpeg");
if (name.includes("fishermansoup")) return require("../../assets/meals/fisherman-soup.jpeg");
if (name.includes("edikang ikong")) return require("../../assets/meals/edikang-ikong.jpeg");
if (name.includes("chicken shawarma")) return require("../../assets/meals/chicken-shawarma.jpeg");
if (name.includes("masa")) return require("../../assets/meals/masa.jpeg");
if (name.includes("dan wake")) return require("../../assets/meals/dan-wake.jpeg");
if (name.includes("fura da nono")) return require("../../assets/meals/fura-da-nono.jpeg");
if (name.includes("tuwo masara") && name.includes("miyan taushe"))
  return require("../../assets/meals/tuwo-masara-miyan-taushe.jpeg");
if (name.includes("ofada rice")&& name.includes("ayamase")) return require("../../assets/meals/ayamase.jpeg");
if (name.includes("ila alasepo")&& name.includes("eba")) return require("../../assets/meals/alasepo.jpeg");
if (name.includes("gbegiri")&& name.includes("amala")) return require("../../assets/meals/gbegiri-amala.jpeg");
if (name.includes("efo riro")&& name.includes("eba")) return require("../../assets/meals/efo-riro-eba.jpeg");
if (name.includes("koko")&& name.includes("kosai")) return require("../../assets/meals/koko-kosai.jpeg");
if (name.includes("tuwo shinkafa")&& name.includes("miyan kuka")) return require("../../assets/meals/tuwo-shinkafa-miyan-kuka.jpeg");
if (name.includes("kilishi")&& name.includes("salad")) return require("../../assets/meals/kilishi-salad.jpeg");
if (name.includes("tuwo masara")&& name.includes("miyan taushe")) return require("../../assets/meals/tuwo-masara-miyan-taushe.jpeg");
if (name.includes("jollof rice")&& name.includes("beef")) return require("../../assets/meals/jollof-rice-beef.jpeg");
if (name.includes("banga soup")&& name.includes("starch")) return require("../../assets/meals/banga-soup-starch.jpeg");
if (name.includes("yam")&& name.includes("garden egg sauce")) return require("../../assets/meals/yam-garden-egg-sauce.jpeg");
if (name.includes("abacha")&& name.includes("fish")) return require("../../assets/meals/abacha-fish.jpeg");
if (name.includes("onugbu soup")&& name.includes("garri")) return require("../../assets/meals/onugbu-soup-garri.jpeg");
if (name.includes("bread")&& name.includes("egg")) return require("../../assets/meals/bread-egg.jpeg");
if (name.includes("nsala soup")&& name.includes("yam")) return require("../../assets/meals/nsala-soup-yam.jpeg");
if (name.includes("akamu")&& name.includes("akara")) return require("../../assets/meals/pap-akara.png");

 return require("../../assets/meals/jollof-rice-beef.jpeg");
}
export default function Home() {
  const router = useRouter();
  const {
    familySize,
    region,
    monthlyBudget,
    showFruit,
    showAppetizer,
    startDay,
    planDays,
    visibleMeals,
    isPro,
    user,
    planStartDate,
  } = useAppContext();
const getTodayPlanIndex = () => {
  if (!planStartDate) return 0;

  const start = new Date(planStartDate);
  start.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diff = Math.floor(
    (today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  );

  return Math.max(0, Math.min(diff, visibleMeals.length - 1));
};

const [selectedIndex, setSelectedIndex] = useState(0);

useEffect(() => {
  setSelectedIndex(getTodayPlanIndex());
}, [planStartDate, visibleMeals.length]);

const weekDays = useMemo(() => {
  const start = planStartDate ? new Date(planStartDate) : new Date();
  start.setHours(0, 0, 0, 0);

  return Array.from(
    { length: Math.min(7, visibleMeals.length || 7) },
    (_, index) => {
      const d = new Date(start);
      d.setDate(start.getDate() + index);

      return {
        index,
        label: d.toLocaleDateString("en-US", { weekday: "short" }),
        day: d.getDate(),
        active: index === selectedIndex,
      };
    }
  );
}, [planStartDate, selectedIndex, visibleMeals.length]);
const countryMeta =
  region === "ng"
    ? { flag: "🇳🇬", name: "Nigeria" }
    : region === "ca"
    ? { flag: "🇨🇦", name: "Canada" }
    : region === "uk"
    ? { flag: "🇬🇧", name: "United Kingdom" }
    : region === "au"
    ? { flag: "🇦🇺", name: "Australia" }
    : { flag: "🇺🇸", name: "United States" };

const firstName = String(user?.name || "there").split(" ")[0];
  const selectedMeals = visibleMeals[selectedIndex] || visibleMeals[0];

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
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <View style={styles.brandIcon}>
            <Text style={styles.brandEmoji}>🌱</Text>
          </View>
          <Text style={styles.brandText}>Naija Meal Planner</Text>
        </View>

        <Pressable style={styles.bellBtn}>
          <Ionicons name="notifications" size={20} color="#b88714" />
        </Pressable>
      </View>

      <View style={styles.hero}>
        <View>
          <Text style={styles.heroTitle}>Welcome back, {firstName}!</Text>
          <Text style={styles.heroSub}>Your meal plan is ready ✨</Text>
        </View>

        <View style={styles.heroBadge}>
          <Text style={styles.heroBadgeText}>🌿</Text>
        </View>
      </View>
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Your Weekly Plan</Text>
          <Text style={styles.sectionSub}>
            Start day {startDay} • {planDays} days
          </Text>
        </View>

        <Pressable onPress={() => router.push("/(tabs)/meals")}>
          <Ionicons name="chevron-forward" size={24} color="#0f172a" />
        </Pressable>
      </View>

<View style={styles.daysRow}>
  {weekDays.map((day) => (
    <Pressable
      key={`${day.label}-${day.day}`}
      onPress={() => setSelectedIndex(day.index)}
      style={[styles.dayPill, day.active && styles.dayPillActive]}
    >
      <Text style={[styles.dayText, day.active && styles.dayTextActive]}>
        {day.label}
      </Text>

      <Text style={[styles.dayNum, day.active && styles.dayTextActive]}>
        {day.day}
      </Text>
    </Pressable>
  ))}
</View>
{selectedMeals && (
  <View style={styles.mealPreviewRow}>
    <MealPreview title={selectedMeals.breakfast} subtitle="Breakfast" emoji="🍽️" />
    <MealPreview title={selectedMeals.lunch} subtitle="Lunch" emoji="🍚" />
    <MealPreview title={selectedMeals.dinner} subtitle="Dinner" emoji="🥘" />
  </View>
)}

      <View style={styles.aiCard}>
        <View style={{ flex: 1 }}>
          <View style={styles.aiHeader}>
            <Text style={styles.aiTitle}> Recommendation</Text>
          </View>

          <Text style={styles.aiText}>
            We’ve balanced your meals for family size, budget, and grocery needs.
          </Text>

          <Pressable
  style={styles.viewPlanBtn}
  onPress={() => {
    console.log("VIEW FULL PLAN CLICKED");
    router.push("/meals");
  }}
>
  <Text style={styles.viewPlanText}>View Full Plan</Text>
  <Ionicons name="chevron-forward" size={18} color="#0f172a" />
</Pressable>
        </View>

        <View style={styles.glowBadge}>
          <Text style={styles.glowText}>🌿</Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <StatCard icon="👨‍👩‍👧‍👦" label="Family" value={`${familySize} people`} />
        <StatCard icon="💰" label="Budget" value={monthlyBudget} />
        <StatCard icon="🌍" label="Region" value={`${countryMeta.flag} ${countryMeta.name}`} />
        <StatCard icon="⭐" label="Plan" value={isPro ? "Pro" : "Free"} />
      </View>
    </ScrollView>
  );
}

function MealPreview({
  title,
  subtitle,
  emoji,
}: {
  title: string;
  subtitle: string;
  emoji: string;
}) {
  return (
    <View style={styles.mealCard}>
      <View style={styles.foodCircle}>
  <SafeImage
    source={getMealImage(cleanMealName(title))}
    style={styles.foodImage}
    resizeMode="cover"
  />
</View>
<Text numberOfLines={1} style={styles.mealTitle}>
        {cleanMealName(title)}
      </Text>
      <Text numberOfLines={1} style={styles.mealSub}>
        {subtitle}
      </Text>
    </View>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      <Text numberOfLines={1} style={styles.statValue}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f7fbf5",
  },
  content: {
    padding: 20,
    paddingTop: 55,
    paddingBottom: 150,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 22,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  foodImage: {
  width: 76,
  height: 76,
  borderRadius: 999,
},
  brandIcon: {
    width: 30,
    height: 30,
    borderRadius: 999,
    backgroundColor: "#ecfdf5",
    alignItems: "center",
    justifyContent: "center",
  },
  brandEmoji: {
    fontSize: 18,
  },
  brandText: {
    color: "#14532d",
    fontWeight: "900",
    fontSize: 15,
  },
  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: "#fff7d6",
    alignItems: "center",
    justifyContent: "center",
  },
  hero: {
    backgroundColor: "#064e3b",
    borderRadius: 22,
    padding: 20,
    minHeight: 110,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  heroTitle: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 22,
    marginBottom: 8,
  },
  heroSub: {
    color: "#dcfce7",
    fontWeight: "700",
    fontSize: 14,
  },
  heroBadge: {
    width: 72,
    height: 72,
    borderRadius: 999,
    backgroundColor: "#123d25",
    borderWidth: 3,
    borderColor: "#facc15",
    alignItems: "center",
    justifyContent: "center",
  },
  heroBadgeText: {
    fontSize: 32,
  },
  sectionHeader: {
    marginTop: 22,
    marginBottom: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    color: "#0f172a",
    fontSize: 18,
    fontWeight: "900",
  },
   sectionSub: {
    color: "#64748b",
    marginTop: 3,
    fontWeight: "700",
    fontSize: 12,
  },
  daysRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  dayPill: {
    width: 42,
    height: 58,
    borderRadius: 999,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#edf2f7",
  },
  dayPillActive: {
    backgroundColor: "#15803d",
  },
  dayText: {
    color: "#64748b",
    fontWeight: "900",
    fontSize: 11,
  },
  dayNum: {
    color: "#334155",
    fontWeight: "800",
    fontSize: 12,
    marginTop: 4,
  },
  dayTextActive: {
    color: "#fff",
  },
  mealPreviewRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 18,
  },
  mealCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 10,
    minHeight: 155,
    shadowColor: "#0f172a",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  favorite: {
    alignSelf: "flex-end",
    color: "#0f172a",
    fontSize: 18,
  },
  foodCircle: {
    width: 76,
    height: 76,
    borderRadius: 999,
    backgroundColor: "#fff7ed",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 10,
  },
  foodEmoji: {
    fontSize: 40,
  },
  mealTitle: {
    color: "#0f172a",
    fontWeight: "900",
    textAlign: "center",
    fontSize: 13,
  },
  mealSub: {
    color: "#64748b",
    textAlign: "center",
    marginTop: 3,
    fontSize: 11,
    fontWeight: "700",
  },
  aiCard: {
    backgroundColor: "#064e3b",
    borderRadius: 22,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  aiHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  aiTitle: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 17,
  },
  aiText: {
    color: "#dcfce7",
    fontWeight: "700",
    lineHeight: 21,
    marginBottom: 14,
  },
  viewPlanBtn: {
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 8,
  },
  viewPlanText: {
    color: "#0f172a",
    fontWeight: "900",
  },
  glowBadge: {
    width: 76,
    height: 76,
    borderRadius: 999,
    backgroundColor: "#123d25",
    borderWidth: 3,
    borderColor: "#facc15",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  glowText: {
    fontSize: 32,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statCard: {
    width: "48%",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 22,
    shadowColor: "#0f172a",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 1,
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 10,
  },
  statLabel: {
    color: "#64748b",
    fontWeight: "800",
    fontSize: 12,
  },
  statValue: {
    color: "#0f172a",
    fontWeight: "900",
    fontSize: 16,
    marginTop: 5,
  },
  tipBox: {
    backgroundColor: "#dcfce7",
    padding: 20,
    borderRadius: 24,
    marginTop: 16,
  },
  tipTitle: {
    color: "#166534",
    fontWeight: "900",
    marginBottom: 8,
    fontSize: 16,
  },
  tipText: {
    color: "#14532d",
    lineHeight: 22,
    fontWeight: "700",
  },
});