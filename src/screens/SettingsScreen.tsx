import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAppSettings } from "@/context/AppSettingsContext";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useI18n } from "@/hooks/useI18n";
import { createScreenLayout, createSurfaceStyles, radius, spacing } from "@/theme";

const OptionGroup = <T extends string>({
  title,
  value,
  options,
  formatLabel,
  onChange,
}: {
  title: string;
  value: T;
  options: readonly T[];
  formatLabel?: (value: T) => string;
  onChange: (value: T) => void;
}) => {
  const { colors, typography, shadows } = useAppTheme();
  const styles = getStyles(colors);
  const surfaces = createSurfaceStyles(colors);
  const getLabel = formatLabel ?? ((option: T) => String(option));

  return (
    <View style={[surfaces.panel, styles.groupCard]}>
      <Text style={[typography.cardTitle, styles.groupTitle]}>{title}</Text>
      <View style={styles.optionRow}>
        {options.map((option) => {
          const isActive = option === value;

          return (
            <Pressable
              key={option}
              style={[
                styles.optionButton,
                isActive ? [styles.optionButtonActive, shadows.soft] : null,
              ]}
              onPress={() => onChange(option)}
            >
              <Text style={[typography.button, styles.optionText, isActive ? styles.optionTextActive : null]}>
                {getLabel(option)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

export const SettingsScreen = () => {
  const { colors, typography } = useAppTheme();
  const { t } = useI18n();
  const styles = getStyles(colors);
  const layout = createScreenLayout(colors);
  const { language, currency, theme, setLanguage, setCurrency, setTheme } = useAppSettings();

  return (
    <SafeAreaView style={layout.screen} edges={["top", "bottom"]}>
      <View style={layout.content}>
        <Text style={[typography.pageTitle, styles.title]}>{t("settings.title")}</Text>
        <Text style={[typography.secondary, styles.subtitle]}>{t("settings.subtitle")}</Text>

        <OptionGroup
          title={t("settings.language")}
          value={language}
          options={["de", "en"] as const}
          formatLabel={(option) =>
            option === "de" ? t("settings.languageDe") : t("settings.languageEn")
          }
          onChange={setLanguage}
        />
        <OptionGroup
          title={t("settings.currency")}
          value={currency}
          options={["EUR", "Dollar"] as const}
          formatLabel={(option) =>
            option === "EUR" ? t("settings.currencyEur") : t("settings.currencyDollar")
          }
          onChange={setCurrency}
        />
        <OptionGroup
          title={t("settings.theme")}
          value={theme}
          options={["Dark", "Light"] as const}
          formatLabel={(option) =>
            option === "Dark" ? t("settings.themeDark") : t("settings.themeLight")
          }
          onChange={setTheme}
        />
      </View>
    </SafeAreaView>
  );
};

const getStyles = (colors: ReturnType<typeof useAppTheme>["colors"]) =>
  StyleSheet.create({
    title: {
      color: colors.textPrimary,
    },
    subtitle: {
      color: colors.textSecondary,
      marginBottom: spacing.sm,
    },
    groupCard: {
      gap: spacing.md,
    },
    groupTitle: {
      color: colors.textPrimary,
    },
    optionRow: {
      flexDirection: "row",
      gap: spacing.sm,
      flexWrap: "wrap",
    },
    optionButton: {
      minWidth: 92,
      paddingHorizontal: spacing.md,
      paddingVertical: 12,
      borderRadius: radius.pill,
      backgroundColor: colors.surfaceSoft,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
    },
    optionButtonActive: {
      backgroundColor: colors.accentSoft,
      borderColor: colors.accent,
    },
    optionText: {
      color: colors.textPrimary,
    },
    optionTextActive: {
      color: colors.accent,
    },
  });
