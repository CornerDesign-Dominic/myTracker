import { StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "@/hooks/useAppTheme";
import { spacing } from "@/theme";

type HomeTimelineDateMarkerProps = {
  dateLabel: string;
  amountLabel?: string;
  leftOffset: number;
};

export const HomeTimelineDateMarker = ({
  dateLabel,
  amountLabel,
  leftOffset,
}: HomeTimelineDateMarkerProps) => {
  const { colors, typography } = useAppTheme();
  const styles = getStyles(colors, leftOffset);

  return (
    <View style={styles.container} pointerEvents="none">
      <View style={styles.labelRow}>
        <Text style={[typography.meta, styles.label]}>{dateLabel}</Text>
        {amountLabel ? (
          <>
            <Text style={[typography.meta, styles.separator]}>•</Text>
            <Text style={[typography.meta, styles.label]}>{amountLabel}</Text>
          </>
        ) : null}
      </View>
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
    labelRow: {
      position: "absolute",
      left: leftOffset + spacing.md,
      flexDirection: "row",
      alignItems: "center",
    },
    label: {
      color: colors.accent,
      textTransform: "capitalize",
      fontSize: 14,
      lineHeight: 20,
      fontWeight: "700",
    },
    separator: {
      color: colors.accent,
      fontSize: 14,
      lineHeight: 20,
      fontWeight: "700",
      marginHorizontal: spacing.xs,
    },
  });
