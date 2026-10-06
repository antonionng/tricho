import { useState } from "react";
import { Alert, Platform, View } from "react-native";
import { Stack, router } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as WebBrowser from "expo-web-browser";
import type { PurchasesPackage } from "react-native-purchases";
import { Badge, Button, Card, ErrorState, Heading, Loading, Muted, Rule, Screen, Section, Small, Text, Title } from "@/components/ui";
import { api, webUrl } from "@/lib/api";
import { meKey, useMe } from "@/lib/me";
import { buy, manageSubscription, membershipPackages, purchasesAvailable, restore } from "@/lib/purchases";
import { colors, fonts, space } from "@/theme";
import { packagesByPlan, periodLabel } from "@/components/membership/plans";

type Plan = { id: string; name: string; audience: string; summary: string; features: string[]; featured: boolean };

type Billing = {
  membership: {
    isActive: boolean;
    tierId: string | null;
    tierName: string | null;
    summary: string | null;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
    via: string | null;
    complimentary: boolean;
    isFounding: boolean;
    managedIn: string | null;
  };
  upgrade: { id: string; name: string; summary: string; features: string[] } | null;
  plans: Plan[];
};

const billingKey = ["membership", "billing"] as const;
const thisStore = Platform.OS === "ios" ? "app_store" : Platform.OS === "android" ? "play_store" : null;
const storeName = (store: string | null) => (store === "app_store" ? "the App Store" : store === "play_store" ? "Google Play" : "the store");

const longDate = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
const openWeb = (path: string) => WebBrowser.openBrowserAsync(webUrl(path)).catch(() => {});

/** Membership and billing: the member's plan and where to manage it, or the plans on sale in this app. */
export default function MembershipScreen() {
  const qc = useQueryClient();
  const me = useMe();
  const billing = useQuery({ queryKey: billingKey, queryFn: () => api<Billing>("billing") });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: meKey });
    qc.invalidateQueries({ queryKey: billingKey });
  };

  if (me.isPending || billing.isPending) return <Loading />;
  if (billing.error || !billing.data) return <ErrorState error={billing.error ?? me.error} onRetry={() => billing.refetch()} />;

  const active = me.data?.membership.isActive ?? billing.data.membership.isActive;

  return (
    <Screen refreshing={billing.isRefetching} onRefresh={refresh}>
      <Stack.Screen options={{ title: "Membership" }} />
      {active ? <CurrentPlan billing={billing.data} onChanged={refresh} /> : <Paywall plans={billing.data.plans} onJoined={refresh} />}
    </Screen>
  );
}

function CurrentPlan({ billing, onChanged }: { billing: Billing; onChanged: () => void }) {
  const m = billing.membership;
  const end = m.currentPeriodEnd;
  const sentence = m.complimentary
    ? end
      ? `Your membership is a gift from the Trichollective team until ${longDate(end)}, so there is nothing to pay.`
      : "Your membership is a gift from the Trichollective team, so there is nothing to pay."
    : m.via
      ? `Your Professional membership is provided by ${m.via} as one of their team seats, so there is nothing for you to pay.`
      : end
        ? m.cancelAtPeriodEnd
          ? `Your membership has been cancelled and ends on ${longDate(end)}. You keep full access until then.`
          : `Your membership renews on ${longDate(end)}.`
        : "Your membership is active.";

  return (
    <>
      <Card style={{ gap: space.md }}>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
          {m.cancelAtPeriodEnd && !m.via && end ? <Badge label={`Ends on ${longDate(end)}`} /> : <Badge label="Active" tone="positive" />}
          {m.complimentary && <Badge label="Complimentary" />}
          {m.isFounding && <Badge label="Founding member" tone="ink" />}
        </View>
        <Title>{m.tierName ?? "Membership"}</Title>
        <Text>{sentence}</Text>
        {m.summary && <Small>{m.summary}</Small>}
      </Card>

      <Section title="Managing your membership">
        <Card style={{ gap: space.md }}>
          <ManageNote managedIn={m.complimentary || m.via ? "team" : m.managedIn} />
        </Card>
      </Section>

      {billing.upgrade && m.managedIn === thisStore && purchasesAvailable() && (
        <Section title={billing.upgrade.name}>
          <Card style={{ gap: space.md }}>
            <Text>{billing.upgrade.summary}</Text>
            <Features items={billing.upgrade.features} />
            <PlanPackages planId={billing.upgrade.id} onJoined={onChanged} />
          </Card>
        </Section>
      )}
    </>
  );
}

function ManageNote({ managedIn }: { managedIn: string | null }) {
  if (managedIn === "app_store" || managedIn === "play_store") {
    if (managedIn !== thisStore) {
      return (
        <Text>
          {managedIn === "app_store"
            ? "You joined through the App Store, so you can change or cancel your membership in your Apple ID settings on an iPhone or iPad."
            : "You joined through Google Play, so you can change or cancel your membership in the Play Store on an Android phone."}
        </Text>
      );
    }
    return (
      <>
        <Text>
          You joined through {storeName(managedIn)}, so you can change your plan, update your payment details or cancel in your{" "}
          {managedIn === "app_store" ? "Apple ID" : "Google Play"} subscriptions.
        </Text>
        <Button title="Manage subscription" variant="secondary" onPress={() => manageSubscription().catch(() => {})} />
      </>
    );
  }
  if (managedIn === "web") {
    return (
      <Text>
        You joined on trichollective.net, so your card, invoices and cancellation are managed there. Sign in on the website and open Plan and
        billing from your profile.
      </Text>
    );
  }
  if (managedIn === "team") {
    return <Text>Your membership is provided for you, so there is nothing to manage or pay. If it changes, we will email you first.</Text>;
  }
  return <Text>If you need help with your membership, please email the Trichollective team from the contact page on the website.</Text>;
}

function Paywall({ plans, onJoined }: { plans: Plan[]; onJoined: () => void }) {
  const [restoring, setRestoring] = useState(false);
  const available = purchasesAvailable();
  const packages = useQuery({ queryKey: ["membership", "packages"], queryFn: membershipPackages, enabled: available, staleTime: 5 * 60_000 });

  return (
    <>
      <View style={{ gap: space.md }}>
        <Title>Join colleagues across every discipline of hair and scalp care.</Title>
        <Muted>
          Members ask questions in every space, learn at a live masterclass each month and pay less for courses and conferences. Professional adds a
          full directory profile, the Case Room and the referral network.
        </Muted>
      </View>

      {!available ? (
        <Card style={{ gap: space.sm }}>
          <Heading>Membership can't be bought in this version of the app.</Heading>
          <Text>Once you are a member, sign in here with the same email address and everything is ready for you.</Text>
        </Card>
      ) : packages.isPending ? (
        <Loading />
      ) : packages.error ? (
        <ErrorState error={packages.error} onRetry={() => packages.refetch()} />
      ) : (
        <PlanList plans={plans} packages={packages.data ?? []} onJoined={onJoined} />
      )}

      {available && (
        <Button
          title="Restore purchases"
          variant="ghost"
          loading={restoring}
          onPress={async () => {
            setRestoring(true);
            try {
              const res = await restore();
              onJoined();
              if (!res.membership.isActive) {
                Alert.alert("We couldn't find a membership to restore.", `No active Trichollective membership was found for this ${storeName(thisStore)} account.`);
              }
            } catch (error) {
              Alert.alert("We couldn't restore your purchases.", error instanceof Error ? error.message : undefined);
            } finally {
              setRestoring(false);
            }
          }}
        />
      )}

      <Disclosures />
    </>
  );
}

function PlanList({ plans, packages, onJoined }: { plans: Plan[]; packages: PurchasesPackage[]; onJoined: () => void }) {
  const groups = packagesByPlan(packages, plans.map((p) => p.id));
  if (!groups.length) {
    return (
      <Card>
        <Text>Membership isn't on sale in the app just now. Please try again later.</Text>
      </Card>
    );
  }
  return (
    <>
      {groups.map(({ plan: id, packages: list }) => {
        const plan = plans.find((p) => p.id === id);
        return (
          <Card key={id} style={[{ gap: space.md }, plan?.featured && { borderColor: colors.ink, borderWidth: 1 }]}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
              <Title style={{ flex: 1 }}>{plan?.name ?? id}</Title>
              {plan?.featured && <Badge label="Most chosen" tone="ink" />}
            </View>
            {plan && <Small>{plan.audience}</Small>}
            {plan && <Text>{plan.summary}</Text>}
            {plan && <Features items={plan.features} />}
            <Rule />
            <PackageButtons packages={list} onJoined={onJoined} />
          </Card>
        );
      })}
    </>
  );
}

/** The packages for one plan, for the upgrade card. */
function PlanPackages({ planId, onJoined }: { planId: string; onJoined: () => void }) {
  const packages = useQuery({ queryKey: ["membership", "packages"], queryFn: membershipPackages, staleTime: 5 * 60_000 });
  const list = packagesByPlan(packages.data ?? [], [planId]).find((g) => g.plan === planId)?.packages ?? [];
  if (!list.length) return null;
  return <PackageButtons packages={list} onJoined={onJoined} />;
}

function PackageButtons({ packages, onJoined }: { packages: PurchasesPackage[]; onJoined: () => void }) {
  const [busy, setBusy] = useState<string | null>(null);
  return (
    <View style={{ gap: space.sm }}>
      {packages.map((pkg, i) => {
        const period = periodLabel(pkg.product.subscriptionPeriod);
        return (
          <Button
            key={pkg.identifier}
            full
            variant={i === 0 ? "primary" : "secondary"}
            title={period ? `${pkg.product.priceString} a ${period}` : pkg.product.priceString}
            loading={busy === pkg.identifier}
            disabled={!!busy && busy !== pkg.identifier}
            onPress={async () => {
              setBusy(pkg.identifier);
              try {
                const bought = await buy(pkg);
                if (bought) {
                  onJoined();
                  Alert.alert("Welcome to Trichollective.", "Your membership is active, and everything it includes is open to you now.", [
                    { text: "Continue", onPress: () => (router.canGoBack() ? router.back() : router.replace("/")) },
                  ]);
                }
              } catch (error) {
                Alert.alert("The purchase didn't go through.", error instanceof Error ? error.message : "Please try again.");
              } finally {
                setBusy(null);
              }
            }}
          />
        );
      })}
    </View>
  );
}

function Features({ items }: { items: string[] }) {
  return (
    <View style={{ gap: space.sm }}>
      {items.map((f) => (
        <View key={f} style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.ink, marginTop: 9 }} />
          <Text style={{ flex: 1, fontSize: 14, lineHeight: 20 }}>{f}</Text>
        </View>
      ))}
    </View>
  );
}

/** The auto-renewal terms the App Store and Google Play require next to a subscription. */
function Disclosures() {
  const account = Platform.OS === "ios" ? "Apple ID" : "Google Play account";
  const settings = Platform.OS === "ios" ? "your Apple ID settings" : "the Play Store";
  return (
    <View style={{ gap: space.sm }}>
      <Small>
        Payment is charged to your {account} when you confirm the purchase. Your membership renews automatically at the same price for the same
        period unless you cancel it at least 24 hours before the end of the current period, and your account is charged for the renewal within the
        24 hours before the period ends. You can manage or cancel your membership at any time in {settings}.
      </Small>
      <Small>
        By joining you agree to the{" "}
        <Text accessibilityRole="link" onPress={() => openWeb("/terms")} style={linkStyle}>
          terms of membership
        </Text>{" "}
        and the{" "}
        <Text accessibilityRole="link" onPress={() => openWeb("/privacy")} style={linkStyle}>
          privacy policy
        </Text>
        .
      </Small>
    </View>
  );
}

const linkStyle = { color: colors.ink, textDecorationLine: "underline" as const, fontSize: 13, fontFamily: fonts.sansMedium };
