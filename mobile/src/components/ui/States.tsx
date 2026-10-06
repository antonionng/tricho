import { ActivityIndicator, View } from "react-native";
import { colors, gutter, space } from "@/theme";
import { ApiError } from "@/lib/api";
import { Button } from "./Button";
import { Heading, Muted } from "./Text";
import { router } from "expo-router";

export function Loading() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: space.xxl }}>
      <ActivityIndicator color={colors.ink} />
    </View>
  );
}

export function Empty({ title, body, action }: { title: string; body?: string; action?: { title: string; onPress: () => void } }) {
  return (
    <View style={{ alignItems: "center", padding: gutter, paddingVertical: space.xxxl, gap: space.sm }}>
      <Heading style={{ textAlign: "center" }}>{title}</Heading>
      {body && <Muted style={{ textAlign: "center" }}>{body}</Muted>}
      {action && <Button title={action.title} onPress={action.onPress} style={{ marginTop: space.md, alignSelf: "center" }} />}
    </View>
  );
}

/** Explains a failed load. A 402 offers membership instead of a retry. */
export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  if (error instanceof ApiError && error.needsMembership) {
    return (
      <Empty
        title="This part of Trichollective is for members."
        body="Become a member to join the conversation, meet colleagues and learn every month."
        action={{ title: "See membership", onPress: () => router.push("/membership") }}
      />
    );
  }
  const message = error instanceof Error ? error.message : "Something went wrong. Please try again.";
  return <Empty title="We couldn't load this." body={message} action={onRetry ? { title: "Try again", onPress: onRetry } : undefined} />;
}
