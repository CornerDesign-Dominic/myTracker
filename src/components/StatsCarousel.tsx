import { ReactNode, useMemo, useState } from "react";
import {
  FlatList,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useAppTheme } from "@/hooks/useAppTheme";
import { createSurfaceStyles, radius, spacing } from "@/theme";

export type StatsCarouselPage = {
  key: string;
  headerClaim: string;
  content: ReactNode;
};

type StatsCarouselProps = {
  pages: StatsCarouselPage[];
};

export const StatsCarousel = ({ pages }: StatsCarouselProps) => {
  const { colors, typography } = useAppTheme();
  const surfaces = createSurfaceStyles(colors);
  const styles = getStyles(colors);
  const [pageWidth, setPageWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);

  const carouselPages = useMemo(() => pages, [pages]);

  const handleLayout = (event: LayoutChangeEvent) => {
    const nextWidth = Math.round(event.nativeEvent.layout.width);

    if (nextWidth > 0 && nextWidth !== pageWidth) {
      setPageWidth(nextWidth);
    }
  };

  const handleMomentumEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!pageWidth) {
      return;
    }

    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / pageWidth);
    setActiveIndex(nextIndex);
  };

  return (
    <View style={styles.container}>
      <View style={styles.viewport} onLayout={handleLayout}>
        {pageWidth > 0 ? (
          <FlatList
            data={carouselPages}
            keyExtractor={(item) => item.key}
            horizontal
            pagingEnabled
            bounces={false}
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleMomentumEnd}
            renderItem={({ item }) => (
              <View style={[styles.page, { width: pageWidth }]}>
                <View style={[surfaces.mainSubtlePanel, styles.headerCard]}>
                  <Text style={[typography.cardTitle, styles.headerClaim]}>{item.headerClaim}</Text>
                </View>
                <View style={styles.mainCardSlot}>{item.content}</View>
              </View>
            )}
          />
        ) : null}
      </View>

      <View style={styles.pagination}>
        {carouselPages.map((page, index) => (
          <View
            key={page.key}
            style={[
              styles.dot,
              index === activeIndex ? styles.dotActive : null,
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const getStyles = (colors: ReturnType<typeof useAppTheme>["colors"]) =>
  StyleSheet.create({
    container: {
      flex: 1,
      gap: spacing.md,
    },
    viewport: {
      flex: 1,
    },
    page: {
      flex: 1,
      gap: spacing.md,
      paddingRight: spacing.xs,
    },
    headerCard: {
      minHeight: 84,
      justifyContent: "center",
      paddingVertical: spacing.md,
    },
    headerClaim: {
      color: colors.textPrimary,
    },
    mainCardSlot: {
      flex: 1,
    },
    pagination: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.sm,
      minHeight: 12,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: radius.pill,
      backgroundColor: colors.border,
    },
    dotActive: {
      width: 18,
      backgroundColor: colors.accent,
    },
  });
