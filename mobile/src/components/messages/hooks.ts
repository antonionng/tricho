import { useEffect, useState } from "react";
import { Keyboard, Platform , Alert } from "react-native";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { openHref } from "@/lib/push";
import { queryClient } from "@/lib/query";
import type { OpenConversation } from "./types";

/** Whether the keyboard is showing, so the composer can drop the home-indicator gap while it is. */
export function useKeyboardVisible() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow", () => setVisible(true));
    const hide = Keyboard.addListener(Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide", () => setVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return visible;
}

/** Opens the one-to-one conversation with a member, starting it if this is the first message. */
export function useMessageMember() {
  return useMutation({
    mutationFn: (userId: string) => api<OpenConversation>(`people/${userId}/message`, { method: "POST" }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["messages", "inbox"] });
      openHref(res.redirect ?? "/members/messages");
    },
    onError: (error) => Alert.alert("We couldn't open the conversation.", error instanceof Error ? error.message : undefined),
  });
}
