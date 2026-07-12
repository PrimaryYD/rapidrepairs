import { Stack } from "expo-router";
import { GlobalAlertProvider } from "../components/ui/GlobalAlertProvider";

export default function RootLayout() {
  return (
    <GlobalAlertProvider>
      <Stack screenOptions={{ headerShown: false }} initialRouteName="index">
        <Stack.Screen name="index" />
        <Stack.Screen name="Homepage" options={{ gestureEnabled: false }} />
        <Stack.Screen name="home-tech" options={{ gestureEnabled: false }} />
        {/* Technician Order Flow (No Back Navigation) */}
        <Stack.Screen name="tracking-tech" options={{ gestureEnabled: false }} />
        <Stack.Screen name="start-inspection" options={{ gestureEnabled: false }} />
        <Stack.Screen name="do-repair" options={{ gestureEnabled: false }} />
        <Stack.Screen name="upload-evidence" options={{ gestureEnabled: false }} />
        <Stack.Screen name="waiting-payment-tech" options={{ gestureEnabled: false }} />
        <Stack.Screen name="rate-user" options={{ gestureEnabled: false }} />
        <Stack.Screen name="done" options={{ gestureEnabled: false }} />
      </Stack>
    </GlobalAlertProvider>
  );
}