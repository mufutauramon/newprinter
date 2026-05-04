import { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { useAppContext } from "../../context/AppContext";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { router } from "expo-router";

const API_BASE = "http://10.0.2.2:8787";

function findPrice(itemName: string, prices: any[]) {
  return prices.find((p) => {
    const savedName = String(p.item || "").toLowerCase();
    const groceryName = itemName.toLowerCase();

    return savedName.includes(groceryName) || groceryName.includes(savedName);
  });
}

export default function Groceries() {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loadingAI, setLoadingAI] = useState(false);

  const {
    prices,
    region,
    aiGroceries,
    aiGroceriesLoading,
    refreshAIGroceries,
      isPro,
  } = useAppContext();

  const symbol = region === "ng" ? "₦" : region === "ca" ? "C$" : "$";

  const groceryRows = Object.entries(aiGroceries).map(([item, qty]) => {
    const priceRow = findPrice(item, prices);
    const unitPrice = Number(priceRow?.price || 0);
    const total = Number(qty) * unitPrice;

    return {
      item,
      qty: Number(qty),
      unitPrice,
      total,
      hasPrice: !!priceRow,
    };
  });

  const estimatedTotal = groceryRows.reduce((sum, row) => sum + row.total, 0);

  const money = (amount: number) => {
  if (region === "ng") return `₦${Math.round(amount).toLocaleString()}`;
  if (region === "ca") return `C$${amount.toFixed(2)}`;
  return `$${amount.toFixed(2)}`;
};
  const getSuggestions = async () => {
    if (!isPro) {
  router.push("/paywall");
  return;
}
    setLoadingAI(true);

    try {
      const res = await fetch(`${API_BASE}/api/ai/optimize-budget`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          groceries: groceryRows,
          budget: estimatedTotal,
          region,
        }),
      });

      const data = await res.json();

      if (data.ok) {
        setSuggestions(data.suggestions || []);
      }
    } catch (err) {
      console.log(err);
    } finally {
      setLoadingAI(false);
    }
  };

  const downloadGroceryPDF = async () => {
    const rows = groceryRows
      .map(
        (grocery) => `
          <tr>
            <td>${grocery.item}</td>
            <td>${grocery.qty.toFixed(2)}</td>
            <td>${money(grocery.unitPrice)}</td>
            <td>${money(grocery.total)}</td>
          </tr>
        `
      )
      .join("");

    const suggestionRows = suggestions
      .map(
        (s) => `
          <li>
            Replace <strong>${s.item}</strong> with <strong>${s.replace_with}</strong>.
            ${s.reason ? s.reason : ""}
          </li>
        `
      )
      .join("");

    const html = `
      <html>
        <body style="font-family: Arial; padding: 24px;">
          <h1>AI Grocery List</h1>
          <p>Generated from your meal plan and saved market prices.</p>

          <table style="width:100%; border-collapse: collapse;">
            <thead>
              <tr>
                <th style="border:1px solid #ddd; padding:8px;">Item</th>
                <th style="border:1px solid #ddd; padding:8px;">Quantity</th>
                <th style="border:1px solid #ddd; padding:8px;">Unit Price</th>
                <th style="border:1px solid #ddd; padding:8px;">Total</th>
              </tr>
            </thead>

            <tbody>
              ${rows}
            </tbody>
          </table>

          <h2>Total: ${money(estimatedTotal)}</h2>

          ${
            suggestions.length
              ? `<h2>AI Budget Suggestions</h2><ul>${suggestionRows}</ul>`
              : ""
          }
        </body>
      </html>
    `;

    const { uri } = await Print.printToFileAsync({ html });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: "Download Grocery List",
        UTI: "com.adobe.pdf",
      });
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>AI Grocery List</Text>

      <Text style={styles.subtitle}>
        Generated from your meal plan using AI ingredient extraction.
      </Text>

      <Pressable style={styles.downloadBtn} onPress={downloadGroceryPDF}>
        <Text style={styles.downloadText}>⬇️ Download Grocery PDF</Text>
      </Pressable>

      <Pressable style={styles.refreshBtn} onPress={refreshAIGroceries}>
        <Text style={styles.refreshText}>🤖 Refresh AI Grocery List</Text>
      </Pressable>

      <Pressable style={styles.aiBtn} onPress={getSuggestions}>
        <Text style={styles.aiText}>
          {loadingAI ? "Optimizing..." : "💰 Optimize Budget"}
        </Text>
      </Pressable>

      {loadingAI && (
        <View style={styles.loadingBox}>
          <Text style={styles.loadingText}>AI is finding cheaper options...</Text>
        </View>
      )}

      {suggestions.map((s, index) => (
        <View key={index} style={styles.suggestionCard}>
          <Text style={styles.suggestionText}>
            Replace {s.item} → {s.replace_with}
          </Text>
          <Text style={styles.reason}>{s.reason}</Text>
        </View>
      ))}

      {aiGroceriesLoading && (
        <View style={styles.loadingBox}>
          <Text style={styles.loadingText}>
            🤖 AI is generating your grocery list...
          </Text>
        </View>
      )}

      {!aiGroceriesLoading && groceryRows.length === 0 && (
        <View style={styles.loadingBox}>
          <Text style={styles.loadingText}>
            No groceries generated yet. Tap refresh or check your meal plan.
          </Text>
        </View>
      )}

      {groceryRows.map((grocery) => (
        <View style={styles.card} key={grocery.item}>
          <View style={{ flex: 1 }}>
            <Text style={styles.item}>{grocery.item}</Text>

            <Text style={styles.meta}>
              Estimated quantity: {grocery.qty.toFixed(2)}
            </Text>

            <Text style={styles.priceLine}>
              Unit price: {symbol}
              {grocery.unitPrice || 0}
            </Text>

            {!grocery.hasPrice && (
              <Text style={styles.missingPrice}>
                Add price in Prices tab for better accuracy
              </Text>
            )}
          </View>

          <Text style={styles.total}>{money(grocery.total)}</Text>
        </View>
      ))}

      <View style={styles.summary}>
        <Text style={styles.summaryLabel}>Estimated Grocery Total</Text>
        <Text style={styles.summaryValue}>{money(estimatedTotal)}</Text>

        <Text style={styles.summaryNote}>
          This estimate is calculated using AI-extracted ingredients and your
          saved market prices.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f8f5",
  },
  content: {
    padding: 20,
    paddingBottom: 140,
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    marginBottom: 6,
    color: "#0f172a",
  },
  subtitle: {
    color: "#64748b",
    marginBottom: 18,
    fontSize: 15,
  },
  downloadBtn: {
    backgroundColor: "#0f7a43",
    padding: 14,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  downloadText: {
    color: "#fff",
    fontWeight: "900",
  },
  refreshBtn: {
    backgroundColor: "#0f172a",
    padding: 14,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  refreshText: {
    color: "#fff",
    fontWeight: "900",
  },
  aiBtn: {
    backgroundColor: "#7c3aed",
    padding: 14,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  aiText: {
    color: "#fff",
    fontWeight: "900",
  },
  loadingBox: {
    backgroundColor: "#ecfdf5",
    padding: 16,
    borderRadius: 18,
    marginBottom: 16,
  },
  loadingText: {
    color: "#166534",
    fontWeight: "800",
  },
  suggestionCard: {
    backgroundColor: "#fef9c3",
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
  },
  suggestionText: {
    fontWeight: "900",
    color: "#92400e",
    marginBottom: 4,
  },
  reason: {
    color: "#78350f",
    fontWeight: "700",
  },
  card: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 22,
    marginBottom: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  item: {
    fontSize: 17,
    fontWeight: "900",
    color: "#0f172a",
    textTransform: "capitalize",
  },
  meta: {
    color: "#64748b",
    marginTop: 4,
  },
  priceLine: {
    color: "#0f7a43",
    marginTop: 6,
    fontWeight: "800",
  },
  missingPrice: {
    color: "#b45309",
    marginTop: 6,
    fontWeight: "700",
    fontSize: 12,
  },
  total: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0f7a43",
  },
  summary: {
    backgroundColor: "#dcfce7",
    padding: 20,
    borderRadius: 22,
    marginTop: 10,
    marginBottom: 40,
  },
  summaryLabel: {
    color: "#166534",
    fontWeight: "800",
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: "900",
    color: "#052e16",
    marginTop: 4,
  },
  summaryNote: {
    color: "#166534",
    marginTop: 8,
    lineHeight: 20,
  },
});