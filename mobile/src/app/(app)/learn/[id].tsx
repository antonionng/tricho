import { View } from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Sparkles } from "lucide-react-native";
import { Badge, Button, Display, ErrorState, Loading, Rule, Screen, Text } from "@/components/ui";
import { PlainBody } from "@/components/learn/PlainBody";
import { learnKey, type LearnPiece } from "@/components/learn/types";
import { api } from "@/lib/api";
import { space } from "@/theme";

/** A library piece, as on /members/learn/[id]. */
export default function LearnPieceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const q = useQuery({ queryKey: [...learnKey, "piece", id], queryFn: () => api<LearnPiece>(`learn/${id}`) });

  if (q.isPending) return <Loading />;
  if (q.isError) return <ErrorState error={q.error} onRetry={q.refetch} />;
  const { piece, assistantPrompt } = q.data;
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  return (
    <Screen refreshing={q.isRefetching} onRefresh={q.refetch}>
      <Stack.Screen options={{ title: "Learn" }} />
      <View style={{ gap: space.md }}>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
          <Badge label={cap(piece.audience)} />
          <Badge label={cap(piece.kind)} />
        </View>
        <Display>{piece.title}</Display>
        <Text style={{ fontSize: 18, lineHeight: 27 }}>{piece.summary}</Text>
      </View>
      <Rule />
      <PlainBody blocks={piece.blocks} />
      {assistantPrompt && (
        <Button
          title="Ask the Assistant about this"
          icon={Sparkles}
          variant="secondary"
          style={{ marginTop: space.lg }}
          onPress={() => router.push({ pathname: "/assistant", params: { q: assistantPrompt } })}
        />
      )}
    </Screen>
  );
}
