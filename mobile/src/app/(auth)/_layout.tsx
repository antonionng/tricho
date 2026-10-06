import { Stack } from "expo-router";
import { colors } from "@/theme";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.paper },
        headerTintColor: colors.ink,
        headerTitle: "",
        headerBackButtonDisplayMode: "minimal",
        contentStyle: { backgroundColor: colors.paper },
      }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  );
}
