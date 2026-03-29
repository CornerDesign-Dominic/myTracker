import test from "node:test";
import assert from "node:assert/strict";

import {
  getSubscriptionFormErrorCode,
  shouldRequireNextPaymentConfirmation,
} from "../../src/domain/subscriptions/formValidation.ts";

const baseFormState = {
  name: "Netflix",
  category: "Unterhaltung",
  amount: 12.99,
  billingCycle: "monthly" as const,
  nextPaymentDate: "2026-04-15",
  status: "active" as const,
  endDate: "",
  notes: "",
};

test("billing cycle change requires explicit next payment confirmation", () => {
  assert.equal(shouldRequireNextPaymentConfirmation("yearly", "monthly"), true);
  assert.equal(shouldRequireNextPaymentConfirmation("quarterly", "monthly"), true);
  assert.equal(shouldRequireNextPaymentConfirmation("monthly", "monthly"), false);
});

test("validation blocks saving while billing cycle confirmation is pending", () => {
  const result = getSubscriptionFormErrorCode({
    formState: {
      ...baseFormState,
      billingCycle: "yearly",
    },
    requiresNextPaymentConfirmation: true,
  });

  assert.equal(result, "billingCycleConfirmation");
});

test("validation allows changed billing cycle once next payment was confirmed", () => {
  const result = getSubscriptionFormErrorCode({
    formState: {
      ...baseFormState,
      billingCycle: "quarterly",
      nextPaymentDate: "2026-07-15",
    },
    requiresNextPaymentConfirmation: false,
  });

  assert.equal(result, null);
});

test("validation still catches invalid next payment dates and invalid cancelled end dates", () => {
  assert.equal(
    getSubscriptionFormErrorCode({
      formState: {
        ...baseFormState,
        nextPaymentDate: "invalid-date",
      },
      requiresNextPaymentConfirmation: false,
    }),
    "nextPaymentDate",
  );

  assert.equal(
    getSubscriptionFormErrorCode({
      formState: {
        ...baseFormState,
        status: "cancelled",
        endDate: "invalid-date",
      },
      requiresNextPaymentConfirmation: false,
    }),
    "endDate",
  );
});
