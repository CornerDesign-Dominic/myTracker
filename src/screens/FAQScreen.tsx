import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { FAQCard } from "@/components/FAQCard";
import { SectionHeader } from "@/components/SectionHeader";
import { getFAQSections } from "@/content/faqContent";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useI18n } from "@/hooks/useI18n";
import { createScreenLayout, createSurfaceStyles, spacing } from "@/theme";

export const FAQScreen = () => {
  const { colors, typography } = useAppTheme();
  const { language, t } = useI18n();
  const layout = createScreenLayout(colors);
  const surfaces = createSurfaceStyles(colors);
  const styles = getStyles(colors);
  const sections = getFAQSections(language);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>(() =>
    sections.flatMap((section) => section.items).reduce<Record<string, boolean>>((result, item) => {
      result[item.id] = true;
      return result;
    }, {}),
  );

  const toggleItem = (id: string) => {
    setExpandedItems((current) => ({
      ...current,
      [id]: !current[id],
    }));
  };

  return (
    <SafeAreaView style={layout.screen} edges={["bottom"]}>
      <ScrollView contentContainerStyle={[layout.content, styles.content]} showsVerticalScrollIndicator={false}>
        <View style={[surfaces.mainPanel, styles.introCard]}>
          <Text style={[typography.cardTitle, styles.title]}>{t("faq.introTitle")}</Text>
          <Text style={[typography.secondary, styles.introText]}>{t("faq.introText")}</Text>
        </View>

        {sections.map((section) => (
          <View key={section.id} style={styles.section}>
            <SectionHeader title={section.title} subtitle={section.subtitle} />
            <View style={styles.cardList}>
              {section.items.map((item) => (
                <FAQCard
                  key={item.id}
                  item={item}
                  expanded={expandedItems[item.id] ?? true}
                  onToggle={() => toggleItem(item.id)}
                />
              ))}
            </View>
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
    title: {
      color: colors.textPrimary,
    },
    introText: {
      color: colors.textSecondary,
      lineHeight: 22,
    },
    section: {
      gap: spacing.md,
    },
    cardList: {
      gap: spacing.sm,
    },
  });
