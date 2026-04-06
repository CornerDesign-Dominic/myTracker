import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { FAQItem } from "@/content/faqContent";
import { useAppTheme } from "@/hooks/useAppTheme";
import { radius, spacing } from "@/theme";

type FAQCardProps = {
  item: FAQItem;
  expanded: boolean;
  onToggle?: () => void;
};

export const FAQCard = ({ item, expanded, onToggle }: FAQCardProps) => {
  const { colors, typography } = useAppTheme();
  const styles = getStyles(colors);

  const HeaderWrapper = onToggle ? Pressable : View;

  return (
    <View style={styles.card}>
      <HeaderWrapper
        style={styles.header}
        onPress={onToggle}
        accessibilityRole={onToggle ? "button" : undefined}
        accessibilityState={onToggle ? { expanded } : undefined}
      >
        <Text style={[typography.cardTitle, styles.title]}>{item.title}</Text>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={18}
          color={colors.textMuted}
        />
      </HeaderWrapper>

      {expanded ? (
        <View style={styles.content}>
          {item.content.map((block, index) => {
            if (block.type === "paragraph") {
              return (
                <Text key={`${item.id}-paragraph-${index}`} style={[typography.body, styles.paragraph]}>
                  {block.text}
                </Text>
              );
            }

            return (
              <View key={`${item.id}-bullets-${index}`} style={styles.bulletList}>
                {block.items.map((bullet) => (
                  <View key={bullet} style={styles.bulletRow}>
                    <View style={styles.bulletDot} />
                    <Text style={[typography.body, styles.bulletText]}>{bullet}</Text>
                  </View>
                ))}
              </View>
            );
          })}
        </View>
      ) : null}
    </View>
  );
};

const getStyles = (colors: ReturnType<typeof useAppTheme>["colors"]) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.lg,
      gap: spacing.md,
    },
    header: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: spacing.md,
    },
    title: {
      flex: 1,
      color: colors.textPrimary,
    },
    content: {
      gap: spacing.sm,
    },
    paragraph: {
      color: colors.textSecondary,
      lineHeight: 22,
    },
    bulletList: {
      gap: spacing.sm,
    },
    bulletRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.sm,
    },
    bulletDot: {
      width: 6,
      height: 6,
      borderRadius: radius.pill,
      backgroundColor: colors.accent,
      marginTop: 8,
      flexShrink: 0,
    },
    bulletText: {
      flex: 1,
      color: colors.textSecondary,
      lineHeight: 22,
    },
  });
