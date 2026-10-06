import { View } from "react-native";
import { Image } from "expo-image";
import { colors, fonts } from "@/theme";
import { Text } from "./Text";
import { mediaUrl } from "@/lib/media";

/** A member's photo, or their initials on paper. */
export function Avatar({ name, image, size = 40 }: { name?: string | null; image?: string | null; size?: number }) {
  const initials = (name ?? "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
  const src = mediaUrl(image);
  return (
    <View
      accessibilityLabel={name ?? undefined}
      style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.paper3, alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      {src ? (
        <Image source={src} style={{ width: size, height: size }} contentFit="cover" transition={150} />
      ) : (
        <Text style={{ fontFamily: fonts.sansSemibold, fontSize: size * 0.38, color: colors.ink2 }}>{initials || "?"}</Text>
      )}
    </View>
  );
}
