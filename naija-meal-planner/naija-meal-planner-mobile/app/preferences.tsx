import { router } from "expo-router";
import { useAppContext } from "../context/AppContext";
import {
  ScrollView,
  View,
  Text,
  Switch,
  Pressable,
  StyleSheet,
  Alert,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getErrorMessage } from "../utils/errorMessage";
import { getScheduledReminderCount } from "../utils/notifications";
import { useEffect, useState } from "react";
import { checkIsPro } from "../lib/purchases";
import {
  getReminderSettings,
  updateReminderSetting,
  type ReminderKey,
  type ReminderSettings,
  sendTestNotification,
} from "../utils/notifications";

export default function Preferences() {
  const [mealReminders, setMealReminders] = useState(false);
  const [scheduledCount, setScheduledCount] = useState(0);
  const [isPro, setIsPro] = useState(false);
  const {
    showFruit,
    setShowFruit,
    showAppetizer,
    setShowAppetizer,
  } = useAppContext();

 
const reminderLabels: Record<ReminderKey, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  water: "Water",
};

const [reminders, setReminders] = useState<ReminderSettings | null>(null);

useEffect(() => {
  getReminderSettings().then(setReminders);
}, []);
useEffect(() => {
  getReminderSettings().then(setReminders);
  getScheduledReminderCount().then(setScheduledCount);

  checkIsPro().then(setIsPro);
}, []);
const toggleReminder = async (key: ReminderKey) => {
  if (!reminders) return;

  const nextEnabled = !reminders[key].enabled;

  if (key === "water") {
    const updated = await updateReminderSetting("water", {
      enabled: nextEnabled,
    });

    setReminders(updated);
    getScheduledReminderCount().then(setScheduledCount);
    Alert.alert(
      "Reminder updated",
      nextEnabled
        ? "Reminder has been enabled."
        : "Reminder has been disabled."
    );
    return;
  }

  const updated = await updateReminderSetting(key, {
    enabled: nextEnabled,
    followUpEnabled: nextEnabled ? reminders[key].followUpEnabled : false,
  });

  setReminders(updated);
  getScheduledReminderCount().then(setScheduledCount);
    Alert.alert(
    "Reminder updated",
    nextEnabled
      ? "Reminder has been enabled."
      : "Reminder has been disabled."
  );
};
function formatWaterInterval(startHour: number, startMinute: number, endHour: number, endMinute: number, cups: number) {
  if (cups <= 1) return "One reminder only";

  const startTotal = startHour * 60 + startMinute;
  const endTotal = endHour * 60 + endMinute;
  const duration = endTotal - startTotal;

  if (duration <= 0) return "Invalid time range";

  const interval = Math.round(duration / (cups - 1));
  const h = Math.floor(interval / 60);
  const m = interval % 60;

  if (h > 0 && m > 0) return `Reminder every ${h} hour ${m} minutes`;
  if (h > 0) return `Reminder every ${h} hour`;
  return `Reminder every ${m} minutes`;
}
function formatReminderTime(hour: number, minute: number) {
  const ampm = hour >= 12 ? "PM" : "AM";

  const h = hour % 12 === 0 ? 12 : hour % 12;

  return `${h}:${String(minute).padStart(2, "0")} ${ampm}`;
}
const mealReminderKeys = ["breakfast", "lunch", "dinner"] as const;
function WaterTimeEditor({
  hour,
  minute,
  enabled,
  onChange,
}: {
  hour: number;
  minute: number;
  enabled: boolean;
  onChange: (hour: number, minute: number) => void;
}) {
  return (
    <View style={styles.timeRow}>
      <TextInput
        style={styles.timeInput}
        keyboardType="number-pad"
        value={String(hour % 12 === 0 ? 12 : hour % 12)}
        onChangeText={(value) => {
          const inputHour = Math.max(1, Math.min(12, Number(value) || 12));
          const isPM = hour >= 12;

          const convertedHour = isPM
            ? inputHour === 12
              ? 12
              : inputHour + 12
            : inputHour === 12
            ? 0
            : inputHour;

          onChange(convertedHour, minute);
        }}
        editable={enabled}
      />

      <Text style={styles.timeColon}>:</Text>

      <TextInput
        style={styles.timeInput}
        keyboardType="number-pad"
        value={String(minute).padStart(2, "0")}
        onChangeText={(value) => {
          const nextMinute = Math.min(59, Math.max(0, Number(value) || 0));
          onChange(hour, nextMinute);
        }}
        editable={enabled}
      />

      <Pressable
        style={styles.ampmBtn}
        onPress={() => {
          const updatedHour = hour >= 12 ? hour - 12 : hour + 12;
          onChange(updatedHour, minute);
        }}
      >
        <Text style={styles.ampmText}>{hour >= 12 ? "PM" : "AM"}</Text>
      </Pressable>
    </View>
  );
}
const changeReminderTime = async (
  key: ReminderKey,
  hourText: string,
  minuteText: string
) => {
  const hour = Math.min(23, Math.max(0, Number(hourText) || 0));
  const minute = Math.min(59, Math.max(0, Number(minuteText) || 0));

  const updated = await updateReminderSetting(key, {
    hour,
    minute,
  });

  setReminders(updated);
  getScheduledReminderCount().then(setScheduledCount);
};
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Pressable style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={24} color="#0f172a" />
        <Text style={styles.backText}>More</Text>
      </Pressable>

      <Text style={styles.kicker}>Preferences</Text>
      <Text style={styles.title}>Reminders & Meal Options</Text>
      <Text style={styles.subtitle}>
        Customize extra meal sections and daily notifications.
      </Text>

      <View style={styles.card}>
        <PreferenceRow
          icon="🍎"
          title="Fruit Plan"
          subtitle="Separate fruit/snack from meals"
          value={showFruit}
          onValueChange={setShowFruit}
        />

        <View style={styles.divider} />

        <PreferenceRow
          icon="🥗"
          title="Appetizer"
          subtitle="Add optional starter section"
          value={showAppetizer}
          onValueChange={setShowAppetizer}
        />
{reminders && isPro && (
  <View style={styles.section}>
       <Text style={styles.sectionTitle}>Meal & Water Reminders</Text>
      <Text style={styles.helperText}>
  {scheduledCount} reminders scheduled daily on this device.
</Text>

{scheduledCount > 0 && (
  <Text style={styles.nextReminderText}>
    Your wellness reminders are active ✅
  </Text>
)}
    {mealReminderKeys.map((key) => (
  <View
    key={key}
    style={[
      styles.reminderCard,
      !reminders[key].enabled && styles.disabledCard,
    ]}
  >
        <View style={styles.reminderTop}>
          <Text style={styles.reminderTitle}>{reminderLabels[key]}</Text>

          <Switch
            value={reminders[key].enabled}
            onValueChange={() => toggleReminder(key)}
          />
        </View>
        <Text style={styles.smallLabel}>Reminder time</Text>

        <View style={styles.timeRow}>
          <TextInput
            style={styles.timeInput}
            keyboardType="number-pad"
            value={String(
              reminders[key].hour % 12 === 0 ? 12 : reminders[key].hour % 12
            )}
            onChangeText={(value) => {
              const inputHour = Math.max(1, Math.min(12, Number(value) || 12));
              const isPM = reminders[key].hour >= 12;

              const convertedHour = isPM
                ? inputHour === 12
                  ? 12
                  : inputHour + 12
                : inputHour === 12
                ? 0
                : inputHour;

              changeReminderTime(
                key,
                String(convertedHour),
                String(reminders[key].minute)
              );
            }}
            editable={reminders[key].enabled}
          />

          <Text style={styles.timeColon}>:</Text>

          <TextInput
            style={styles.timeInput}
            keyboardType="number-pad"
            value={String(reminders[key].minute).padStart(2, "0")}
            onChangeText={(value) =>
              changeReminderTime(key, String(reminders[key].hour), value)
            }
            editable={reminders[key].enabled}
          />

          <Pressable
            style={styles.ampmBtn}
            onPress={() => {
              const updatedHour =
                reminders[key].hour >= 12
                  ? reminders[key].hour - 12
                  : reminders[key].hour + 12;

              changeReminderTime(
                key,
                String(updatedHour),
                String(reminders[key].minute)
              );
            }}
          >
            <Text style={styles.ampmText}>
              {reminders[key].hour >= 12 ? "PM" : "AM"}
            </Text>
          </Pressable>
        </View>

        <View style={styles.followUpRow}>
          <View>
            <Text style={styles.smallLabel}>Follow-up reminder</Text>
            <Text style={styles.helperText}>
              Remind again if you miss it
            </Text>
            {reminders.water.enabled && (
  <Text style={styles.nextReminderText}>
    {reminders.water.cups} cups between{" "}
    {formatReminderTime(
      reminders.water.startHour,
      reminders.water.startMinute
    )}{" "}
    and{" "}
    {formatReminderTime(
      reminders.water.endHour,
      reminders.water.endMinute
    )}
  </Text>
)}
          </View>

          <Switch
  value={reminders[key].enabled && reminders[key].followUpEnabled}
  disabled={!reminders[key].enabled}
  onValueChange={async () => {
    if (!reminders[key].enabled) return;

    const updated = await updateReminderSetting(key, {
      followUpEnabled: !reminders[key].followUpEnabled,
    });

    setReminders(updated);
    getScheduledReminderCount().then(setScheduledCount);
  }}
/>
        </View>

        {reminders[key].enabled && reminders[key].followUpEnabled && (
          <View style={styles.timeRow}>
            <Text style={styles.helperText}>After</Text>

            <TextInput
              style={styles.timeInput}
              keyboardType="number-pad"
              value={String(reminders[key].followUpMinutes)}
              onChangeText={async (value) => {
                const minutes = Math.min(
                  60,
                  Math.max(1, Number(value) || 10)
                );

                const updated = await updateReminderSetting(key, {
                  followUpMinutes: minutes,
                });

                setReminders(updated);
                getScheduledReminderCount().then(setScheduledCount);
              }}
              editable={reminders[key].enabled}
            />

            <Text style={styles.helperText}>minutes</Text>
          </View>
        )}
      </View>
    ))}

    <View
  style={[
    styles.reminderCard,
    !reminders.water.enabled && styles.disabledCard,
  ]}
>
      <View style={styles.reminderTop}>
        <Text style={styles.reminderTitle}>Water</Text>

        <Switch
          value={reminders.water.enabled}
          onValueChange={() => toggleReminder("water")}
        />
      </View>

      <Text style={styles.helperText}>
        Spread your water reminders across the day.
      </Text>
      {reminders.water.enabled && (
  <Text style={styles.nextReminderText}>
    {reminders.water.cups} cups between{" "}
    {formatReminderTime(
      reminders.water.startHour,
      reminders.water.startMinute
    )}{" "}
    and{" "}
    {formatReminderTime(
      reminders.water.endHour,
      reminders.water.endMinute
    )}
  </Text>
)}

    <Text style={styles.smallLabel}>Start time</Text>

<WaterTimeEditor
  hour={reminders.water.startHour}
  minute={reminders.water.startMinute}
  enabled={reminders.water.enabled}
  onChange={async (hour, minute) => {
    const startTotal = hour * 60 + minute;

    const endTotal =
      reminders.water.endHour * 60 + reminders.water.endMinute;

    if (startTotal >= endTotal) {
      Alert.alert(
        "Invalid time range",
        "Start time must be earlier than end time."
      );
      return;
    }

    const updated = await updateReminderSetting("water", {
      startHour: hour,
      startMinute: minute,
    });

    setReminders(updated);
    getScheduledReminderCount().then(setScheduledCount);
  }}
/>

<Text style={styles.smallLabel}>End time</Text>

<WaterTimeEditor
  hour={reminders.water.endHour}
  minute={reminders.water.endMinute}
  enabled={reminders.water.enabled}
  onChange={async (hour, minute) => {
    const startTotal =
      reminders.water.startHour * 60 + reminders.water.startMinute;

    const endTotal = hour * 60 + minute;

    if (endTotal <= startTotal) {
      Alert.alert(
        "Invalid time range",
        "End time must be later than start time."
      );
      return;
    }

    const updated = await updateReminderSetting("water", {
      endHour: hour,
      endMinute: minute,
    });

    setReminders(updated);
    getScheduledReminderCount().then(setScheduledCount);
  }}
/>

<Text style={styles.smallLabel}>Cups per day</Text>

<Text style={styles.helperText}>
  We will spread these reminders evenly between your start and end time.
</Text>

<View style={styles.timeRow}>
  <TextInput
    style={styles.timeInput}
    keyboardType="number-pad"
    value={String(reminders.water.cups)}
    onChangeText={async (value) => {
      const cups = Math.min(12, Math.max(1, Number(value) || 8));

      const updated = await updateReminderSetting("water", {
        cups,
      });

      setReminders(updated);
      getScheduledReminderCount().then(setScheduledCount);
    }}
    editable={reminders.water.enabled}
  />

  <Text style={styles.helperText}>cups</Text>
</View>
    </View>
    {reminders.water.enabled && (
  <Text style={styles.helperText}>
    {formatWaterInterval(
      reminders.water.startHour,
      reminders.water.startMinute,
      reminders.water.endHour,
      reminders.water.endMinute,
      reminders.water.cups
    )}
  </Text>
)}

    <Pressable
      style={styles.testBtn}
      onPress={async () => {
        try {
          await sendTestNotification();
          Alert.alert("Test sent", "You should receive a notification soon.");
        } catch (err: any) {
          Alert.alert("Notification error", getErrorMessage(err));
        }
      }}
    >
      <Text style={styles.testBtnText}>Send test notification</Text>
    </Pressable>
  </View>
)}
{reminders && !isPro && (
  <View style={styles.proCard}>
    <Text style={styles.proTitle}>Reminders are a Pro feature</Text>
    <Text style={styles.proText}>
      Upgrade to Pro to enable meal check-in reminders, water reminders,
      follow-up reminders, and wellness notifications.
    </Text>

    <Pressable style={styles.proBtn} onPress={() => router.push("/paywall")}>
      <Text style={styles.proBtnText}>Upgrade to Pro</Text>
    </Pressable>
  </View>
)}
        <View style={styles.divider} />
      </View>
    </ScrollView>
  );
}

function PreferenceRow({
  icon,
  title,
  subtitle,
  value,
  onValueChange,
}: {
  icon: string;
  title: string;
  subtitle: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <View style={styles.iconBubble}>
          <Text style={styles.iconText}>{icon}</Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.optionTitle}>{title}</Text>
          <Text style={styles.optionSub}>{subtitle}</Text>
        </View>
      </View>

      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: "#dbe3df", true: "#9be7c0" }}
        thumbColor={value ? "#15803d" : "#f8fafc"}
      />
    </View>
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
  disabledCard: {
  opacity: 0.55,
},
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 20,
  },
  backText: {
    color: "#0f172a",
    fontWeight: "900",
    fontSize: 16,
  },
  kicker: {
    color: "#15803d",
    fontWeight: "900",
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: "#0f172a",
    letterSpacing: -1,
  },
  subtitle: {
    color: "#64748b",
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 30,
    padding: 20,
    shadowColor: "#0f172a",
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 3,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 14,
    alignItems: "center",
  },
  left: {
    flex: 1,
    flexDirection: "row",
    gap: 14,
    alignItems: "center",
  },
  proCard: {
  marginTop: 20,
  backgroundColor: "#f0fdf4",
  borderRadius: 20,
  padding: 18,
  borderWidth: 1,
  borderColor: "#bbf7d0",
},

proTitle: {
  fontSize: 17,
  fontWeight: "900",
  color: "#14532d",
},

proText: {
  marginTop: 8,
  color: "#64748b",
  fontSize: 14,
  lineHeight: 20,
  fontWeight: "600",
},

proBtn: {
  marginTop: 14,
  backgroundColor: "#15803d",
  borderRadius: 14,
  paddingVertical: 13,
  alignItems: "center",
},

proBtnText: {
  color: "#fff",
  fontWeight: "900",
  fontSize: 15,
},
  smallLabel: {
  marginTop: 12,
  marginBottom: 6,
  fontSize: 13,
  fontWeight: "700",
  color: "#334155",
},

helperText: {
  fontSize: 13,
  color: "#64748b",
},

followUpRow: {
  marginTop: 14,
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
},

testBtn: {
  marginTop: 10,
  backgroundColor: "#0f7a43",
  borderRadius: 14,
  paddingVertical: 14,
  alignItems: "center",
},

testBtnText: {
  color: "#fff",
  fontWeight: "800",
  fontSize: 15,
},
  iconBubble: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: "#f0fdf4",
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: {
    fontSize: 20,
  },
  optionTitle: {
    color: "#0f172a",
    fontWeight: "900",
    fontSize: 16,
  },
  optionSub: {
    marginTop: 4,
    color: "#64748b",
    fontSize: 13,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: "#e2e8f0",
    marginVertical: 18,
  },
  nextReminderText: {
  marginTop: 4,
  fontSize: 13,
  fontWeight: "600",
  color: "#0f7a43",
},
  section: {
  marginTop: 20,
},

sectionTitle: {
  fontSize: 18,
  fontWeight: "800",
  color: "#0f172a",
  marginBottom: 12,
},

reminderCard: {
  backgroundColor: "#ffffff",
  borderRadius: 16,
  padding: 14,
  marginBottom: 12,
  borderWidth: 1,
  borderColor: "#e5e7eb",
},

reminderTop: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
},

reminderTitle: {
  fontSize: 16,
  fontWeight: "700",
  color: "#0f172a",
},

timeRow: {
  flexDirection: "row",
  alignItems: "center",
  marginTop: 12,
},

timeInput: {
  width: 55,
  height: 42,
  borderWidth: 1,
  borderColor: "#cbd5e1",
  borderRadius: 10,
  textAlign: "center",
  fontSize: 16,
  fontWeight: "700",
  color: "#0f172a",
},

timeColon: {
  marginHorizontal: 8,
  fontSize: 20,
  fontWeight: "800",
  color: "#0f172a",
},
ampmBtn: {
  marginLeft: 12,
  backgroundColor: "#0f7a43",
  paddingHorizontal: 14,
  paddingVertical: 10,
  borderRadius: 10,
},

ampmText: {
  color: "#fff",
  fontWeight: "700",
  fontSize: 14,
},
});