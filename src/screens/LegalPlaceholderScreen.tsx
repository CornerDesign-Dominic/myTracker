import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAppTheme } from "@/hooks/useAppTheme";
import { createScreenLayout, createSurfaceStyles, spacing } from "@/theme";

type Props = {
  message: string;
};

export const LegalPlaceholderScreen = ({ message }: Props) => {
  const { colors, typography } = useAppTheme();
  const layout = createScreenLayout(colors);
  const surfaces = createSurfaceStyles(colors);
  const styles = getStyles(colors);

  return (
    <SafeAreaView style={layout.screen} edges={["bottom"]}>
      <ScrollView contentContainerStyle={[layout.content, styles.content]}>
        <View style={[surfaces.panel, styles.card]}>
          <Text style={[typography.body, styles.message]}>{message}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (colors: ReturnType<typeof useAppTheme>["colors"]) =>
  StyleSheet.create({
    content: {
      paddingTop: 0,
    },
    card: {
      gap: spacing.sm,
    },
    message: {
      color: colors.textSecondary,
      lineHeight: 22,
    },
  });
