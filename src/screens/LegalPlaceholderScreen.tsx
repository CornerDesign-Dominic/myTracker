import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getLegalDocument, LegalDocumentKey } from "@/content/legalDocuments";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useI18n } from "@/hooks/useI18n";
import { createScreenLayout, createSurfaceStyles, radius, spacing } from "@/theme";

type Props = {
  documentKey: LegalDocumentKey;
};

export const LegalPlaceholderScreen = ({ documentKey }: Props) => {
  const { colors, typography } = useAppTheme();
  const { language } = useI18n();
  const layout = createScreenLayout(colors);
  const surfaces = createSurfaceStyles(colors);
  const styles = getStyles(colors);
  const document = getLegalDocument(documentKey, language);

  return (
    <SafeAreaView style={layout.screen} edges={["bottom"]}>
      <ScrollView contentContainerStyle={[layout.content, styles.content]} showsVerticalScrollIndicator={false}>
        <View style={[surfaces.panel, styles.heroCard]}>
          <Text style={[typography.meta, styles.updatedAt]}>{document.updatedAt}</Text>
          {document.intro.map((paragraph) => (
            <Text key={paragraph} style={[typography.body, styles.paragraph]}>
              {paragraph}
            </Text>
          ))}
        </View>

        {document.sections.map((section) => (
          <View key={section.title} style={[surfaces.panel, styles.sectionCard]}>
            <Text style={[typography.cardTitle, styles.sectionTitle]}>{section.title}</Text>
            {section.paragraphs?.map((paragraph) => (
              <Text key={paragraph} style={[typography.body, styles.paragraph]}>
                {paragraph}
              </Text>
            ))}
            {section.bullets?.map((bullet) => (
              <View key={bullet} style={styles.bulletRow}>
                <View style={styles.bulletDot} />
                <Text style={[typography.body, styles.bulletText]}>{bullet}</Text>
              </View>
            ))}
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
    heroCard: {
      gap: spacing.sm,
    },
    sectionCard: {
      gap: spacing.sm,
    },
    updatedAt: {
      color: colors.accent,
      letterSpacing: 0.4,
      textTransform: "uppercase",
    },
    sectionTitle: {
      color: colors.textPrimary,
    },
    paragraph: {
      color: colors.textSecondary,
      lineHeight: 22,
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
