export type Region = "us" | "ng" | "ca" | "uk" | "au";

export type LocalGroceryPrice = {
  price: number;
  currency: string;
  unit: string;
};

const LOCAL_PRICES: Record<Region, Record<string, LocalGroceryPrice>> = {
  us: {
    rice: { price: 1.5, currency: "USD", unit: "lb" },
    chicken: { price: 4.5, currency: "USD", unit: "lb" },
    beef: { price: 6.5, currency: "USD", unit: "lb" },
    fish: { price: 7, currency: "USD", unit: "lb" },
    egg: { price: 0.35, currency: "USD", unit: "piece" },
    tomato: { price: 1.2, currency: "USD", unit: "lb" },
  },

  ng: {
    rice: { price: 1200, currency: "NGN", unit: "derica" },
    chicken: { price: 4500, currency: "NGN", unit: "kg" },
    beef: { price: 5500, currency: "NGN", unit: "kg" },
    fish: { price: 3500, currency: "NGN", unit: "kg" },
    egg: { price: 250, currency: "NGN", unit: "piece" },
    tomato: { price: 1000, currency: "NGN", unit: "basket portion" },
    pepper: { price: 500, currency: "NGN", unit: "small bowl" },
    onion: { price: 300, currency: "NGN", unit: "piece" },
    garri: { price: 900, currency: "NGN", unit: "derica" },
    beans: { price: 1500, currency: "NGN", unit: "derica" },
    yam: { price: 2500, currency: "NGN", unit: "tuber" },
    plantain: { price: 700, currency: "NGN", unit: "piece" },
  },

  ca: {
    rice: { price: 2.2, currency: "CAD", unit: "lb" },
    chicken: { price: 7.5, currency: "CAD", unit: "lb" },
    beef: { price: 9, currency: "CAD", unit: "lb" },
    egg: { price: 0.55, currency: "CAD", unit: "piece" },
  },

  uk: {
    rice: { price: 1.8, currency: "GBP", unit: "kg" },
    chicken: { price: 5.5, currency: "GBP", unit: "kg" },
    beef: { price: 8, currency: "GBP", unit: "kg" },
    egg: { price: 0.35, currency: "GBP", unit: "piece" },
  },

  au: {
    rice: { price: 3, currency: "AUD", unit: "kg" },
    chicken: { price: 10, currency: "AUD", unit: "kg" },
    beef: { price: 14, currency: "AUD", unit: "kg" },
    egg: { price: 0.6, currency: "AUD", unit: "piece" },
  },
};

export function getLocalGroceryPrice(
  item: string,
  region: Region
): LocalGroceryPrice | null {
  const key = String(item || "").toLowerCase().trim();
  const regionPrices = LOCAL_PRICES[region] || LOCAL_PRICES.us;

  return regionPrices[key] || null;
}

export function getLocalCurrencyCode(region: Region) {
  if (region === "ng") return "NGN";
  if (region === "ca") return "CAD";
  if (region === "uk") return "GBP";
  if (region === "au") return "AUD";
  return "USD";
}

export function getLocalLocale(region: Region) {
  if (region === "ng") return "en-NG";
  if (region === "ca") return "en-CA";
  if (region === "uk") return "en-GB";
  if (region === "au") return "en-AU";
  return "en-US";
}

export function formatLocalMoney(amount: number, region: Region) {
  return new Intl.NumberFormat(getLocalLocale(region), {
    style: "currency",
    currency: getLocalCurrencyCode(region),
    maximumFractionDigits: region === "ng" ? 0 : 2,
  }).format(Number(amount || 0));
}