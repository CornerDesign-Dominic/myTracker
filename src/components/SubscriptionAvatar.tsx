import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";

import { BrandLogo } from "./subscription-visuals/BrandLogo";
import { resolveSubscriptionVisual } from "../constants/subscriptionAssets";
import { useAppTheme } from "../hooks/useAppTheme";
import { radius } from "../theme";

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
  const { colors } = useAppTheme();
  const styles = getStyles(colors, size);
  const visual = resolveSubscriptionVisual(name, category);
  const innerSize = Math.round(size * 0.88);

  return (
    <View style={styles.container}>
      <View style={styles.innerFrame}>
        {visual.type === "brand" ? (
          <BrandLogo brand={visual.key} size={innerSize} />
        ) : (
          <Ionicons
            name={visual.iconName as never}
            size={Math.round(innerSize * 0.62)}
            color={colors.textSecondary}
          />
        )}
      </View>
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
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.shadow,
      shadowOpacity: 1,
      shadowRadius: 12,
      shadowOffset: {
        width: 0,
        height: 4,
      },
      elevation: 2,
      flexShrink: 0,
    },
    innerFrame: {
      width: Math.round(size * 0.88),
      height: Math.round(size * 0.88),
      borderRadius: Math.round(size * 0.28),
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surface,
      overflow: "hidden",
    },
  });
