import { Subscription } from "@/types/subscription";

const today = new Date();

const toDateString = (offsetDays: number) => {
  const date = new Date(today);
  date.setDate(date.getDate() + offsetDays);

  return date.toISOString().slice(0, 10);
};

const now = new Date().toISOString();

export const seedSubscriptions: Subscription[] = [
  {
    id: "seed-netflix",
    name: "Netflix",
    category: "Entertainment",
    amount: 13.99,
    billingCycle: "monthly",
    nextPaymentDate: toDateString(3),
    status: "active",
    notes: "Standard Plan",
    createdAt: now,
    updatedAt: now,
    archivedAt: null,
  },
  {
    id: "seed-spotify",
    name: "Spotify",
    category: "Music",
    amount: 10.99,
    billingCycle: "monthly",
    nextPaymentDate: toDateString(11),
    status: "active",
    createdAt: now,
    updatedAt: now,
    archivedAt: null,
  },
  {
    id: "seed-adobe",
    name: "Adobe Creative Cloud",
    category: "Productivity",
    amount: 719.88,
    billingCycle: "yearly",
    nextPaymentDate: toDateString(27),
    status: "active",
    notes: "Business renewal due next month",
    createdAt: now,
    updatedAt: now,
    archivedAt: null,
  },
  {
    id: "seed-gym",
    name: "Urban Sports Club",
    category: "Fitness",
    amount: 39.9,
    billingCycle: "monthly",
    nextPaymentDate: toDateString(18),
    status: "paused",
    createdAt: now,
    updatedAt: now,
    archivedAt: null,
  },
  {
    id: "seed-dropbox",
    name: "Dropbox",
    category: "Storage",
    amount: 119.88,
    billingCycle: "yearly",
    nextPaymentDate: toDateString(40),
    status: "cancelled",
    endDate: toDateString(75),
    createdAt: now,
    updatedAt: now,
    archivedAt: null,
  },
];
