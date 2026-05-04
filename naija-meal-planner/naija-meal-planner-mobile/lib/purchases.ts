import Purchases from "react-native-purchases";

const REVENUECAT_ANDROID_KEY = "PASTE_YOUR_REVENUECAT_PUBLIC_ANDROID_KEY_HERE";

export const initPurchases = async () => {
  try {
    await Purchases.configure({
      apiKey: REVENUECAT_ANDROID_KEY,
    });

    console.log("RevenueCat initialized");
  } catch (err) {
    console.log("RevenueCat init error:", err);
  }
};

export const checkIsPro = async () => {
  try {
    const info = await Purchases.getCustomerInfo();

    return info.entitlements.active["pro"] !== undefined;
  } catch (err) {
    console.log("Check Pro error:", err);
    return false;
  }
};