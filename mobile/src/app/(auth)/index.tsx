import { useState } from "react";
import { KeyboardAvoidingView, Platform, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/lib/auth";
import { Button, Display, Input, Label, Muted } from "@/components/ui";
import { colors, gutter, space } from "@/theme";
import { ApiError } from "@/lib/api";

export default function SignIn() {
  const { requestCode } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function submit() {
    setError(null);
    setSending(true);
    try {
      const value = email.trim().toLowerCase();
      await requestCode(value);
      router.push({ pathname: "/code", params: { email: value } });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "We couldn't send the code. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, padding: gutter, justifyContent: "space-between" }}>
        <View style={{ gap: space.lg, marginTop: space.xxxl }}>
          <Label>Trichollective</Label>
          <Display>The community for hair and scalp professionals, in your pocket.</Display>
          <Muted>Sign in with your email and we'll send you a six-digit code. There is no password to remember.</Muted>
        </View>
        <View style={{ gap: space.lg, marginBottom: space.lg }}>
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
            returnKeyType="send"
            onSubmitEditing={submit}
            placeholder="you@yourclinic.com"
            error={error}
          />
          <Button title="Send me a code" onPress={submit} loading={sending} disabled={!email.includes("@")} full />
          <Muted style={{ fontSize: 13, textAlign: "center" }}>New to Trichollective? Use your email and we'll create your free account.</Muted>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
