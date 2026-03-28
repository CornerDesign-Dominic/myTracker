import test from "node:test";
import assert from "node:assert/strict";

import { shiftRecurringDateInput } from "../../src/utils/recurringDates.ts";

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
