import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { resolveSubscriptionVisual } from "@/constants/subscriptionAssets";
import { useAppTheme } from "@/hooks/useAppTheme";
import { radius } from "@/theme";

type SubscriptionAvatarProps = {
  name: string;
  category?: string;
  size?: number;
};

export const SubscriptionAvatar = ({
  name,
  category,
  size = 44,
}: SubscriptionAvatarProps) => {
  const { colors, typography } = useAppTheme();
  const styles = getStyles(colors, size);
  const visual = resolveSubscriptionVisual(name, category);

  if (visual.type === "brand") {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: visual.backgroundColor,
            borderColor: visual.borderColor,
          },
        ]}
      >
        {visual.mode === "icon" && visual.iconName ? (
          <Ionicons
            name={visual.iconName as never}
            size={Math.round(size * 0.48)}
            color={visual.tintColor}
          />
        ) : (
          <Text
            style={[
              typography.body,
              styles.brandLabel,
              {
                color: visual.tintColor,
                fontSize: visual.label && visual.label.length > 1 ? Math.round(size * 0.28) : Math.round(size * 0.42),
              },
            ]}
          >
            {visual.label}
          </Text>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Ionicons
        name={visual.iconName as never}
        size={Math.round(size * 0.46)}
        color={colors.textSecondary}
      />
    </View>
  );
};

const getStyles = (colors: ReturnType<typeof useAppTheme>["colors"], size: number) =>
  StyleSheet.create({
    container: {
      width: size,
      height: size,
      borderRadius: Math.max(radius.md, Math.round(size * 0.32)),
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surfaceSoft,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
      flexShrink: 0,
    },
    brandLabel: {
      fontWeight: "700",
      lineHeight: Math.round(size * 0.42),
      textAlign: "center",
    },
  });
