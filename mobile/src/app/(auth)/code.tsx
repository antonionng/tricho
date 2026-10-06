import { useState } from "react";
import { KeyboardAvoidingView, Platform, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useAuth } from "@/lib/auth";
import { Button, Input, Muted, Title } from "@/components/ui";
import { colors, gutter, space } from "@/theme";
import { ApiError } from "@/lib/api";

export default function Code() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const { verifyCode, requestCode } = useAuth();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function verify(value = code) {
    if (value.length !== 6) return;
    setError(null);
    setBusy(true);
    try {
      await verifyCode(email, value);
      // The root layout swaps to the member area once signed in.
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "We couldn't check the code. Please try again.");
      setBusy(false);
    }
  }

  async function resend() {
    setError(null);
    try {
      await requestCode(email);
      setNotice("We've sent a new code.");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "We couldn't send a new code.");
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, backgroundColor: colors.paper, padding: gutter, gap: space.lg }}>
      <Title>Enter the code we sent to {email}.</Title>
      <Muted>It works once and expires in 10 minutes. Check your junk folder if it hasn't arrived.</Muted>
      <Input
        value={code}
        onChangeText={(v) => {
          const digits = v.replace(/\D/g, "").slice(0, 6);
          setCode(digits);
          if (digits.length === 6) verify(digits);
        }}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        autoFocus
        maxLength={6}
        placeholder="123456"
        accessibilityLabel="Six-digit code"
        style={{ fontSize: 28, letterSpacing: 10, textAlign: "center" }}
        error={error}
        hint={notice ?? undefined}
      />
      <View style={{ gap: space.md }}>
        <Button title="Sign in" onPress={() => verify()} loading={busy} disabled={code.length !== 6} full />
        <Button title="Send a new code" variant="ghost" onPress={resend} full />
      </View>
    </KeyboardAvoidingView>
  );
}
