import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useI18n } from "@/hooks/useI18n";
import { RootStackParamList } from "@/navigation/types";
import {
  createButtonStyles,
  createInputStyles,
  createScreenLayout,
  createSurfaceStyles,
  spacing,
} from "@/theme";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

type Props = NativeStackScreenProps<RootStackParamList, "Register">;

export const RegisterScreen = ({ navigation }: Props) => {
  const { colors, typography } = useAppTheme();
  const { language } = useI18n();
  const layout = createScreenLayout(colors);
  const surfaces = createSurfaceStyles(colors);
  const buttons = createButtonStyles(colors);
  const inputs = createInputStyles(colors);
  const styles = getStyles(colors);
  const { register } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const copy =
    language === "de"
      ? {
          title: "Registrierung",
          email: "E-Mail",
          password: "Passwort",
          submit: "Konto erstellen",
          switch: "Bereits ein Konto? Einloggen",
          emailError: "Bitte gib eine gültige E-Mail-Adresse ein.",
          passwordError: "Das Passwort muss mindestens 6 Zeichen lang sein.",
          genericError: "Registrierung fehlgeschlagen.",
        }
      : {
          title: "Register",
          email: "Email",
          password: "Password",
          submit: "Create account",
          switch: "Already have an account? Sign in",
          emailError: "Please enter a valid email address.",
          passwordError: "Password must be at least 6 characters.",
          genericError: "Registration failed.",
        };

  const handleSubmit = async () => {
    if (!email.includes("@")) {
      setError(copy.emailError);
      return;
    }

    if (password.length < 6) {
      setError(copy.passwordError);
      return;
    }

    try {
      setError(null);
      await register(email, password);
      navigation.goBack();
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : copy.genericError);
    }
  };

  return (
    <SafeAreaView style={layout.screen} edges={["top", "bottom"]}>
      <View style={layout.content}>
        <Text style={[typography.pageTitle, styles.title]}>{copy.title}</Text>

        <View style={[surfaces.panel, styles.formCard]}>
          <Text style={[typography.meta, styles.label]}>{copy.email}</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            style={[inputs.input, styles.input]}
          />

          <Text style={[typography.meta, styles.label]}>{copy.password}</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={[inputs.input, styles.input]}
          />

          {error ? <Text style={[typography.secondary, styles.error]}>{error}</Text> : null}

          <Pressable style={[buttons.buttonBase, buttons.primaryButton]} onPress={handleSubmit}>
            <Text style={[typography.button, styles.primaryButtonText]}>{copy.submit}</Text>
          </Pressable>

          <Pressable onPress={() => navigation.replace("Login")}>
            <Text style={[typography.secondary, styles.link]}>{copy.switch}</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
};

const getStyles = (colors: ReturnType<typeof useAppTheme>["colors"]) =>
  StyleSheet.create({
    title: {
      color: colors.textPrimary,
    },
    formCard: {
      gap: spacing.md,
    },
    label: {
      color: colors.textSecondary,
      textTransform: "uppercase",
    },
    input: {
      color: colors.textPrimary,
    },
    primaryButtonText: {
      color: colors.accent,
    },
    link: {
      color: colors.accent,
      textAlign: "center",
    },
    error: {
      color: colors.danger,
    },
  });
