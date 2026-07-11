import { Stack } from "expo-router";
import { GlobalAlertProvider } from "../components/ui/GlobalAlertProvider";

export default function RootLayout() {
  return (
    <GlobalAlertProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Homepage" options={{ gestureEnabled: false }} />
        <Stack.Screen name="home-tech" options={{ gestureEnabled: false }} />
      </Stack>
    </GlobalAlertProvider>
  );
}