
export type Region = "us" | "ng" | "ca" | "uk" | "au";

type CurrencyMeta = {
  code: string;
  locale: string;
};

const REGION_CURRENCY: Record<Region, CurrencyMeta> = {
  us: { code: "USD", locale: "en-US" },
  ng: { code: "NGN", locale: "en-NG" },
  ca: { code: "CAD", locale: "en-CA" },
  uk: { code: "GBP", locale: "en-GB" },
  au: { code: "AUD", locale: "en-AU" },
};

let cachedRates: Record<string, number> = {
  USD: 1,
  NGN: 1500,
  CAD: 1.36,
  GBP: 0.79,
  AUD: 1.52,
};

let cachedAt = 0;

const CACHE_DURATION = 1000 * 60 * 60 * 12; // 12 hours

export async function getExchangeRatesFromUSD() {
  const now = Date.now();

  if (cachedRates && now - cachedAt < CACHE_DURATION) {
    return cachedRates;
  }

  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD");

    const data = await res.json();

    if (data?.rates) {
      cachedRates = data.rates;
      cachedAt = now;
    }

    return cachedRates;
  } catch (err) {
    console.log("Exchange rate fetch failed:", err);

    return cachedRates;
  }
}

export function convertRegionToUSD(
  amountLocal: number,
  region: Region
): number {
  const meta = REGION_CURRENCY[region] || REGION_CURRENCY.us;

  const rate = cachedRates[meta.code] ?? 1;

  return amountLocal / rate;
}

export function convertUSDToRegion(
  amountUSD: number,
  region: Region
): number {
  const meta = REGION_CURRENCY[region] || REGION_CURRENCY.us;

  const rate = cachedRates[meta.code] ?? 1;

  return amountUSD * rate;
}

export function formatCurrency(
  amount: number,
  region: Region
): string {
  const meta = REGION_CURRENCY[region] || REGION_CURRENCY.us;

  return new Intl.NumberFormat(meta.locale, {
    style: "currency",
    currency: meta.code,
    maximumFractionDigits: meta.code === "NGN" ? 0 : 2,
  }).format(amount);
}

export function formatUSDForRegion(
  amountUSD: number,
  region: Region
): string {
  const converted = convertUSDToRegion(amountUSD, region);

  return formatCurrency(converted, region);
}