import { Ionicons } from "@expo/vector-icons";
import { PropsWithChildren, useEffect, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
  const styles = getStyles(colors);
  const surfaces = createSurfaceStyles(colors);
  const buttons = createButtonStyles(colors);
  const [androidKeyboardHeight, setAndroidKeyboardHeight] = useState(0);

  useEffect(() => {
    if (Platform.OS !== "android" || !visible) {
      setAndroidKeyboardHeight(0);
      return;
    }

    const showSubscription = Keyboard.addListener("keyboardDidShow", (event) => {
      setAndroidKeyboardHeight(event.endCoordinates.height);
    });
    const hideSubscription = Keyboard.addListener("keyboardDidHide", () => {
      setAndroidKeyboardHeight(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={[
            styles.keyboardShell,
            Platform.OS === "android" && androidKeyboardHeight > 0
              ? { paddingBottom: androidKeyboardHeight }
              : null,
          ]}
        >
          <SafeAreaView edges={["bottom"]} style={[surfaces.panel, styles.sheet, sheetStyle]}>
            <View style={styles.handle} />
            <View style={styles.header}>
              <Text style={[typography.sectionTitle, styles.title]}>{title}</Text>
              <Pressable style={styles.closeButton} onPress={onClose}>
                <Ionicons name="close-outline" size={22} color={colors.textSecondary} />
              </Pressable>
            </View>

            <View style={[styles.content, contentStyle]}>{children}</View>
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
          </SafeAreaView>
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
    sheet: {
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
      flexShrink: 1,
      minHeight: 0,
      paddingTop: spacing.sm,
      paddingBottom: spacing.lg,
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
      flexShrink: 1,
      minHeight: 0,
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
