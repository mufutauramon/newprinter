import * as Notifications from "expo-notifications";

function getNextDate(hour: number, minute: number) {
  const now = new Date();
  const next = new Date();

  next.setHours(hour, minute, 0, 0);

  // If today's time has already passed, schedule for tomorrow
  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }

  return next;
}

function getNextWeeklyDate(weekday: number, hour: number, minute: number) {
  const now = new Date();
  const next = getNextDate(hour, minute);

  // Expo weekday usually: 1 = Sunday, 2 = Monday ... 7 = Saturday
  while (next.getDay() + 1 !== weekday) {
    next.setDate(next.getDate() + 1);
  }

  if (next <= now) {
    next.setDate(next.getDate() + 7);
  }

  return next;
}

async function scheduleDailyReminder(
  title: string,
  body: string,
  hour: number,
  minute: number
) {
  return Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: getNextDate(hour, minute),
    },
  });
}

async function scheduleWeeklyReminder(
  title: string,
  body: string,
  weekday: number,
  hour: number,
  minute: number
) {
  return Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: getNextWeeklyDate(weekday, hour, minute),
    },
  });
}

export async function scheduleHealthReminders() {
  const permission = await Notifications.requestPermissionsAsync();

  if (!permission.granted) {
    throw new Error("Notification permission was not granted.");
  }

  await cancelHealthReminders();

  await scheduleDailyReminder(
    "Drink Water 💧",
    "Stay hydrated today. Add a glass of water in your Health Insights.",
    10,
    0
  );

  await scheduleDailyReminder(
    "Breakfast Check-in 🍽️",
    "Did you eat your planned breakfast? Update your Health Insights.",
    9,
    0
  );

  await scheduleDailyReminder(
    "Lunch Check-in 🍛",
    "Check in your lunch to keep your health score accurate.",
    14,
    0
  );

  await scheduleDailyReminder(
    "Dinner Check-in 🥘",
    "Log your dinner and review your daily wellness score.",
    20,
    0
  );

  await scheduleWeeklyReminder(
    "Weekly Health Review 📊",
    "Review your hydration, meals, and wellness progress this week.",
    2,
    18,
    0
  );
}

export async function cancelHealthReminders() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}