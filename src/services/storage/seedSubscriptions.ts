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
    price: 13.99,
    currency: "EUR",
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
    price: 10.99,
    currency: "EUR",
    billingCycle: "monthly",
    nextPaymentDate: toDateString(11),
    cancellationDeadline: toDateString(6),
    status: "active",
    createdAt: now,
    updatedAt: now,
    archivedAt: null,
  },
  {
    id: "seed-adobe",
    name: "Adobe Creative Cloud",
    category: "Productivity",
    price: 719.88,
    currency: "EUR",
    billingCycle: "yearly",
    nextPaymentDate: toDateString(27),
    cancellationDeadline: toDateString(14),
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
    price: 39.9,
    currency: "EUR",
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
    price: 119.88,
    currency: "EUR",
    billingCycle: "yearly",
    nextPaymentDate: toDateString(40),
    status: "cancelled",
    endDate: toDateString(75),
    createdAt: now,
    updatedAt: now,
    archivedAt: null,
  },
];
