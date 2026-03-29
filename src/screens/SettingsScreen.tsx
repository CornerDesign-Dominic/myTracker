import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useAppSettings } from "@/context/AppSettingsContext";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useI18n } from "@/hooks/useI18n";
import { RootStackParamList } from "@/navigation/types";
import {
  accentColorOptions,
  createButtonStyles,
  getAccentPalette,
  createScreenLayout,
  createSurfaceStyles,
  radius,
  spacing,
} from "@/theme";
import { AccentColor } from "@/theme";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

type Props = NativeStackScreenProps<RootStackParamList, "Settings">;

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
  const { colors, typography } = useAppTheme();
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
              style={[styles.optionButton, isActive ? styles.optionButtonActive : null]}
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

export const SettingsScreen = ({ navigation }: Props) => {
  const { colors, typography, mode } = useAppTheme();
  const { t } = useI18n();
  const styles = getStyles(colors);
  const layout = createScreenLayout(colors);
  const surfaces = createSurfaceStyles(colors);
  const buttons = createButtonStyles(colors);
  const {
    language,
    currency,
    theme,
    accentColor,
    setLanguage,
    setCurrency,
    setTheme,
    setAccentColor,
  } = useAppSettings();
  const { isAnonymous, logout } = useAuth();

  return (
    <SafeAreaView style={layout.screen} edges={["top", "bottom"]}>
      <ScrollView
        contentContainerStyle={[layout.content, styles.contentWithTabBar]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[surfaces.panel, styles.groupCard]}>
          <View style={styles.sectionHeader}>
            <Text style={[typography.cardTitle, styles.groupTitle]}>{t("settings.accountTitle")}</Text>
          </View>
          <Text style={[typography.secondary, styles.accountText]}>
            {isAnonymous ? t("settings.accountAnonymous") : t("settings.accountSignedIn")}
          </Text>
          <View style={styles.optionRow}>
            {isAnonymous ? (
              <>
                <Pressable
                  style={[buttons.buttonBase, buttons.secondaryButton, styles.actionButton]}
                  onPress={() => navigation.navigate("Login")}
                >
                  <Text style={[typography.button, styles.optionText]}>{t("settings.loginAction")}</Text>
                </Pressable>
                <Pressable
                  style={[buttons.buttonBase, buttons.primaryButton, styles.actionButton]}
                  onPress={() => navigation.navigate("Register")}
                >
                  <Text style={[typography.button, styles.optionTextActive]}>{t("settings.registerAction")}</Text>
                </Pressable>
              </>
            ) : (
              <Pressable
                style={[buttons.buttonBase, buttons.secondaryButton, styles.actionButtonSingle]}
                onPress={logout}
              >
                <Text style={[typography.button, styles.optionText]}>{t("settings.logoutAction")}</Text>
              </Pressable>
            )}
          </View>
        </View>

        <OptionGroup
          title={t("settings.language")}
          value={language}
          options={["de", "en"] as const}
          formatLabel={(option) => (option === "de" ? t("settings.languageDe") : t("settings.languageEn"))}
          onChange={setLanguage}
        />
        <OptionGroup
          title={t("settings.currency")}
          value={currency}
          options={["EUR", "Dollar"] as const}
          formatLabel={(option) => (option === "EUR" ? t("settings.currencyEur") : t("settings.currencyDollar"))}
          onChange={setCurrency}
        />
        <OptionGroup
          title={t("settings.theme")}
          value={theme}
          options={["Dark", "Light"] as const}
          formatLabel={(option) => (option === "Dark" ? t("settings.themeDark") : t("settings.themeLight"))}
          onChange={setTheme}
        />

        <View style={[surfaces.panel, styles.groupCard]}>
          <View style={styles.cardHeaderRow}>
            <Text style={[typography.cardTitle, styles.groupTitle]}>{t("settings.accentColor")}</Text>
            <View style={styles.lockBadge}>
              <Ionicons name="lock-closed-outline" size={14} color={colors.textSecondary} />
            </View>
          </View>
          <View style={styles.accentGrid}>
            {accentColorOptions.map((option) => {
              const isActive = option === accentColor;
              const accentPreview = getAccentPalette(option, mode);

              return (
                <Pressable
                  key={option}
                  style={[
                    styles.accentOption,
                    { borderColor: isActive ? colors.accent : colors.border },
                    isActive ? styles.accentOptionActive : null,
                  ]}
                  onPress={() => setAccentColor(option)}
                >
                  <View
                    style={[
                      styles.accentSwatch,
                      {
                        backgroundColor: accentPreview.accentSoft,
                        borderColor: accentPreview.accent,
                      },
                    ]}
                  >
                    <View style={[styles.accentSwatchInner, { backgroundColor: accentPreview.accent }]} />
                  </View>
                  <Text
                    style={[
                      typography.meta,
                      styles.accentOptionLabel,
                      isActive ? styles.optionTextActive : null,
                    ]}
                  >
                    {getAccentLabel(option, t)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.legalLinks}>
          <Pressable onPress={() => navigation.navigate("Terms")}>
            <Text style={[typography.secondary, styles.legalLink]}>{t("common.terms")}</Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate("Privacy")}>
            <Text style={[typography.secondary, styles.legalLink]}>{t("common.privacy")}</Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate("Imprint")}>
            <Text style={[typography.secondary, styles.legalLink]}>{t("common.imprint")}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const getAccentLabel = (option: AccentColor, t: (key: string) => string) =>
  (
    {
      indigo: t("settings.accentIndigo"),
      slate: t("settings.accentSlate"),
      graphite: t("settings.accentGraphite"),
      blue: t("settings.accentBlue"),
      sage: t("settings.accentSage"),
      cyan: t("settings.accentCyan"),
      teal: t("settings.accentTeal"),
      green: t("settings.accentGreen"),
      forest: t("settings.accentForest"),
      sand: t("settings.accentSand"),
      amber: t("settings.accentAmber"),
      orange: t("settings.accentOrange"),
      coral: t("settings.accentCoral"),
      gold: t("settings.accentGold"),
      violet: t("settings.accentViolet"),
      rose: t("settings.accentRose"),
    } satisfies Record<AccentColor, string>
  )[option];

const getStyles = (colors: ReturnType<typeof useAppTheme>["colors"]) =>
  StyleSheet.create({
    contentWithTabBar: {
      minHeight: "100%",
      paddingTop: 0,
    },
    accountText: {
      color: colors.textSecondary,
      lineHeight: 22,
    },
    groupCard: {
      gap: spacing.md,
    },
    sectionHeader: {
      minHeight: 28,
      justifyContent: "center",
    },
    groupTitle: {
      color: colors.textPrimary,
    },
    cardHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm,
    },
    optionRow: {
      flexDirection: "row",
      gap: spacing.sm,
      flexWrap: "wrap",
    },
    actionButton: {
      flex: 1,
      minWidth: 132,
    },
    actionButtonSingle: {
      minWidth: 132,
    },
    optionButton: {
      minWidth: 92,
      minHeight: 44,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      backgroundColor: colors.surfaceSoft,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
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
    accentGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      rowGap: spacing.sm,
    },
    accentOption: {
      width: "23%",
      minWidth: 0,
      minHeight: 86,
      paddingHorizontal: spacing.xs,
      paddingVertical: spacing.sm,
      borderRadius: radius.md,
      borderWidth: 1,
      backgroundColor: colors.surfaceSoft,
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.xs,
    },
    accentOptionActive: {
      backgroundColor: colors.accentSoft,
    },
    lockBadge: {
      width: 28,
      height: 28,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceSoft,
      alignItems: "center",
      justifyContent: "center",
    },
    accentSwatch: {
      width: 28,
      height: 28,
      borderRadius: radius.pill,
      borderWidth: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    accentSwatchInner: {
      width: 14,
      height: 14,
      borderRadius: radius.pill,
    },
    accentOptionLabel: {
      color: colors.textPrimary,
      textTransform: "capitalize",
      fontSize: 11,
      lineHeight: 14,
      textAlign: "center",
    },
    legalLinks: {
      gap: spacing.md,
      paddingTop: spacing.xs,
      paddingBottom: spacing.sm,
    },
    legalLink: {
      color: colors.textSecondary,
    },
  });
