import { v } from "convex/values";

export const CATEGORIES = [
  { value: "power-tools", label: "Power tools" },
  { value: "hand-tools", label: "Hand tools" },
  { value: "garden", label: "Garden" },
  { value: "kitchen", label: "Kitchen" },
  { value: "camping", label: "Camping" },
  { value: "cleaning", label: "Cleaning" },
  { value: "other", label: "Other" },
] as const;

export const CONDITIONS = [
  { value: "new", label: "Like new" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "worn", label: "Well used" },
] as const;

export type Category = (typeof CATEGORIES)[number]["value"];
export type Condition = (typeof CONDITIONS)[number]["value"];

export const category = v.union(
  v.literal("power-tools"),
  v.literal("hand-tools"),
  v.literal("garden"),
  v.literal("kitchen"),
  v.literal("camping"),
  v.literal("cleaning"),
  v.literal("other"),
);

export const condition = v.union(
  v.literal("new"),
  v.literal("good"),
  v.literal("fair"),
  v.literal("worn"),
);

export const loanStatus = v.union(
  v.literal("requested"),
  v.literal("approved"),
  v.literal("declined"),
  v.literal("cancelled"),
  v.literal("returned"),
);

export const notificationType = v.union(
  v.literal("request_created"),
  v.literal("request_approved"),
  v.literal("request_declined"),
  v.literal("request_cancelled"),
  v.literal("loan_returned"),
);

export const MAX_LOAN_DAYS = 30;
export const MAX_ADVANCE_DAYS = 90;

export const LIMITS = {
  name: 80,
  description: 500,
  photoBytes: 5 * 1024 * 1024,
};

export const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
