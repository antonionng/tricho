import { useState } from "react";
import { View } from "react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as WebBrowser from "expo-web-browser";
import { ArrowUpRight, Check } from "lucide-react-native";
import { Button, Small, Text } from "@/components/ui";
import { api } from "@/lib/api";
import { colors, fonts, radius } from "@/theme";
import { eventKey, eventsKey, type EventSummary } from "./types";

function Note({ children }: { children: string }) {
  return (
    <View style={{ minHeight: 44, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.rule, paddingHorizontal: 18, justifyContent: "center", alignSelf: "flex-start" }}>
      <Text style={{ fontFamily: fonts.sansMedium, fontSize: 14, color: colors.muted }}>{children}</Text>
    </View>
  );
}

/**
 * How a member books an event, as on the website: save a free place, buy a ticket
 * to an in-person event through the website's secure checkout, or book on the
 * organiser's page. Tickets for paid online events are not sold in the app.
 */
export function BookingActions({ event, onCheckoutClosed }: { event: EventSummary; onCheckoutClosed?: () => void }) {
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: eventsKey });
    qc.invalidateQueries({ queryKey: ["me"] });
  };

  const rsvp = useMutation({
    mutationFn: () => api<{ ok: boolean; going?: boolean }>(`events/${event.slug}/rsvp`, { method: "POST" }),
    onMutate: () => setError(null),
    onSuccess: refresh,
    onError: (e) => setError(e instanceof Error ? e.message : "We could not update your place. Please try again."),
  });

  const checkout = useMutation({
    mutationFn: () => api<{ url: string }>(`events/${event.slug}/checkout`, { method: "POST" }),
    onMutate: () => setError(null),
    onSuccess: async ({ url }) => {
      await WebBrowser.openBrowserAsync(url, { presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET });
      refresh();
      qc.invalidateQueries({ queryKey: eventKey(event.slug) });
      onCheckoutClosed?.();
    },
    onError: (e) => setError(e instanceof Error ? e.message : "We could not start the payment. Please try again in a moment."),
  });

  const errorText = error ? <Small style={{ color: colors.destructive }} accessibilityRole="alert">{error}</Small> : null;

  switch (event.booking) {
    case "none":
      return null;
    case "started":
      return <Note>This event has started</Note>;
    case "sold_out":
      return <Note>Sold out</Note>;
    case "full":
      return <Note>Fully booked</Note>;
    case "web_only":
      return (
        <View style={{ gap: 4 }}>
          <Text style={{ color: colors.ink }}>Tickets for this event are available on trichollective.net.</Text>
          <Small>Once you have a ticket, the joining link appears here in the app.</Small>
        </View>
      );
    case "external":
      return (
        <Button
          title="Get tickets"
          icon={ArrowUpRight}
          onPress={() => event.ticketUrl && WebBrowser.openBrowserAsync(event.ticketUrl)}
          disabled={!event.ticketUrl}
        />
      );
    case "buy":
      return (
        <View style={{ gap: 8 }}>
          <Button
            title={checkout.isPending ? "Opening secure payment…" : `Buy a ticket for £${event.memberPriceGBP}`}
            loading={checkout.isPending}
            onPress={() => checkout.mutate()}
          />
          <Small>You pay the member price. Payment is handled securely by Stripe.</Small>
          {errorText}
        </View>
      );
    case "rsvp":
      return (
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <Button
              title={event.going ? "You're going" : "I'm going"}
              icon={event.going ? Check : undefined}
              variant={event.going ? "secondary" : "primary"}
              loading={rsvp.isPending}
              accessibilityState={{ selected: event.going }}
              onPress={() => rsvp.mutate()}
            />
            {event.going && !error && <Small>Tap again if your plans change.</Small>}
          </View>
          {errorText}
        </View>
      );
  }
}
