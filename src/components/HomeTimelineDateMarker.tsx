import { StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "@/hooks/useAppTheme";
import { spacing } from "@/theme";

type HomeTimelineDateMarkerProps = {
  label: string;
  leftOffset: number;
};

export const HomeTimelineDateMarker = ({ label, leftOffset }: HomeTimelineDateMarkerProps) => {
  const { colors, typography } = useAppTheme();
  const styles = getStyles(colors, leftOffset);

  return (
    <View style={styles.container} pointerEvents="none">
      <Text style={[typography.meta, styles.label]}>{label}</Text>
    </View>
  );
};

const getStyles = (
  colors: ReturnType<typeof useAppTheme>["colors"],
  leftOffset: number,
) =>
  StyleSheet.create({
    container: {
      justifyContent: "center",
      minHeight: 18,
      paddingVertical: 0,
      marginVertical: -8,
    },
    label: {
      position: "absolute",
      left: leftOffset + spacing.md,
      color: colors.accent,
      textTransform: "capitalize",
      fontSize: 14,
      lineHeight: 20,
    },
  });
