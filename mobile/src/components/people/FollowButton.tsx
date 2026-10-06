import { Alert } from "react-native";
import { useMutation } from "@tanstack/react-query";
import { Check, Plus } from "lucide-react-native";
import { Button } from "@/components/ui";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/query";

/**
 * Follow or unfollow a member. The button changes at once and settles on what
 * the server says; following someone tells them, as on the website.
 */
export function FollowButton({
  userId,
  following,
  onChange,
  size = "sm",
}: {
  userId: string;
  following: boolean;
  onChange: (following: boolean) => void;
  size?: "sm" | "md";
}) {
  const toggle = useMutation({
    mutationFn: (follow: boolean) => api<{ following: boolean }>(`people/${userId}/follow`, { body: { follow } }),
    onMutate: (follow) => onChange(follow),
    onSuccess: (res) => {
      onChange(res.following);
      queryClient.invalidateQueries({ queryKey: ["people", "profile", userId] });
    },
    onError: (error, follow) => {
      onChange(!follow);
      Alert.alert("That didn't work.", error instanceof Error ? error.message : undefined);
    },
  });
  return (
    <Button
      title={following ? "Following" : "Follow"}
      icon={following ? Check : Plus}
      variant={following ? "secondary" : "primary"}
      size={size}
      onPress={() => toggle.mutate(!following)}
    />
  );
}
