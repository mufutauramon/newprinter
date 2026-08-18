import Constants from "expo-constants";
import { Platform } from "react-native";
import Purchases, {
  CustomerInfo,
  PurchasesOffering,
  PurchasesPackage,
} from "react-native-purchases";

const REVENUECAT_ANDROID_KEY = "goog_nizWXsymZfBRuWdqWtOqQLWcjQs";
const REVENUECAT_IOS_KEY = "appl_YdLxqjvkkSRGoIGNwMXUMgDzqpv"; // Add iOS key later from RevenueCat
const ENTITLEMENT_ID = "pro";

let purchasesReady = false;

export const initPurchases = async () => {
  try {
    const isExpoGo = Constants.appOwnership === "expo";

    if (isExpoGo) {
      console.log("Expo Go detected. Skipping RevenueCat.");
      purchasesReady = false;
      return false;
    }

    // IMPORTANT:
    // Prevent configuring RevenueCat multiple times
    if (purchasesReady) {
      return true;
    }

    const apiKey =
      Platform.OS === "ios"
        ? REVENUECAT_IOS_KEY
        : REVENUECAT_ANDROID_KEY;

    if (!apiKey) {
      console.log(
        "Missing RevenueCat API key for this platform."
      );

      purchasesReady = false;
      return false;
    }

    Purchases.configure({
      apiKey,
    });

    purchasesReady = true;

    console.log("RevenueCat initialized");

    return true;
  } catch (err) {
    purchasesReady = false;

    console.log(
      "RevenueCat init error:",
      err
    );

    return false;
  }
};

export const isPurchasesReady = () => purchasesReady;

export const hasProEntitlement = (info: CustomerInfo) => {
  return !!info.entitlements.active[ENTITLEMENT_ID];
};

export const checkIsPro = async () => {
  try {
    if (!purchasesReady) return false;

    const info = await Purchases.getCustomerInfo();
    return hasProEntitlement(info);
  } catch (err) {
    console.log("Check Pro error:", err);
    return false;
  }
};

export const getCurrentOffering = async (): Promise<PurchasesOffering | null> => {
  try {
    if (!purchasesReady) return null;

    const offerings = await Purchases.getOfferings();

    if (!offerings.current || offerings.current.availablePackages.length === 0) {
      console.log("No RevenueCat offering/packages configured yet.");
      return null;
    }

    return offerings.current;
  } catch (err: any) {
    console.log("RevenueCat offerings error:", err?.message || err);
    return null;
  }
};

export const getProPackages = async () => {
  const offering = await getCurrentOffering();

  if (!offering) {
    return {
      monthly: null as PurchasesPackage | null,
      annual: null as PurchasesPackage | null,
      packages: [] as PurchasesPackage[],
    };
  }

  return {
    monthly: offering.monthly || null,
    annual: offering.annual || null,
    packages: offering.availablePackages || [],
  };
};

export const purchasePackage = async (pkg: PurchasesPackage) => {
  try {
    if (!purchasesReady) {
      console.log("RevenueCat not ready.");
      return false;
    }

    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return hasProEntitlement(customerInfo);
  } catch (err: any) {
    if (err?.userCancelled) {
      console.log("Purchase cancelled by user.");
    } else {
      console.log("Purchase error:", err?.message || err);
    }

    return false;
  }
};

export const purchasePro = async () => {
  const { monthly, packages } = await getProPackages();
  const pkg =
  monthly ||
  packages.find(
    (p) => p.packageType === "MONTHLY"
  ) ||
  packages[0];

  if (!pkg) return false;

  return purchasePackage(pkg);
};

export const restorePurchases = async () => {
  try {
    if (!purchasesReady) {
      console.log("RevenueCat not ready.");
      return false;
    }

    const customerInfo = await Purchases.restorePurchases();
    return hasProEntitlement(customerInfo);
  } catch (err) {
    console.log("Restore purchases error:", err);
    return false;
  }
};