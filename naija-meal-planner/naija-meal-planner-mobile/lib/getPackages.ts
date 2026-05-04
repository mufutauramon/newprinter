import Purchases from "react-native-purchases";

export const getPackages = async () => {
  try {
    const offerings = await Purchases.getOfferings();

    if (offerings.current) {
      return offerings.current.availablePackages;
    }

    return [];
  } catch (err) {
    console.log(err);
    return [];
  }
};

export const buyPackage = async (pkg: any) => {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);

    return customerInfo;
  } catch (err) {
    console.log("Purchase failed", err);
    return null;
  }
};
export const isProUser = async () => {
  const info = await Purchases.getCustomerInfo();

  return info.entitlements.active["pro"] !== undefined;
};