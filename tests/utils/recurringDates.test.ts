import test from "node:test";
import assert from "node:assert/strict";

import {
  getRecurringDueDateInputForMonth,
  shiftRecurringDateInput,
} from "../../src/utils/recurringDates.ts";

test("monthly recurring date moves 2026-01-31 to 2026-02-28", () => {
  assert.equal(
    shiftRecurringDateInput("2026-01-31", "monthly", 1),
    "2026-02-28",
  );
});

test("monthly recurring date moves 2024-01-31 to 2024-02-29 in leap year", () => {
  assert.equal(
    shiftRecurringDateInput("2024-01-31", "monthly", 1),
    "2024-02-29",
  );
});

test("monthly recurring date moves 2026-03-31 to 2026-04-30", () => {
  assert.equal(
    shiftRecurringDateInput("2026-03-31", "monthly", 1),
    "2026-04-30",
  );
});

test("quarterly recurring date moves 2026-01-31 to 2026-04-30", () => {
  assert.equal(
    shiftRecurringDateInput("2026-01-31", "quarterly", 1),
    "2026-04-30",
  );
});

test("monthly recurring date keeps 2026-05-30 on 2026-06-30", () => {
  assert.equal(
    shiftRecurringDateInput("2026-05-30", "monthly", 1),
    "2026-06-30",
  );
});

test("monthly recurring date moves 2026-05-31 to 2026-06-30", () => {
  assert.equal(
    shiftRecurringDateInput("2026-05-31", "monthly", 1),
    "2026-06-30",
  );
});

test("repeated monthly shifts preserve original anchor day across short months", () => {
  const february = shiftRecurringDateInput("2026-01-31", "monthly", 1);
  const march = shiftRecurringDateInput(february, "monthly", 1, 31);

  assert.equal(february, "2026-02-28");
  assert.equal(march, "2026-03-31");
});

test("visible month marks a monthly subscription on the 15th in every month", () => {
  assert.equal(
    getRecurringDueDateInputForMonth({
      anchorDate: "2026-03-15",
      billingCycle: "monthly",
      targetMonth: "2026-07-01",
      startsOn: "2026-01-01T00:00:00.000Z",
    }),
    "2026-07-15",
  );
});

test("visible month clamps a monthly subscription on the 31st to april 30", () => {
  assert.equal(
    getRecurringDueDateInputForMonth({
      anchorDate: "2026-01-31",
      billingCycle: "monthly",
      targetMonth: "2026-04-01",
      startsOn: "2026-01-01T00:00:00.000Z",
    }),
    "2026-04-30",
  );
});

test("visible month clamps a monthly subscription on the 31st to february 28", () => {
  assert.equal(
    getRecurringDueDateInputForMonth({
      anchorDate: "2026-01-31",
      billingCycle: "monthly",
      targetMonth: "2026-02-01",
      startsOn: "2026-01-01T00:00:00.000Z",
    }),
    "2026-02-28",
  );
});

test("visible month clamps a monthly subscription on the 31st to february 29 in leap years", () => {
  assert.equal(
    getRecurringDueDateInputForMonth({
      anchorDate: "2024-01-31",
      billingCycle: "monthly",
      targetMonth: "2024-02-01",
      startsOn: "2024-01-01T00:00:00.000Z",
    }),
    "2024-02-29",
  );
});

test("visible month clamps a monthly subscription on the 30th to february 28", () => {
  assert.equal(
    getRecurringDueDateInputForMonth({
      anchorDate: "2026-01-30",
      billingCycle: "monthly",
      targetMonth: "2026-02-01",
      startsOn: "2026-01-01T00:00:00.000Z",
    }),
    "2026-02-28",
  );
});

test("visible month clamps a monthly subscription on the 29th to february 28 in non-leap years", () => {
  assert.equal(
    getRecurringDueDateInputForMonth({
      anchorDate: "2026-01-29",
      billingCycle: "monthly",
      targetMonth: "2026-02-01",
      startsOn: "2026-01-01T00:00:00.000Z",
    }),
    "2026-02-28",
  );
});

test("visible month clamps a quarterly subscription on the 31st to the last valid day", () => {
  assert.equal(
    getRecurringDueDateInputForMonth({
      anchorDate: "2026-01-31",
      billingCycle: "quarterly",
      targetMonth: "2026-04-01",
      startsOn: "2026-01-01T00:00:00.000Z",
    }),
    "2026-04-30",
  );
});

test("multiple subscriptions can resolve to the same calendar day", () => {
  const firstDueDate = getRecurringDueDateInputForMonth({
    anchorDate: "2026-01-31",
    billingCycle: "monthly",
    targetMonth: "2026-04-01",
    startsOn: "2026-01-01T00:00:00.000Z",
  });
  const secondDueDate = getRecurringDueDateInputForMonth({
    anchorDate: "2026-01-30",
    billingCycle: "monthly",
    targetMonth: "2026-04-01",
    startsOn: "2026-01-01T00:00:00.000Z",
  });

  assert.equal(firstDueDate, "2026-04-30");
  assert.equal(secondDueDate, "2026-04-30");
});

test("visible month does not project a due date before the first future anchor month", () => {
  assert.equal(
    getRecurringDueDateInputForMonth({
      anchorDate: "2026-05-04",
      billingCycle: "monthly",
      targetMonth: "2026-04-01",
      startsOn: "2026-04-04T00:00:00.000Z",
    }),
    null,
  );
});
