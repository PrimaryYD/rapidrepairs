import { Stack } from "expo-router";
import { GlobalAlertProvider } from "../components/ui/GlobalAlertProvider";

export default function RootLayout() {
  return (
    <GlobalAlertProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </GlobalAlertProvider>
  );
}