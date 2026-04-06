import Constants from "expo-constants";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useAuth } from "@/context/AuthContext";
import { useAppSettings } from "@/context/AppSettingsContext";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useI18n } from "@/hooks/useI18n";
import { RootStackParamList } from "@/navigation/types";
import { submitContactRequest } from "@/services/contact/contactApi";
import {
  createButtonStyles,
  createInputStyles,
  createScreenLayout,
  createSurfaceStyles,
  radius,
  spacing,
} from "@/theme";

type Props = NativeStackScreenProps<RootStackParamList, "Contact">;

type ContactCategory = "suggestion" | "bug" | "question" | "other";

const CONTACT_SUBJECT_MAX_LENGTH = 120;
const CONTACT_MESSAGE_MAX_LENGTH = 3000;
const CONTACT_CATEGORY_OPTIONS: readonly ContactCategory[] = ["suggestion", "bug", "question", "other"];

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

export const ContactScreen = ({ navigation }: Props) => {
  const { colors, typography } = useAppTheme();
  const { t, language } = useI18n();
  const { currentUser, isAnonymous } = useAuth();
  const { theme } = useAppSettings();
  const layout = createScreenLayout(colors);
  const surfaces = createSurfaceStyles(colors);
  const buttons = createButtonStyles(colors);
  const inputs = createInputStyles(colors);
  const styles = getStyles(colors);
  const linkedEmail = !isAnonymous ? currentUser?.email?.trim() ?? "" : "";
  const [category, setCategory] = useState<ContactCategory>("suggestion");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState(linkedEmail);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!email.trim() && linkedEmail) {
      setEmail(linkedEmail);
    }
  }, [email, linkedEmail]);

  const userStatus = useMemo(() => {
    if (!currentUser) {
      return "signed-out" as const;
    }

    if (currentUser.isAnonymous) {
      return "anonymous" as const;
    }

    return "linked" as const;
  }, [currentUser]);

  const appVersion = Constants.expoConfig?.version ?? "1.0.0";

  const getCategoryLabel = (value: ContactCategory) => {
    switch (value) {
      case "suggestion":
        return t("settings.contactCategorySuggestion");
      case "bug":
        return t("settings.contactCategoryBug");
      case "question":
        return t("settings.contactCategoryQuestion");
      case "other":
        return t("settings.contactCategoryOther");
    }
  };

  const resetForm = () => {
    setCategory("suggestion");
    setSubject("");
    setMessage("");
    setEmail(linkedEmail);
  };

  const handleSubmit = async () => {
    const trimmedSubject = subject.trim();
    const trimmedMessage = message.trim();
    const trimmedEmail = email.trim();

    if (!category) {
      setErrorMessage(t("settings.contactValidationCategory"));
      return;
    }

    if (!trimmedSubject) {
      setErrorMessage(t("settings.contactValidationSubject"));
      return;
    }

    if (trimmedSubject.length > CONTACT_SUBJECT_MAX_LENGTH) {
      setErrorMessage(t("settings.contactValidationSubjectLength", { max: CONTACT_SUBJECT_MAX_LENGTH }));
      return;
    }

    if (!trimmedMessage) {
      setErrorMessage(t("settings.contactValidationMessage"));
      return;
    }

    if (trimmedMessage.length > CONTACT_MESSAGE_MAX_LENGTH) {
      setErrorMessage(t("settings.contactValidationMessageLength", { max: CONTACT_MESSAGE_MAX_LENGTH }));
      return;
    }

    if (!trimmedEmail) {
      setErrorMessage(t("settings.contactValidationEmail"));
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setErrorMessage(t("settings.contactValidationEmailFormat"));
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      const idToken = currentUser ? await currentUser.getIdToken() : null;

      await submitContactRequest({
        idToken,
        category,
        subject: trimmedSubject,
        message: trimmedMessage,
        email: trimmedEmail,
        appVersion,
        platform: Platform.OS,
        language,
        theme,
        userStatus,
        userId: currentUser?.uid ?? null,
        occurredAt: new Date().toISOString(),
      });

      resetForm();
      setSuccessMessage(t("settings.contactSubmitSuccess"));
    } catch (error) {
      const errorCode =
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        typeof (error as { code?: unknown }).code === "string"
          ? (error as { code: string }).code
          : null;

      if (errorCode === "invalid-contact-email") {
        setErrorMessage(t("settings.contactValidationEmailFormat"));
      } else if (errorCode === "invalid-contact-subject") {
        setErrorMessage(t("settings.contactValidationSubject"));
      } else if (errorCode === "invalid-contact-message") {
        setErrorMessage(t("settings.contactValidationMessage"));
      } else {
        setErrorMessage(t("settings.contactSubmitError"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={layout.screen} edges={["bottom"]}>
      <ScrollView contentContainerStyle={layout.content} showsVerticalScrollIndicator={false}>
        <View style={[surfaces.mainPanel, styles.introCard]}>
          <Text style={[typography.cardTitle, styles.title]}>{t("settings.contactTitle")}</Text>
          <Text style={[typography.secondary, styles.introText]}>{t("settings.contactScreenIntro")}</Text>
        </View>

        <View style={[surfaces.panel, styles.formCard]}>
          <Text style={[typography.cardTitle, styles.sectionTitle]}>{t("settings.contactCategoryLabel")}</Text>
          <View style={styles.categoryRow}>
            {CONTACT_CATEGORY_OPTIONS.map((option) => {
              const isActive = option === category;

              return (
                <Pressable
                  key={option}
                  style={[styles.categoryButton, isActive ? styles.categoryButtonActive : null]}
                  onPress={() => setCategory(option)}
                >
                  <Text
                    style={[
                      typography.button,
                      styles.categoryButtonText,
                      isActive ? styles.categoryButtonTextActive : null,
                    ]}
                  >
                    {getCategoryLabel(option)}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[typography.meta, styles.inputLabel]}>{t("settings.contactSubjectLabel")}</Text>
            <TextInput
              value={subject}
              onChangeText={(value) => {
                setSubject(value);
                if (errorMessage) {
                  setErrorMessage(null);
                }
                if (successMessage) {
                  setSuccessMessage(null);
                }
              }}
              maxLength={CONTACT_SUBJECT_MAX_LENGTH}
              placeholder={t("settings.contactSubjectPlaceholder")}
              placeholderTextColor={colors.textSecondary}
              style={[inputs.input, styles.input]}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[typography.meta, styles.inputLabel]}>{t("settings.contactMessageLabel")}</Text>
            <TextInput
              value={message}
              onChangeText={(value) => {
                setMessage(value);
                if (errorMessage) {
                  setErrorMessage(null);
                }
                if (successMessage) {
                  setSuccessMessage(null);
                }
              }}
              maxLength={CONTACT_MESSAGE_MAX_LENGTH}
              placeholder={t("settings.contactMessagePlaceholder")}
              placeholderTextColor={colors.textSecondary}
              multiline
              textAlignVertical="top"
              style={[inputs.input, styles.input, styles.messageInput]}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[typography.meta, styles.inputLabel]}>{t("settings.contactEmailLabel")}</Text>
            <TextInput
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                if (errorMessage) {
                  setErrorMessage(null);
                }
                if (successMessage) {
                  setSuccessMessage(null);
                }
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              placeholder={t("settings.contactEmailPlaceholder")}
              placeholderTextColor={colors.textSecondary}
              style={[inputs.input, styles.input]}
            />
          </View>

          <View style={styles.metaCard}>
            <View style={styles.metaRow}>
              <Text style={[typography.meta, styles.metaLabel]}>{t("settings.contactMetaPlatform")}</Text>
              <Text style={[typography.secondary, styles.metaValue]}>{Platform.OS}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={[typography.meta, styles.metaLabel]}>{t("settings.contactMetaVersion")}</Text>
              <Text style={[typography.secondary, styles.metaValue]}>{appVersion}</Text>
            </View>
          </View>

          {errorMessage ? (
            <Text style={[typography.secondary, styles.errorText]}>{errorMessage}</Text>
          ) : null}
          {successMessage ? (
            <View style={styles.successRow}>
              <Ionicons name="checkmark-circle" size={18} color={colors.accent} />
              <Text style={[typography.secondary, styles.successText]}>{successMessage}</Text>
            </View>
          ) : null}

          <View style={styles.actions}>
            <Pressable
              style={[buttons.buttonBase, buttons.secondaryButton, styles.actionButton]}
              onPress={() => navigation.goBack()}
              disabled={isSubmitting}
            >
              <Text style={[typography.button, styles.secondaryButtonText]}>{t("common.cancel")}</Text>
            </Pressable>
            <Pressable
              style={[buttons.buttonBase, buttons.primaryButton, styles.actionButton]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={colors.accent} />
              ) : (
                <Text style={[typography.button, styles.primaryButtonText]}>
                  {t("settings.contactSubmitAction")}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (colors: ReturnType<typeof useAppTheme>["colors"]) =>
  StyleSheet.create({
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
    formCard: {
      gap: spacing.md,
    },
    sectionTitle: {
      color: colors.textPrimary,
    },
    categoryRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
    },
    categoryButton: {
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
    categoryButtonActive: {
      backgroundColor: colors.accentSoft,
      borderColor: colors.accent,
    },
    categoryButtonText: {
      color: colors.textPrimary,
    },
    categoryButtonTextActive: {
      color: colors.accent,
    },
    fieldGroup: {
      gap: spacing.xs,
    },
    inputLabel: {
      color: colors.textSecondary,
      textTransform: "uppercase",
    },
    input: {
      color: colors.textPrimary,
    },
    messageInput: {
      minHeight: 168,
    },
    metaCard: {
      gap: spacing.xs,
      padding: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceSoft,
    },
    metaRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.md,
    },
    metaLabel: {
      color: colors.textSecondary,
      textTransform: "uppercase",
    },
    metaValue: {
      color: colors.textPrimary,
    },
    errorText: {
      color: colors.danger,
      lineHeight: 21,
    },
    successRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
    },
    successText: {
      color: colors.textSecondary,
      flex: 1,
      lineHeight: 21,
    },
    actions: {
      flexDirection: "row",
      gap: spacing.sm,
    },
    actionButton: {
      flex: 1,
    },
    secondaryButtonText: {
      color: colors.textPrimary,
    },
    primaryButtonText: {
      color: colors.accent,
    },
  });
