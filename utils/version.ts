import Constants from "expo-constants";
import { Platform } from "react-native";

const APP_ENV = (process.env.APP_ENV ?? Constants.expoConfig?.extra?.APP_ENV) as string | undefined;

export function getAppVersion() {
  const expoVersion = Constants.expoConfig?.version ?? "0.0.0";
  const native =
    Platform.OS === "android"
      ? Constants.expoConfig?.android?.versionCode
      : Constants.expoConfig?.ios?.buildNumber;
  return native ? `${expoVersion} (${native})` : expoVersion;
}

export function getReleaseChannel() {
  if (__DEV__) return "dev";
  return APP_ENV ?? "production";
}

export function getVersionLabel() {
  return `v${getAppVersion()} · ${getReleaseChannel()}`;
}
