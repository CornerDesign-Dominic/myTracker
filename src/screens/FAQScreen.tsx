import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAppTheme } from "@/hooks/useAppTheme";
import { useI18n } from "@/hooks/useI18n";
import { createScreenLayout, createSurfaceStyles, spacing } from "@/theme";

export const FAQScreen = () => {
  const { colors, typography } = useAppTheme();
  const { t } = useI18n();
  const layout = createScreenLayout(colors);
  const surfaces = createSurfaceStyles(colors);
  const styles = getStyles(colors);

  const items = [
    { question: t("faq.registrationQuestion"), answer: t("faq.registrationAnswer") },
    { question: t("faq.passwordQuestion"), answer: t("faq.passwordAnswer") },
    { question: t("faq.premiumQuestion"), answer: t("faq.premiumAnswer") },
    { question: t("faq.dataQuestion"), answer: t("faq.dataAnswer") },
  ];

  return (
    <SafeAreaView style={layout.screen} edges={["bottom"]}>
      <ScrollView contentContainerStyle={[layout.content, styles.content]} showsVerticalScrollIndicator={false}>
        <View style={[surfaces.mainPanel, styles.introCard]}>
          <Text style={[typography.cardTitle, styles.title]}>{t("faq.introTitle")}</Text>
          <Text style={[typography.secondary, styles.introText]}>{t("faq.introText")}</Text>
        </View>

        {items.map((item) => (
          <View key={item.question} style={[surfaces.panel, styles.itemCard]}>
            <Text style={[typography.cardTitle, styles.question]}>{item.question}</Text>
            <Text style={[typography.secondary, styles.answer]}>{item.answer}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (colors: ReturnType<typeof useAppTheme>["colors"]) =>
  StyleSheet.create({
    content: {
      paddingTop: 0,
      paddingBottom: spacing.xl,
      gap: spacing.md,
    },
    introCard: {
      gap: spacing.sm,
    },
    itemCard: {
      gap: spacing.sm,
    },
    title: {
      color: colors.textPrimary,
    },
    introText: {
      color: colors.textSecondary,
      lineHeight: 22,
    },
    question: {
      color: colors.textPrimary,
    },
    answer: {
      color: colors.textSecondary,
      lineHeight: 22,
    },
  });
