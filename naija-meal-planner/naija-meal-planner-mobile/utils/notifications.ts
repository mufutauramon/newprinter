import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

let memorySettings: string | null = null;

export type ReminderKey = "breakfast" | "lunch" | "dinner" | "water";

export type MealReminder = {
  enabled: boolean;
  hour: number;
  minute: number;
  followUpEnabled: boolean;
  followUpMinutes: number;
};

export type WaterReminder = {
  enabled: boolean;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  cups: number;
};

export type ReminderSettings = {
  breakfast: MealReminder;
  lunch: MealReminder;
  dinner: MealReminder;
  water: WaterReminder;
};

export const defaultReminderSettings: ReminderSettings = {
  breakfast: {
    enabled: true,
    hour: 8,
    minute: 0,
    followUpEnabled: true,
    followUpMinutes: 10,
  },
  lunch: {
    enabled: true,
    hour: 13,
    minute: 0,
    followUpEnabled: true,
    followUpMinutes: 10,
  },
  dinner: {
    enabled: true,
    hour: 19,
    minute: 0,
    followUpEnabled: true,
    followUpMinutes: 10,
  },
  water: {
  enabled: true,
  startHour: 8,
  startMinute: 0,
  endHour: 20,
  endMinute: 0,
  cups: 8,
},
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function setupNotifications() {
  const existing = await Notifications.getPermissionsAsync();

  let finalStatus = existing.status;

  if (existing.status !== "granted") {
    const requested = await Notifications.requestPermissionsAsync();
    finalStatus = requested.status;
  }

  if (finalStatus !== "granted") return false;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("meal-reminders", {
      name: "Meal & health reminders",
      importance: Notifications.AndroidImportance.HIGH,
      sound: "default",
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#0f7a43",
      lockscreenVisibility:
        Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  }

  return true;
}

function normalizeMealReminder(value: any, fallback: MealReminder): MealReminder {
  return {
    enabled:
      typeof value?.enabled === "boolean" ? value.enabled : fallback.enabled,
    hour: clampNumber(value?.hour, 0, 23, fallback.hour),
    minute: clampNumber(value?.minute, 0, 59, fallback.minute),
    followUpEnabled:
      typeof value?.followUpEnabled === "boolean"
        ? value.followUpEnabled
        : fallback.followUpEnabled,
    followUpMinutes: clampNumber(
      value?.followUpMinutes,
      1,
      60,
      fallback.followUpMinutes
    ),
  };
}

function normalizeWaterReminder(
  value: any,
  fallback: WaterReminder
): WaterReminder {
  return {
    enabled:
      typeof value?.enabled === "boolean" ? value.enabled : fallback.enabled,
    startHour: clampNumber(value?.startHour, 0, 23, fallback.startHour),
    startMinute: clampNumber(value?.startMinute, 0, 59, fallback.startMinute),
    endHour: clampNumber(value?.endHour, 0, 23, fallback.endHour),
    endMinute: clampNumber(value?.endMinute, 0, 59, fallback.endMinute),
    cups: clampNumber(value?.cups, 1, 12, fallback.cups),
  };
}

function normalizeSettings(raw: any): ReminderSettings {
  return {
    breakfast: normalizeMealReminder(
      raw?.breakfast,
      defaultReminderSettings.breakfast
    ),
    lunch: normalizeMealReminder(raw?.lunch, defaultReminderSettings.lunch),
    dinner: normalizeMealReminder(raw?.dinner, defaultReminderSettings.dinner),
    water: normalizeWaterReminder(raw?.water, defaultReminderSettings.water),
  };
}

function clampNumber(value: any, min: number, max: number, fallback: number) {
  const n = Number(value);

  if (!Number.isFinite(n)) return fallback;

  return Math.min(max, Math.max(min, Math.round(n)));
}

export async function getReminderSettings(): Promise<ReminderSettings> {
  if (!memorySettings) return defaultReminderSettings;

  try {
    return normalizeSettings(JSON.parse(memorySettings));
  } catch {
    return defaultReminderSettings;
  }
}

export async function saveReminderSettings(settings: ReminderSettings) {
  memorySettings = JSON.stringify(normalizeSettings(settings));
}

export async function cancelReminderNotifications() {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();

  await Promise.all(
    scheduled
      .filter((n) =>
        ["breakfast", "lunch", "dinner", "water"].includes(
          String(n.content.data?.type || "")
        )
      )
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier))
  );
}

function minutesToHourMinute(totalMinutes: number) {
  const safe = ((Math.round(totalMinutes) % 1440) + 1440) % 1440;

  return {
    hour: Math.floor(safe / 60),
    minute: safe % 60,
  };
}

async function scheduleMealReminder(
  type: "breakfast" | "lunch" | "dinner",
  reminder: MealReminder
) {
  if (!reminder.enabled) return;

  const contentMap = {
    breakfast: {
      title: "Breakfast reminder 🍳",
      body: "Time to check your breakfast plan for today.",
      followUpTitle: "Don’t miss breakfast 🌞",
      followUpBody: "A good breakfast helps you start the day strong.",
    },
    lunch: {
      title: "Lunch reminder 🍛",
      body: "Your lunch reminder is here. Stay on track with your meal plan.",
      followUpTitle: "Lunch follow-up ⏰",
      followUpBody: "Don’t skip lunch — keep your energy up.",
    },
    dinner: {
      title: "Dinner reminder 🍽️",
      body: "Check your dinner plan and prepare ahead.",
      followUpTitle: "Dinner follow-up 🌙",
      followUpBody: "Don’t miss dinner — finish your day well.",
    },
  };

  await Notifications.scheduleNotificationAsync({
    content: {
      title: contentMap[type].title,
      body: contentMap[type].body,
      sound: "default",
      data: { type, reminderKind: "main" },
    },
    trigger: {
  type: Notifications.SchedulableTriggerInputTypes.DAILY,
  channelId: "meal-reminders",
  hour: reminder.hour,
  minute: reminder.minute,
},});

  if (!reminder.followUpEnabled) return;

  const followUpTime = minutesToHourMinute(
    reminder.hour * 60 + reminder.minute + reminder.followUpMinutes
  );

  await Notifications.scheduleNotificationAsync({
    content: {
      title: contentMap[type].followUpTitle,
      body: contentMap[type].followUpBody,
      sound: "default",
      data: {
        type,
        reminderKind: "follow-up",
        followUpMinutes: reminder.followUpMinutes,
      },
    },
    trigger: {
  type: Notifications.SchedulableTriggerInputTypes.DAILY,
  channelId: "meal-reminders",
  hour: followUpTime.hour,
  minute: followUpTime.minute,
},
  });
}
export async function getScheduledReminderCount() {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();

  return scheduled.filter((n) =>
    ["breakfast", "lunch", "dinner", "water"].includes(
      String(n.content.data?.type || "")
    )
  ).length;
}
async function scheduleWaterReminders(settings: WaterReminder) {
  if (!settings.enabled) return;

  const cups = clampNumber(settings.cups, 1, 12, 8);

  const startTotal = settings.startHour * 60 + settings.startMinute;
  const endTotal = settings.endHour * 60 + settings.endMinute;
  const adjustedEnd = endTotal <= startTotal ? endTotal + 1440 : endTotal;
  const duration = adjustedEnd - startTotal;
  const interval = cups === 1 ? 0 : duration / (cups - 1);

  for (let i = 0; i < cups; i++) {
    const time = minutesToHourMinute(startTotal + interval * i);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `Water reminder 💧 Cup ${i + 1}/${cups}`,
        body: "Drink one cup of water and mark it in your Health Insights.",
        sound: "default",
        data: {
          type: "water",
          reminderKind: "cup",
          cup: i + 1,
          totalCups: cups,
        },
      },
      trigger: {
  type: Notifications.SchedulableTriggerInputTypes.DAILY,
  channelId: "meal-reminders",
  hour: time.hour,
  minute: time.minute,
},
    });
  }
}

export async function rescheduleReminderNotifications(
  settings?: ReminderSettings
) {
  const ok = await setupNotifications();

  if (!ok) {
    throw new Error("Notification permission was not granted.");
  }

  const finalSettings = normalizeSettings(
    settings || (await getReminderSettings())
  );

  await cancelReminderNotifications();

  await scheduleMealReminder("breakfast", finalSettings.breakfast);
  await scheduleMealReminder("lunch", finalSettings.lunch);
  await scheduleMealReminder("dinner", finalSettings.dinner);
  await scheduleWaterReminders(finalSettings.water);
}

export async function updateReminderSetting<K extends ReminderKey>(
  key: K,
  value: Partial<ReminderSettings[K]>
) {
  const current = await getReminderSettings();

  const updated = normalizeSettings({
    ...current,
    [key]: {
      ...current[key],
      ...value,
    },
  });

  await saveReminderSettings(updated);
  await rescheduleReminderNotifications(updated);

  return updated;
}

export async function sendTestNotification() {
  const ok = await setupNotifications();

  if (!ok) {
    throw new Error("Notification permission was not granted.");
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Naija Meal Planner reminder ✅",
      body: "Notifications are working on this device.",
      sound: "default",
      data: { type: "test" },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 5,
    },
  });
}