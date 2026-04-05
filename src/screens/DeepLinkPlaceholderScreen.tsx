import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAppTheme } from "@/hooks/useAppTheme";
import { RootStackParamList } from "@/navigation/types";
import { createScreenLayout, createSurfaceStyles, spacing } from "@/theme";

type DeepLinkRouteName =
  | "ResetPasswordLink"
  | "ConfirmEmailLink"
  | "PurchaseSuccessLink"
  | "PurchaseCancelledLink"
  | "OpenSubscriptionLink";

type Props = NativeStackScreenProps<RootStackParamList, DeepLinkRouteName>;

const contentByRoute: Record<
  DeepLinkRouteName,
  {
    title: string;
    description: string;
    todo: string;
  }
> = {
  ResetPasswordLink: {
    title: "Reset password",
    description: "The native deep-link route is prepared. The final password reset UX can be wired here later.",
    todo: "TODO: connect Firebase action-code validation and the final reset form.",
  },
  ConfirmEmailLink: {
    title: "Confirm email",
    description: "The native deep-link route is prepared. The final email confirmation flow can be finished in JS.",
    todo: "TODO: connect Firebase action-code verification and success/error states.",
  },
  PurchaseSuccessLink: {
    title: "Purchase success",
    description: "The purchase return route is ready for a post-checkout confirmation experience.",
    todo: "TODO: refresh entitlement state and show the final success UX.",
  },
  PurchaseCancelledLink: {
    title: "Purchase cancelled",
    description: "The purchase cancellation route is ready if the billing UX needs an explicit return screen.",
    todo: "TODO: map store/provider cancellation reasons to the final UX.",
  },
  OpenSubscriptionLink: {
    title: "Open subscription",
    description: "The route already accepts a subscription identifier so the final app can jump to details directly.",
    todo: "TODO: validate the subscription id and redirect into the final detail screen.",
  },
};

export const DeepLinkPlaceholderScreen = ({ route }: Props) => {
  const { colors, typography } = useAppTheme();
  const layout = createScreenLayout(colors);
  const surfaces = createSurfaceStyles(colors);
  const content = contentByRoute[route.name];

  return (
    <SafeAreaView style={layout.screen}>
      <View style={[layout.content, { justifyContent: "center", gap: spacing.md }]}>
        <View style={[surfaces.mainPanel, { gap: spacing.sm }]}>
          <Text style={[typography.pageTitle, { color: colors.textPrimary }]}>{content.title}</Text>
          <Text style={[typography.body, { color: colors.textSecondary, lineHeight: 22 }]}>
            {content.description}
          </Text>
          <Text style={[typography.meta, { color: colors.textMuted, lineHeight: 20 }]}>
            {content.todo}
          </Text>
          <Text style={[typography.meta, { color: colors.textMuted }]}>
            Params: {JSON.stringify(route.params ?? {}, null, 2)}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};
