import { useState, type ReactNode } from "react";
import { View } from "react-native";
import { Button, Card, Section, Small } from "@/components/ui";
import { colors, space } from "@/theme";

/**
 * One part of the profile with its own save button, as on the website. Shows
 * the server's confirmation or its error under the button.
 */
export function SectionCard({
  title,
  intro,
  saveLabel = "Save",
  onSave,
  children,
}: {
  title: string;
  intro?: ReactNode;
  saveLabel?: string;
  onSave?: () => Promise<string | null | undefined>;
  children: ReactNode;
}) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);

  return (
    <Section title={title}>
      <Card style={{ gap: space.lg }}>
        {intro}
        {children}
        {onSave && (
          <View style={{ gap: space.sm }}>
            <Button
              title={saveLabel}
              loading={busy}
              onPress={async () => {
                setBusy(true);
                setStatus(null);
                try {
                  const message = await onSave();
                  setStatus({ ok: true, text: message || "Your changes are saved." });
                } catch (error) {
                  setStatus({ ok: false, text: error instanceof Error ? error.message : "Something went wrong. Please try again." });
                } finally {
                  setBusy(false);
                }
              }}
            />
            {status && (
              <Small accessibilityRole="alert" style={{ color: status.ok ? colors.positive : colors.destructive }}>
                {status.text}
              </Small>
            )}
          </View>
        )}
      </Card>
    </Section>
  );
}
