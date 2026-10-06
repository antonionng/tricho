import { View } from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { Avatar, Button, Small } from "@/components/ui";
import { space } from "@/theme";

export type PickedImage = { uri: string; name: string; type: string };

/** Lets the member choose a square photo from their library. Null when they cancel. */
export async function pickImage({ square = true }: { square?: boolean } = {}): Promise<PickedImage | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: square,
    aspect: square ? [1, 1] : undefined,
    quality: 0.85,
  });
  if (result.canceled || !result.assets?.length) return null;
  const asset = result.assets[0];
  const type = asset.mimeType && /^image\/(jpeg|png|webp)$/.test(asset.mimeType) ? asset.mimeType : "image/jpeg";
  const ext = type.split("/")[1].replace("jpeg", "jpg");
  return { uri: asset.uri, name: asset.fileName || `photo.${ext}`, type };
}

/** A FormData of plain fields plus files, the way React Native uploads them. */
export function multipart(fields: Record<string, string | string[] | undefined>, files: Record<string, PickedImage | null | undefined> = {}) {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) value.forEach((v) => fd.append(key, v));
    else fd.append(key, value);
  }
  for (const [key, file] of Object.entries(files)) {
    // React Native's FormData takes { uri, name, type } for a file on the device.
    if (file) fd.append(key, file as unknown as Blob);
  }
  return fd;
}

/** The member's photo with buttons to choose a new one or remove it. */
export function PhotoField({
  name,
  url,
  picked,
  onPick,
  onRemove,
  busy,
}: {
  name?: string | null;
  url: string | null;
  picked?: PickedImage | null;
  onPick: (image: PickedImage) => void;
  onRemove?: () => void;
  busy?: boolean;
}) {
  return (
    <View style={{ gap: space.md }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.lg }}>
        {picked ? (
          <Image source={{ uri: picked.uri }} style={{ width: 88, height: 88, borderRadius: 44 }} contentFit="cover" />
        ) : (
          <Avatar name={name} image={url} size={88} />
        )}
        <View style={{ flex: 1, gap: space.sm }}>
          <Button
            title={url || picked ? "Choose a new photo" : "Choose a photo"}
            variant="secondary"
            size="sm"
            loading={busy}
            onPress={async () => {
              const image = await pickImage();
              if (image) onPick(image);
            }}
          />
          {onRemove && url && !picked ? <Button title="Remove photo" variant="ghost" size="sm" disabled={busy} onPress={onRemove} /> : null}
        </View>
      </View>
      <Small>A clear, square head-and-shoulders photo works best. JPEG, PNG or WebP, up to 8MB.</Small>
    </View>
  );
}
