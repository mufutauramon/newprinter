import { useEffect, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiFetch } from "../utils/api";
import { useAppContext } from "../context/AppContext";

const ADMIN_EMAILS = ["amufutau@unilag.edu.ng"];
type Audience = "all_users" | "pro_users" | "free_users" | "custom";

const audienceOptions: { label: string; value: Audience }[] = [
  { label: "All Users", value: "all_users" },
  { label: "Pro Users", value: "pro_users" },
  { label: "Free Users", value: "free_users" },
  { label: "Custom Emails", value: "custom" },
];

type EmailTemplate = {
  label: string;
  subject: string;
  message: string;
};

const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    label: "Welcome Message",
    subject: "🎉 Welcome to Naija Meal Planner!",
    message: `Hello,

Welcome to Naija Meal Planner! 🎉

Thank you for joining our growing community of food lovers, families, students, and health-conscious individuals.

Naija Meal Planner helps you:

🍲 Generate personalized Nigerian meal plans
🇳🇬 Explore meals from different Nigerian cultures and food traditions
💚 Choose meals based on your health and wellness goals
📖 Access recipes and step-by-step cooking guides
🛒 Create smart grocery lists automatically
💰 Estimate grocery costs and manage your food budget
📊 Track meals, hydration, and wellness progress
⏰ Set reminders for meals and water intake
📄 Export meal plans and grocery lists as PDFs

To get the best experience:

1. Set your family size and region in Settings
2. Generate your meal plan
3. Review your grocery list
4. Check in your meals daily
5. Track your health progress and hydration

Happy meal planning! 🍲🇳🇬

Naija Meal Planner Team`,
  },
  {
    label: "New Feature Announcement",
    subject: "New features are now available in Naija Meal Planner 🚀",
    message: `Hello,

We are excited to let you know that new improvements are now available in Naija Meal Planner.

You can now enjoy:

✅ Better meal planning
✅ Improved grocery tracking
✅ Health insights and wellness reports
✅ Meal and water reminders
✅ Feedback support inside the app

Open the app today and explore the latest updates.

Thank you for being part of the Naija Meal Planner community.

Naija Meal Planner Team`,
  },
  {
    label: "Pro Upgrade",
    subject: "Unlock more with Naija Meal Planner Pro ⭐",
    message: `Hello,

Want to get more from Naija Meal Planner?

With Pro, you can unlock advanced meal planning, wellness insights, smarter grocery optimization, and premium recommendations.

Pro helps you:

⭐ Generate more personalized meal plans
⭐ Access premium meal categories
⭐ Track health and wellness insights
⭐ Optimize grocery spending
⭐ Stay consistent with reminders and reports

Open the app and upgrade to Pro today.

Thank you for using Naija Meal Planner.

Naija Meal Planner Team`,
  },
  {
    label: "Android Launch Coming Soon",
    subject: "Naija Meal Planner Android is coming soon 🤖",
    message: `Hello,

Thank you for your interest in Naija Meal Planner.

The Android version is coming soon to Google Play Store.

If you know friends or family using Android, please invite them to join the Android waitlist so they can be notified when the app launches.

Android Waitlist:
https://docs.google.com/forms/d/e/1FAIpQLSd43nPBOkBMmNu0Lx4CH8lazlZ8Xs55O1eF5aAlA-UlpxXvJw/viewform?usp=header

Thank you for supporting Naija Meal Planner.

Naija Meal Planner Team`,
  },
  {
    label: "App Store Download",
    subject: "Download Naija Meal Planner on the App Store 📱",
    message: `Hello,

Naija Meal Planner is now available on the Apple App Store!

Use the app to plan Nigerian meals, create grocery lists, track market prices, manage food budgets, and monitor your health goals.

Download here:
https://apps.apple.com/us/app/naija-meal-planner/id6768110353

Please share with family, friends, colleagues, students, and anyone who loves Nigerian food.

Thank you for your support.

Naija Meal Planner Team`,
  },
];
export default function AdminEmailCampaign() {
  const { user } = useAppContext();

  const [audience, setAudience] = useState<Audience>("all_users");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [showAudienceDropdown, setShowAudienceDropdown] = useState(false);
  const [customEmails, setCustomEmails] = useState("");
  const [recipientCount, setRecipientCount] = useState(0);
  const [countLoading, setCountLoading] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("Choose a template");

  const isAdmin = ADMIN_EMAILS.includes(
    String(user?.email || "").toLowerCase()
  );
const applyTemplate = (template: EmailTemplate) => {
  setSelectedTemplate(template.label);
  setSubject(template.subject);
  setMessage(template.message);
  setShowTemplates(false);
};
 const sendCampaign = async () => {
  if (!subject.trim()) {
    Alert.alert("Missing subject", "Please enter an email subject.");
    return;
  }

  if (!message.trim()) {
    Alert.alert("Missing message", "Please enter an email message.");
    return;
  }

  if (recipientCount === 0) {
    Alert.alert("No Recipients", "There are no users in this audience.");
    return;
  }

  try {
    setSending(true);

    const data = await apiFetch<{
      ok: boolean;
      sentCount: number;
      error?: string;
    }>("/api/admin/send-campaign", {
      method: "POST",
      body: JSON.stringify({
        audience,
        subject: subject.trim(),
        message: message.trim(),
        customEmail: customEmails.trim(),
      }),
    });

    if (!data.ok) {
      throw new Error(data.error || "Unable to send campaign.");
    }

    Alert.alert(
      "Campaign Sent",
      `Email campaign sent successfully to ${data.sentCount || 0} users.`
    );

    setSubject("");
    setMessage("");
    setAudience("all_users");
    setCustomEmails("");
    await loadCampaigns();
    await loadRecipientCount();
  } catch (err: any) {
    Alert.alert(
      "Campaign Error",
      err?.message || "Could not send email campaign."
    );
  } finally {
    setSending(false);
  }
};

if (!isAdmin) {
  return (
    <View style={styles.blockedScreen}>
      <Text style={styles.blockedTitle}>Access Restricted</Text>
      <Text style={styles.blockedText}>
        This page is only available to the app administrator.
      </Text>

      <Pressable style={styles.backHomeBtn} onPress={() => router.back()}>
        <Text style={styles.backHomeText}>Go Back</Text>
      </Pressable>
    </View>
  );
}
const loadRecipientCount = async () => {
  try {
    setCountLoading(true);

    const data = await apiFetch<{
      ok: boolean;
      count: number;
      error?: string;
    }>("/api/admin/campaign-count", {
      method: "POST",
      body: JSON.stringify({
        audience,
        customEmail: customEmails,
      }),
    });

    if (data.ok) {
      setRecipientCount(data.count || 0);
    }
  } catch {
    setRecipientCount(0);
  } finally {
    setCountLoading(false);
  }
};
const sendTestEmail = async () => {
  try {
    setSendingTest(true);

    const data = await apiFetch<{
      ok: boolean;
      error?: string;
    }>("/api/admin/send-test-email", {
      method: "POST",
      body: JSON.stringify({
        testEmail: user?.email,
        subject,
        message,
      }),
    });

    if (!data.ok) {
      throw new Error(data.error || "Could not send test email.");
    }
    await loadCampaigns();
    Alert.alert(
      "Test Email Sent",
      `A test email was sent to ${user?.email}`
    );
  } catch (err: any) {
    Alert.alert(
      "Test Failed",
      err?.message || "Unable to send test email."
    );
  } finally {
    setSendingTest(false);
  }
};

const loadCampaigns = async () => {
  try {
    const data = await apiFetch<{
      ok: boolean;
      campaigns: any[];
      error?: string;
    }>("/api/admin/email-campaigns");

    if (data.ok) {
      setCampaigns(data.campaigns || []);
    }
  } catch {
    setCampaigns([]);
  }
};
const deleteCampaign = async (id: number) => {
  Alert.alert("Delete Campaign", "Remove this campaign from history?", [
    { text: "Cancel", style: "cancel" },
    {
      text: "Delete",
      style: "destructive",
      onPress: async () => {
        const data = await apiFetch<{ ok: boolean; error?: string }>(
          `/api/admin/email-campaigns/${id}`,
          { method: "DELETE" }
        );

        if (!data.ok) {
          Alert.alert("Error", data.error || "Could not delete campaign.");
          return;
        }

        await loadCampaigns();
      },
    },
  ]);
};
useEffect(() => {
  loadRecipientCount();
}, [audience, customEmails]);
useEffect(() => {
  loadCampaigns();
}, []);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Pressable style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={24} color="#0f172a" />
        <Text style={styles.backText}>Back</Text>
      </Pressable>

      <Text style={styles.title}>Email Campaigns</Text>

      <Text style={styles.subtitle}>
        Send updates, announcements, launch messages, and promotions to your app
        users.
      </Text>

      <View style={styles.card}>
    <Text style={styles.label}>Audience</Text>

  <Pressable
    style={styles.dropdownBtn}
    onPress={() => setShowAudienceDropdown(!showAudienceDropdown)}
  >
    <Text style={styles.dropdownText}>
      {audienceOptions.find((x) => x.value === audience)?.label}
    </Text>

    <Ionicons
      name={showAudienceDropdown ? "chevron-up" : "chevron-down"}
      size={22}
      color="#0f172a"
    />
  </Pressable>

  {showAudienceDropdown && (
    <View style={styles.dropdownList}>
      {audienceOptions.map((item) => (
        <Pressable
          key={item.value}
          style={styles.dropdownItem}
          onPress={() => {
            setAudience(item.value);
            setShowAudienceDropdown(false);
          }}
        >
          <Text style={styles.dropdownItemText}>{item.label}</Text>
        </Pressable>
      ))}
    </View>
  )}

  {audience === "custom" && (
    <View style={{ marginTop: 14 }}>
      <Text style={styles.label}>Custom Emails</Text>

      <TextInput
        style={[styles.input, styles.messageInput]}
        placeholder="Enter emails separated by commas"
        value={customEmails}
        onChangeText={setCustomEmails}
        multiline
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <Text style={styles.helpText}>
        Example: user1@gmail.com, user2@yahoo.com, user3@outlook.com
      </Text>
    </View>
  )}
</View>
<View style={styles.recipientCard}>
  <Ionicons name="people-outline" size={22} color="#15803d" />

  <View>
    <Text style={styles.recipientTitle}>Recipients</Text>
    <Text style={styles.recipientText}>
      {countLoading
        ? "Checking recipients..."
        : `${recipientCount} user${recipientCount === 1 ? "" : "s"} will receive this email`}
    </Text>
  </View>
</View>
<View style={styles.card}>
  <Text style={styles.label}>Email Template</Text>

  <Pressable
    style={styles.dropdownBtn}
    onPress={() => setShowTemplates(!showTemplates)}
  >
    <Text style={styles.dropdownText}>{selectedTemplate}</Text>

    <Ionicons
      name={showTemplates ? "chevron-up" : "chevron-down"}
      size={22}
      color="#0f172a"
    />
  </Pressable>

  {showTemplates && (
    <View style={styles.dropdownList}>
      {EMAIL_TEMPLATES.map((template) => (
        <Pressable
          key={template.label}
          style={styles.dropdownItem}
          onPress={() => applyTemplate(template)}
        >
          <Text style={styles.dropdownItemText}>{template.label}</Text>
        </Pressable>
      ))}
    </View>
  )}
</View>
<View style={styles.card}>
        <Text style={styles.sectionTitle}>Subject</Text>

        <TextInput
          value={subject}
          onChangeText={setSubject}
          placeholder="Example: New features are now available"
          placeholderTextColor="#94a3b8"
          style={styles.input}
        />

        <Text style={[styles.sectionTitle, { marginTop: 18 }]}>Message</Text>

        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder="Write your email message here..."
          placeholderTextColor="#94a3b8"
          style={styles.messageInput}
          multiline
          textAlignVertical="top"
        />
      </View>

      <View style={styles.previewCard}>
        <Text style={styles.previewTitle}>Preview</Text>

        <Text style={styles.previewSubject}>
          {subject.trim() || "Email subject will appear here"}
        </Text>

        <Text style={styles.previewMessage}>
          {message.trim() || "Email message preview will appear here."}
        </Text>
      </View>
<Pressable
  style={styles.testButton}
  onPress={sendTestEmail}
  disabled={sendingTest}
>
  <Ionicons
    name="mail-outline"
    size={20}
    color="#166534"
  />

  <Text style={styles.testButtonText}>
    {sendingTest ? "Sending..." : "Send Test Email"}
  </Text>
</Pressable>
<Pressable
  style={[
    styles.sendBtn,
    sending && styles.disabledBtn,
  ]}
  onPress={sendCampaign}
  disabled={sending}
>
  <Ionicons name="mail-outline" size={20} color="#fff" />

  <Text style={styles.sendText}>
    {sending ? "Sending..." : "Send Campaign"}
  </Text>
</Pressable>
<View style={styles.historyCard}>
  <Pressable
    style={styles.historyHeader}
    onPress={() => setShowHistory(!showHistory)}
  >
    <Text style={styles.historyTitle}>Campaign History</Text>

    <Ionicons
      name={showHistory ? "chevron-up" : "chevron-down"}
      size={22}
      color="#0f172a"
    />
  </Pressable>

  {showHistory && (
    <>
      {campaigns.length === 0 ? (
        <Text style={styles.historyEmpty}>No campaigns sent yet.</Text>
      ) : (
        campaigns.map((item) => (
          <View key={item.id} style={styles.historyItem}>
            <View style={styles.historyRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.historySubject}>{item.subject}</Text>

                <Text style={styles.historyMeta}>
                  {item.audience} • {item.sent_count} sent
                </Text>

                <Text style={styles.historyDate}>{item.created_at}</Text>
              </View>

              <Pressable
                style={styles.deleteBtn}
                onPress={() => deleteCampaign(item.id)}
              >
                <Ionicons name="trash-outline" size={20} color="#dc2626" />
              </Pressable>
            </View>
          </View>
        ))
      )}
    </>
  )}
</View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#eef7f0",
  },

  content: {
    padding: 22,
    paddingTop: 60,
    paddingBottom: 90,
  },

  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },

  backText: {
    color: "#0f172a",
    fontWeight: "900",
    fontSize: 16,
  },

  title: {
    color: "#0f172a",
    fontSize: 34,
    fontWeight: "900",
  },

  subtitle: {
    color: "#64748b",
    marginTop: 10,
    lineHeight: 22,
    marginBottom: 22,
    fontWeight: "700",
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
  },

  sectionTitle: {
    color: "#0f172a",
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 12,
  },

  audienceRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    backgroundColor: "#fff",
  },

  audienceRowActive: {
    borderColor: "#15803d",
    backgroundColor: "#ecfdf5",
  },

  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#15803d",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#15803d",
  },

  audienceLabel: {
    color: "#0f172a",
    fontWeight: "900",
    fontSize: 15,
  },

  audienceSub: {
    color: "#64748b",
    fontWeight: "700",
    marginTop: 3,
    fontSize: 12,
  },

  input: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontWeight: "800",
    color: "#0f172a",
  },

  messageInput: {
    minHeight: 180,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontWeight: "700",
    color: "#0f172a",
    lineHeight: 22,
  },

  previewCard: {
    backgroundColor: "#dcfce7",
    borderRadius: 24,
    padding: 18,
    marginBottom: 18,
  },

  previewTitle: {
    color: "#166534",
    fontWeight: "900",
    fontSize: 16,
    marginBottom: 10,
  },

  previewSubject: {
    color: "#0f172a",
    fontWeight: "900",
    fontSize: 16,
    marginBottom: 10,
  },

  previewMessage: {
    color: "#14532d",
    fontWeight: "700",
    lineHeight: 22,
  },
label: {
  color: "#0f172a",
  fontWeight: "900",
  fontSize: 15,
  marginBottom: 10,
},
  sendBtn: {
    backgroundColor: "#0f7a43",
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },

  disabledBtn: {
    opacity: 0.6,
  },

  sendText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 16,
  },

  blockedScreen: {
    flex: 1,
    backgroundColor: "#eef7f0",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },

  blockedTitle: {
    color: "#0f172a",
    fontSize: 28,
    fontWeight: "900",
    marginBottom: 10,
  },

  blockedText: {
    color: "#64748b",
    textAlign: "center",
    lineHeight: 22,
    fontWeight: "700",
    marginBottom: 20,
  },

  backHomeBtn: {
    backgroundColor: "#0f7a43",
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 18,
  },

  backHomeText: {
    color: "#fff",
    fontWeight: "900",
  },
  dropdownBtn: {
  backgroundColor: "#f8fafc",
  borderWidth: 1,
  borderColor: "#d1fae5",
  borderRadius: 18,
  paddingHorizontal: 16,
  paddingVertical: 16,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
},

dropdownText: {
  color: "#0f172a",
  fontWeight: "900",
  fontSize: 15,
},

dropdownList: {
  backgroundColor: "#fff",
  borderRadius: 18,
  marginTop: 8,
  borderWidth: 1,
  borderColor: "#e5e7eb",
  overflow: "hidden",
},

dropdownItem: {
  paddingVertical: 14,
  paddingHorizontal: 16,
  borderBottomWidth: 1,
  borderBottomColor: "#f1f5f9",
},

dropdownItemText: {
  color: "#0f172a",
  fontWeight: "800",
},
helpText: {
  color: "#64748b",
  fontWeight: "700",
  fontSize: 12,
  marginTop: 8,
  lineHeight: 18,
  },
  recipientCard: {
  backgroundColor: "#dcfce7",
  borderRadius: 22,
  padding: 16,
  marginTop: 14,
  flexDirection: "row",
  alignItems: "center",
  gap: 12,
},

recipientTitle: {
  color: "#166534",
  fontWeight: "900",
  fontSize: 15,
},

recipientText: {
  color: "#14532d",
  fontWeight: "700",
  marginTop: 3,
},
testButton: {
  backgroundColor: "#dcfce7",
  borderRadius: 18,
  paddingVertical: 14,
  alignItems: "center",
  justifyContent: "center",
  flexDirection: "row",
  gap: 8,
  marginBottom: 14,
},

testButtonText: {
  color: "#166534",
  fontWeight: "900",
  fontSize: 15,
},
historyCard: {
  backgroundColor: "#fff",
  borderRadius: 24,
  padding: 18,
  marginTop: 18,
},

historyTitle: {
  color: "#0f172a",
  fontSize: 18,
  fontWeight: "900",
  marginBottom: 12,
},

historyEmpty: {
  color: "#64748b",
  fontWeight: "700",
},

historyItem: {
  borderTopWidth: 1,
  borderTopColor: "#f1f5f9",
  paddingTop: 12,
  marginTop: 12,
},

historySubject: {
  color: "#0f172a",
  fontWeight: "900",
  fontSize: 15,
},

historyMeta: {
  color: "#15803d",
  fontWeight: "800",
  marginTop: 4,
},

historyDate: {
  color: "#94a3b8",
  fontWeight: "700",
  marginTop: 4,
  fontSize: 12,
},
historyHeader: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
},

historyRow: {
  flexDirection: "row",
  alignItems: "center",
  gap: 10,
},

deleteBtn: {
  width: 40,
  height: 40,
  borderRadius: 14,
  backgroundColor: "#fee2e2",
  alignItems: "center",
  justifyContent: "center",
},
});

