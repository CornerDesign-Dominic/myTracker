import { useMemo } from "react";

import { useI18n } from "@/hooks/useI18n";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { useSubscriptionsHistory } from "@/hooks/useSubscriptionsHistory";
import {
  buildDevelopmentSummaryProjection,
  buildHomeMonthlyCardProjection,
  buildSavingsOverviewProjection,
  buildStatsSubscriptionsProjection,
  buildYearlyActualProjection,
} from "@/presentation/subscriptions/screenProjections";
import { buildSubscriptionMetrics } from "@/utils/subscriptionMetrics";

export const useStatsProjection = () => {
  const { language, t } = useI18n();
  const { subscriptions, isLoading } = useSubscriptions();
  const { history, isLoading: isHistoryLoading } = useSubscriptionsHistory(
    subscriptions.map((subscription) => subscription.id),
  );

  const isStatsDataLoading = isLoading || (subscriptions.length > 0 && isHistoryLoading);

  const statsSubscriptionsProjection = useMemo(
    () => buildStatsSubscriptionsProjection(subscriptions, history),
    [history, subscriptions],
  );
  const activeTheoreticalSubscriptions = useMemo(
    () =>
      subscriptions.filter(
        (subscription) => subscription.status === "active" && !subscription.archivedAt,
      ),
    [subscriptions],
  );
  const statisticsMetrics = useMemo(
    () => buildSubscriptionMetrics(activeTheoreticalSubscriptions, language),
    [activeTheoreticalSubscriptions, language],
  );
  const savingsOverview = useMemo(
    () => buildSavingsOverviewProjection(subscriptions, history, language, t),
    [history, language, subscriptions, t],
  );
  const homeStyleSummary = useMemo(
    () => buildHomeMonthlyCardProjection(subscriptions, history, language),
    [history, language, subscriptions],
  );
  const yearlyActualSummary = useMemo(
    () => buildYearlyActualProjection(history, "payment_booked"),
    [history],
  );
  const developmentSummary = useMemo(
    () =>
      buildDevelopmentSummaryProjection(
        history,
        "payment_booked",
        language,
        homeStyleSummary.totalAmount,
      ),
    [history, homeStyleSummary.totalAmount, language],
  );
  const savingsDevelopmentSummary = useMemo(
    () =>
      buildDevelopmentSummaryProjection(
        savingsOverview.skippedEvents,
        "payment_skipped_inactive",
        language,
        savingsOverview.savingsSummary.currentMonthProjected,
      ),
    [language, savingsOverview.savingsSummary.currentMonthProjected, savingsOverview.skippedEvents],
  );

  return {
    isStatsDataLoading,
    homeStyleSummary,
    savingsOverview,
    yearlyActualSummary,
    developmentSummary,
    savingsDevelopmentSummary,
    statsSubscriptionsProjection,
    statisticsMetrics,
  };
};
