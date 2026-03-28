import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useAppSettings } from "@/context/AppSettingsContext";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useI18n } from "@/hooks/useI18n";
import { RootStackParamList } from "@/navigation/types";
import {
  createButtonStyles,
  createScreenLayout,
  createSurfaceStyles,
  radius,
  spacing,
} from "@/theme";
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
              style={[
                styles.optionButton,
                isActive ? styles.optionButtonActive : null,
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

export const SettingsScreen = ({ navigation }: Props) => {
  const { colors, typography } = useAppTheme();
  const { language: locale, t } = useI18n();
  const styles = getStyles(colors);
  const layout = createScreenLayout(colors);
  const surfaces = createSurfaceStyles(colors);
  const buttons = createButtonStyles(colors);
  const { language, currency, theme, setLanguage, setCurrency, setTheme } = useAppSettings();
  const { currentUser, isAnonymous, logout } = useAuth();
  const accountCopy =
    locale === "de"
      ? {
          title: "Konto",
          anonymous:
            "Wenn du dich nicht registrierst oder einloggst, koennen deine Daten verloren gehen. Mit einer E-Mail koennen deine Daten einem Nutzer zugeordnet und auf anderen Geraeten wiederhergestellt werden.",
          signedIn:
            "Mit deiner E-Mail sind deine Daten deinem Konto zugeordnet und koennen auf anderen Geraeten wiederhergestellt werden.",
          login: "Login",
          register: "Registrieren",
          logout: "Abmelden",
          terms: "AGB",
          privacy: "Datenschutz",
          imprint: "Impressum",
        }
      : {
          title: "Account",
          anonymous:
            "If you do not register or sign in, your data may be lost. With an email address, your data can be linked to your account and restored on other devices.",
          signedIn:
            "Your data is linked to your account and can be restored on other devices.",
          login: "Login",
          register: "Register",
          logout: "Log out",
          terms: "Terms",
          privacy: "Privacy",
          imprint: "Imprint",
        };

  return (
    <SafeAreaView style={layout.screen} edges={["top", "bottom"]}>
      <ScrollView
        contentContainerStyle={[layout.content, styles.contentWithTabBar]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[surfaces.panel, styles.groupCard]}>
          <View style={styles.sectionHeader}>
            <Text style={[typography.cardTitle, styles.groupTitle]}>{accountCopy.title}</Text>
          </View>
          <Text style={[typography.secondary, styles.accountText]}>
            {isAnonymous ? accountCopy.anonymous : accountCopy.signedIn}
          </Text>
          <View style={styles.optionRow}>
            {isAnonymous ? (
              <>
                <Pressable
                  style={[buttons.buttonBase, buttons.secondaryButton, styles.actionButton]}
                  onPress={() => navigation.navigate("Login")}
                >
                  <Text style={[typography.button, styles.optionText]}>{accountCopy.login}</Text>
                </Pressable>
                <Pressable
                  style={[buttons.buttonBase, buttons.primaryButton, styles.actionButton]}
                  onPress={() => navigation.navigate("Register")}
                >
                  <Text style={[typography.button, styles.optionTextActive]}>{accountCopy.register}</Text>
                </Pressable>
              </>
            ) : (
              <Pressable
                style={[buttons.buttonBase, buttons.secondaryButton, styles.actionButtonSingle]}
                onPress={logout}
              >
                <Text style={[typography.button, styles.optionText]}>{accountCopy.logout}</Text>
              </Pressable>
            )}
          </View>
        </View>

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

        <View style={styles.legalLinks}>
          <Pressable onPress={() => navigation.navigate("Terms")}>
            <Text style={[typography.secondary, styles.legalLink]}>{accountCopy.terms}</Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate("Privacy")}>
            <Text style={[typography.secondary, styles.legalLink]}>{accountCopy.privacy}</Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate("Imprint")}>
            <Text style={[typography.secondary, styles.legalLink]}>{accountCopy.imprint}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

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
    legalLinks: {
      gap: spacing.md,
      paddingTop: spacing.xs,
      paddingBottom: spacing.sm,
    },
    legalLink: {
      color: colors.textSecondary,
    },
  });
