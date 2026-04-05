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
import { radius, spacing } from "@/theme";

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
  renderDataOverview?: boolean;
  renderStartOverview?: boolean;
};

export const OnboardingScreen = ({ onComplete }: Props) => {
  const { width } = useWindowDimensions();
  const { colors, typography } = useAppTheme();
  const { t } = useI18n();
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
        icon: "list-circle-outline",
        renderStatusOverview: true,
      },
      {
        key: "data",
        title: t("onboarding.dataTitle"),
        icon: "shield-checkmark-outline",
        renderDataOverview: true,
      },
      {
        key: "start",
        title: t("onboarding.startTitle"),
        description: t("onboarding.startDescription"),
        icon: "rocket-outline",
        renderStartOverview: true,
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
                      icon="list-outline"
                      title={t("onboarding.howItWorksAddTitle")}
                      description={t("onboarding.howItWorksAddDescription")}
                      plain
                      showDivider
                    />
                    <StatusCard
                      icon="card-outline"
                      title={t("onboarding.howItWorksTrackTitle")}
                      description={t("onboarding.howItWorksTrackDescription")}
                      plain
                      showDivider
                    />
                    <StatusCard
                      icon="checkmark-done-outline"
                      title={t("onboarding.howItWorksStayOnTopTitle")}
                      description={t("onboarding.howItWorksStayOnTopDescription")}
                      plain
                    />
                  </View>
                ) : item.renderDataOverview ? (
                  <View style={styles.statusList}>
                    <StatusCard
                      icon="person-outline"
                      title={t("onboarding.dataStartTitle")}
                      description={t("onboarding.dataStartDescription")}
                      plain
                      showDivider
                    />
                    <StatusCard
                      icon="cloud-outline"
                      title={t("onboarding.dataSafeTitle")}
                      description={t("onboarding.dataSafeDescription")}
                      plain
                      showDivider
                    />
                    <StatusCard
                      icon="mail-outline"
                      title={t("onboarding.dataEmailTitle")}
                      description={t("onboarding.dataEmailDescription")}
                      plain
                    />
                  </View>
                ) : item.renderStartOverview ? (
                  <>
                    <Text style={[typography.body, styles.description]}>{item.description}</Text>
                    <View style={styles.startHighlights}>
                      <StatusCard
                        icon="checkmark-outline"
                        title={t("onboarding.startFreeTitle")}
                        plain
                        compact
                        showDivider
                      />
                      <StatusCard
                        icon="diamond-outline"
                        title={t("onboarding.startPremiumTitle")}
                        plain
                        compact
                      />
                    </View>
                  </>
                ) : (
                  <Text style={[typography.body, styles.description]}>{item.description}</Text>
                )}
              </View>
            </View>
          </View>
        )}
      />

      <View style={styles.footer}>
        <View style={[styles.footerSide, styles.footerSideLeft]}>
          <Pressable
            style={[styles.navTextAction, isFirstSlide ? styles.navTextActionHidden : null]}
            onPress={handleBack}
            disabled={isFirstSlide}
          >
            <Text
              style={[
                typography.meta,
                styles.backActionLabel,
                isFirstSlide ? styles.navButtonLabelHidden : null,
              ]}
            >
              {t("common.back")}
            </Text>
          </Pressable>
        </View>

        <View style={styles.dots}>
          {slides.map((slide, index) => (
            <View
              key={slide.key}
              style={[styles.dot, index === currentIndex ? styles.dotActive : null]}
            />
          ))}
        </View>

        <View style={[styles.footerSide, styles.footerSideRight]}>
          <Pressable style={styles.navTextAction} onPress={handleContinue}>
            <Text
              style={[
                typography.meta,
                isLastSlide ? styles.primaryCtaLabel : styles.nextActionLabel,
              ]}
            >
              {isLastSlide ? t("onboarding.startCta") : t("common.next")}
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
};

const StatusCard = ({
  icon,
  title,
  description,
  showDivider = false,
  plain = false,
  compact = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  showDivider?: boolean;
  plain?: boolean;
  compact?: boolean;
}) => {
  const { colors, typography } = useAppTheme();
  const styles = getStyles(colors);

  return (
    <View
      style={[
        styles.statusCard,
        plain ? styles.statusCardPlain : null,
        compact ? styles.statusCardCompact : null,
        showDivider ? styles.statusCardDivider : null,
      ]}
    >
      <View style={styles.statusCardRow}>
        <View style={styles.statusIconWrap}>
          <Ionicons name={icon} size={18} color={colors.accent} />
        </View>
        <View style={styles.statusCopy}>
          <Text style={[typography.cardTitle, styles.statusTitle]}>{title}</Text>
          {description ? (
            <Text style={[typography.secondary, styles.statusDescription]}>{description}</Text>
          ) : null}
        </View>
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
      justifyContent: "flex-start",
      alignItems: "center",
      gap: spacing.xl,
      paddingTop: spacing.xxxl,
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
      transform: [{ translateY: -10 }],
    },
    copyBlock: {
      width: "100%",
      alignItems: "center",
      gap: spacing.md,
    },
    title: {
      color: colors.textPrimary,
      textAlign: "center",
      marginTop: -15,
    },
    description: {
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: 24,
      maxWidth: 320,
    },
    startHighlights: {
      width: "100%",
      marginTop: spacing.sm,
      paddingTop: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    statusPanel: {
      width: "100%",
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      marginTop: spacing.xs,
    },
    statusList: {
      width: "100%",
      marginTop: spacing.xs,
    },
    statusCard: {
      padding: spacing.md,
    },
    statusCardPlain: {
      paddingHorizontal: 0,
      backgroundColor: "transparent",
    },
    statusCardCompact: {
      paddingVertical: spacing.sm,
    },
    statusCardDivider: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    statusCardRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.sm,
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
      gap: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.lg,
    },
    footerSide: {
      width: 148,
      minHeight: 44,
      justifyContent: "center",
    },
    footerSideLeft: {
      alignItems: "flex-start",
    },
    footerSideRight: {
      alignItems: "flex-end",
    },
    navTextAction: {
      minHeight: 44,
      justifyContent: "center",
    },
    navTextActionHidden: {
      opacity: 0,
    },
    backActionLabel: {
      color: colors.textPrimary,
      textTransform: "uppercase",
    },
    navButtonLabelHidden: {
      color: "transparent",
    },
    dots: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.xs,
      flex: 1,
      minWidth: 0,
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
    primaryCtaLabel: {
      color: colors.accent,
      textTransform: "uppercase",
    },
    nextActionLabel: {
      color: colors.accent,
      textTransform: "uppercase",
    },
  });
