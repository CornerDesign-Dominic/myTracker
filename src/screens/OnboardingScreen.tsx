import { Ionicons } from "@expo/vector-icons";
import { useMemo, useRef, useState } from "react";
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAppTheme } from "@/hooks/useAppTheme";
import { useI18n } from "@/hooks/useI18n";
import { createButtonStyles, radius, spacing } from "@/theme";

type CompletionTarget = "tabs" | "subscription-form";

type Props = {
  onComplete: (target: CompletionTarget) => Promise<void> | void;
};

type Slide = {
  key: string;
  title: string;
  description?: string;
  icon: keyof typeof Ionicons.glyphMap;
  renderStatusOverview?: boolean;
};

export const OnboardingScreen = ({ onComplete }: Props) => {
  const { width } = useWindowDimensions();
  const { colors, typography } = useAppTheme();
  const { t } = useI18n();
  const buttons = createButtonStyles(colors);
  const styles = getStyles(colors);
  const listRef = useRef<FlatList<Slide> | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const slides = useMemo<Slide[]>(
    () => [
      {
        key: "welcome",
        title: t("onboarding.welcomeTitle"),
        description: t("onboarding.welcomeDescription"),
        icon: "wallet-outline",
      },
      {
        key: "how-it-works",
        title: t("onboarding.howItWorksTitle"),
        icon: "repeat-outline",
        renderStatusOverview: true,
      },
      {
        key: "data",
        title: t("onboarding.dataTitle"),
        description: t("onboarding.dataDescription"),
        icon: "shield-checkmark-outline",
      },
      {
        key: "support",
        title: t("onboarding.supportTitle"),
        description: t("onboarding.supportDescription"),
        icon: "color-palette-outline",
      },
      {
        key: "start",
        title: t("onboarding.startTitle"),
        description: t("onboarding.startDescription"),
        icon: "rocket-outline",
      },
    ],
    [t],
  );

  const isFirstSlide = currentIndex === 0;
  const isLastSlide = currentIndex === slides.length - 1;

  const goToIndex = (index: number) => {
    listRef.current?.scrollToIndex({ index, animated: true });
    setCurrentIndex(index);
  };

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / Math.max(width, 1));
    setCurrentIndex(nextIndex);
  };

  const handleSkip = async () => {
    await onComplete("tabs");
  };

  const handleContinue = async () => {
    if (isLastSlide) {
      await onComplete("subscription-form");
      return;
    }

    goToIndex(currentIndex + 1);
  };

  const handleBack = () => {
    if (isFirstSlide) {
      return;
    }

    goToIndex(currentIndex - 1);
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <Pressable hitSlop={10} onPress={handleSkip}>
          <Text style={[typography.meta, styles.skipLabel]}>{t("common.skip")}</Text>
        </Pressable>
      </View>

      <FlatList
        ref={listRef}
        data={slides}
        horizontal
        pagingEnabled
        bounces={false}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.key}
        onMomentumScrollEnd={handleScrollEnd}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <View style={styles.slideContent}>
              <View style={styles.visualWrap}>
                <View style={styles.visualOrb} />
                <View style={styles.visualSurface}>
                  <Ionicons name={item.icon} size={42} color={colors.accent} />
                </View>
              </View>

              <View style={styles.copyBlock}>
                <Text style={[typography.pageTitle, styles.title]}>{item.title}</Text>
                {item.renderStatusOverview ? (
                  <View style={styles.statusList}>
                    <StatusCard
                      icon="checkmark-circle-outline"
                      title={t("onboarding.statusActiveTitle")}
                      description={t("onboarding.statusActiveDescription")}
                    />
                    <StatusCard
                      icon="pause-circle-outline"
                      title={t("onboarding.statusPausedTitle")}
                      description={t("onboarding.statusPausedDescription")}
                    />
                    <StatusCard
                      icon="close-circle-outline"
                      title={t("onboarding.statusCancelledTitle")}
                      description={t("onboarding.statusCancelledDescription")}
                    />
                  </View>
                ) : (
                  <Text style={[typography.body, styles.description]}>{item.description}</Text>
                )}
              </View>
            </View>
          </View>
        )}
      />

      <View style={styles.footer}>
        <Pressable
          style={[styles.footerButton, !isFirstSlide ? styles.footerButtonVisible : null]}
          onPress={handleBack}
          disabled={isFirstSlide}
        >
          <Text
            style={[
              typography.meta,
              styles.footerButtonLabel,
              isFirstSlide ? styles.footerButtonHidden : null,
            ]}
          >
            {t("common.back")}
          </Text>
        </Pressable>

        <View style={styles.dots}>
          {slides.map((slide, index) => (
            <View
              key={slide.key}
              style={[styles.dot, index === currentIndex ? styles.dotActive : null]}
            />
          ))}
        </View>

        <Pressable
          style={[
            buttons.buttonBase,
            isLastSlide ? buttons.primaryButton : buttons.secondaryButton,
            styles.ctaButton,
          ]}
          onPress={handleContinue}
        >
          <Text
            style={[
              typography.button,
              isLastSlide ? styles.primaryCtaLabel : styles.secondaryCtaLabel,
            ]}
          >
            {isLastSlide ? t("onboarding.startCta") : t("common.next")}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

const StatusCard = ({
  icon,
  title,
  description,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}) => {
  const { colors, typography } = useAppTheme();
  const styles = getStyles(colors);

  return (
    <View style={styles.statusCard}>
      <View style={styles.statusIconWrap}>
        <Ionicons name={icon} size={18} color={colors.accent} />
      </View>
      <View style={styles.statusCopy}>
        <Text style={[typography.cardTitle, styles.statusTitle]}>{title}</Text>
        <Text style={[typography.secondary, styles.statusDescription]}>{description}</Text>
      </View>
    </View>
  );
};

const getStyles = (colors: ReturnType<typeof useAppTheme>["colors"]) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xs,
      paddingBottom: spacing.sm,
    },
    headerSpacer: {
      width: 56,
    },
    skipLabel: {
      color: colors.textSecondary,
      textTransform: "uppercase",
    },
    slide: {
      flex: 1,
      paddingHorizontal: spacing.xl,
    },
    slideContent: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      gap: spacing.xl,
      paddingBottom: spacing.xl,
    },
    visualWrap: {
      width: 180,
      height: 180,
      alignItems: "center",
      justifyContent: "center",
    },
    visualOrb: {
      position: "absolute",
      width: 180,
      height: 180,
      borderRadius: 90,
      backgroundColor: colors.accentSoft,
      opacity: 0.7,
    },
    visualSurface: {
      width: 112,
      height: 112,
      borderRadius: 32,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    copyBlock: {
      width: "100%",
      alignItems: "center",
      gap: spacing.md,
    },
    title: {
      color: colors.textPrimary,
      textAlign: "center",
    },
    description: {
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: 24,
      maxWidth: 320,
    },
    statusList: {
      width: "100%",
      gap: spacing.sm,
      marginTop: spacing.xs,
    },
    statusCard: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.sm,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
    },
    statusIconWrap: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.accentSoft,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 2,
    },
    statusCopy: {
      flex: 1,
      gap: spacing.xxs,
    },
    statusTitle: {
      color: colors.textPrimary,
    },
    statusDescription: {
      color: colors.textSecondary,
      lineHeight: 20,
    },
    footer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.lg,
    },
    footerButton: {
      minWidth: 72,
      minHeight: 48,
      justifyContent: "center",
    },
    footerButtonVisible: {
      opacity: 1,
    },
    footerButtonLabel: {
      color: colors.textSecondary,
      textTransform: "uppercase",
    },
    footerButtonHidden: {
      color: "transparent",
    },
    dots: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.xs,
      flex: 1,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.border,
    },
    dotActive: {
      width: 22,
      backgroundColor: colors.accent,
    },
    ctaButton: {
      minWidth: 120,
    },
    primaryCtaLabel: {
      color: colors.textPrimary,
    },
    secondaryCtaLabel: {
      color: colors.textPrimary,
    },
  });
