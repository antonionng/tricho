import { View } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Badge, Heading, PressableCard, Small, Text } from "@/components/ui";
import { colors, radius, space } from "@/theme";
import type { LearnHub } from "./types";

/** A course in the catalogue, with its photograph, hours and member price. */
export function CourseCard({ course }: { course: LearnHub["courses"][number] }) {
  return (
    <PressableCard
      onPress={() => router.push(`/courses/${course.slug}`)}
      accessibilityLabel={course.title}
      style={{ padding: 0, overflow: "hidden" }}>
      <Image
        source={{ uri: course.image }}
        style={{ width: "100%", aspectRatio: 16 / 9, backgroundColor: colors.paper2, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg }}
        contentFit="cover"
        transition={150}
        accessibilityIgnoresInvertColors
      />
      <View style={{ padding: space.lg, gap: space.sm }}>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
          {course.enrolled ? (
            <Badge label="Enrolled" tone="ink" />
          ) : course.status === "coming-soon" ? (
            <Badge label="Opening soon" />
          ) : (
            <Badge label="Open" tone="positive" />
          )}
          <Badge label={`${course.hours} hours`} />
        </View>
        <Heading>{course.title}</Heading>
        <Text numberOfLines={2}>{course.summary}</Text>
        <Small>{course.price}</Small>
      </View>
    </PressableCard>
  );
}
