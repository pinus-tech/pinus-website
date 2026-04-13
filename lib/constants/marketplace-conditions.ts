/** Item condition for marketplace listings (display + DB enum). */

export const MARKETPLACE_CONDITION_VALUES = [
  "Brand new",
  "Like new",
  "New",
  "Slightly used",
  "Well used",
  "Fair",
  "Other",
] as const;

export type MarketplaceCondition =
  (typeof MARKETPLACE_CONDITION_VALUES)[number];

export const MARKETPLACE_CONDITION_OPTIONS: ReadonlyArray<{
  value: MarketplaceCondition;
  label: string;
}> = [
  { value: "Brand new", label: "Brand new" },
  { value: "Like new", label: "Like new" },
  { value: "New", label: "New" },
  { value: "Slightly used", label: "Slightly used" },
  { value: "Well used", label: "Well used" },
  { value: "Fair", label: "Fair (visible wear)" },
  { value: "Other", label: "Other" },
];
