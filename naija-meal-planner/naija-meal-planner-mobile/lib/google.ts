import { GoogleSignin } from "@react-native-google-signin/google-signin";

export const WEB_CLIENT_ID =
  "791528269537-6sdhflgbrgj0av9cu0er60csl4r7r3uu.apps.googleusercontent.com";

export const IOS_CLIENT_ID =
  "791528269537-tjm7cqppi6rjpdjn24n17hsacvkh4lbv.apps.googleusercontent.com";
  
GoogleSignin.configure({
  webClientId: WEB_CLIENT_ID,
  iosClientId: IOS_CLIENT_ID,
  offlineAccess: true,
});