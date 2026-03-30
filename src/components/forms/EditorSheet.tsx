import { Ionicons } from "@expo/vector-icons";
import { PropsWithChildren } from "react";
import { Modal, Pressable, StyleSheet, Text, useWindowDimensions, View, ViewStyle } from "react-native";
import {
  KeyboardAwareScrollView,
  KeyboardAvoidingView,
} from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAppTheme } from "@/hooks/useAppTheme";
import {
  createButtonStyles,
  createSurfaceStyles,
  radius,
  shadowPresets,
  spacing,
} from "@/theme";

type EditorSheetProps = PropsWithChildren<{
  visible: boolean;
  title: string;
  onClose: () => void;
  onConfirm?: () => void;
  confirmLabel: string;
  showConfirm?: boolean;
  sheetStyle?: ViewStyle;
  contentStyle?: ViewStyle;
}>;

export const EditorSheet = ({
  visible,
  title,
  onClose,
  onConfirm,
  confirmLabel,
  showConfirm = true,
  sheetStyle,
  contentStyle,
  children,
}: EditorSheetProps) => {
  const { colors, typography } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const styles = getStyles(colors);
  const surfaces = createSurfaceStyles(colors);
  const buttons = createButtonStyles(colors);
  const sheetMaxHeight = Math.max(windowHeight - insets.top - insets.bottom - spacing.lg, 0);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="overFullScreen"
      statusBarTranslucent
      navigationBarTranslucent
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <KeyboardAvoidingView
          behavior="padding"
          enabled={visible}
          style={styles.keyboardShell}
        >
          <View style={[styles.sheetPositioner, { paddingBottom: insets.bottom }]}>
            <View
              style={[
                surfaces.panel,
                styles.sheet,
                { maxHeight: sheetMaxHeight },
                sheetStyle,
              ]}
            >
              <View style={styles.handle} />
              <View style={styles.header}>
                <Text style={[typography.sectionTitle, styles.title]}>{title}</Text>
                <Pressable style={styles.closeButton} onPress={onClose}>
                  <Ionicons name="close-outline" size={22} color={colors.textSecondary} />
                </Pressable>
              </View>

              <KeyboardAwareScrollView
                enabled={visible}
                bottomOffset={spacing.md}
                extraKeyboardSpace={insets.bottom}
                keyboardShouldPersistTaps="handled"
                bounces={false}
                alwaysBounceVertical={false}
                showsVerticalScrollIndicator={false}
                style={styles.content}
                contentContainerStyle={[styles.contentContainer, contentStyle]}
              >
                {children}
              </KeyboardAwareScrollView>
              {showConfirm ? (
                <View style={styles.actions}>
                  <Pressable
                    style={[buttons.buttonBase, buttons.primaryButton, styles.action]}
                    onPress={onConfirm}
                  >
                    <Text style={[typography.button, styles.primaryLabel]}>{confirmLabel}</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const getStyles = (colors: ReturnType<typeof useAppTheme>["colors"]) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: colors.overlay,
    },
    keyboardShell: {
      flex: 1,
      justifyContent: "flex-end",
    },
    sheetPositioner: {
      flex: 1,
      justifyContent: "flex-end",
      paddingHorizontal: spacing.sm,
      paddingTop: spacing.lg,
    },
    sheet: {
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
      flexShrink: 1,
      minHeight: 0,
      paddingTop: spacing.sm,
      paddingBottom: spacing.lg,
      paddingHorizontal: spacing.lg,
      gap: spacing.lg,
      ...shadowPresets.card(colors),
    },
    handle: {
      alignSelf: "center",
      width: 44,
      height: 5,
      borderRadius: radius.pill,
      backgroundColor: colors.borderStrong,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.md,
    },
    title: {
      color: colors.textPrimary,
      flex: 1,
    },
    closeButton: {
      width: 36,
      height: 36,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: radius.pill,
      backgroundColor: colors.surfaceSoft,
      borderWidth: 1,
      borderColor: colors.border,
    },
    content: {
      flexGrow: 0,
      flexShrink: 1,
      minHeight: 0,
    },
    contentContainer: {
      gap: spacing.md,
    },
    actions: {
      flexDirection: "row",
      gap: spacing.md,
    },
    action: {
      width: "100%",
    },
    primaryLabel: {
      color: colors.accent,
    },
  });
