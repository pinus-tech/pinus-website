import { z } from "zod";
import { MARKETPLACE_CATEGORIES } from "@/lib/models/Item";
import { MAX_MARKETPLACE_IMAGES } from "@/lib/marketplace-images";
import { MARKETPLACE_CONDITION_VALUES } from "@/lib/constants/marketplace-conditions";

const conditionTuple = MARKETPLACE_CONDITION_VALUES as unknown as [
  string,
  ...string[],
];

export const createMarketplaceItemSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().max(5000).optional(),
  price: z.coerce.number().min(0),
  category: z.enum(MARKETPLACE_CATEGORIES).optional(),
  meetupLocation: z.string().max(200).optional(),
  condition: z.enum(conditionTuple).optional(),
  imageUrl: z.string().url().optional(),
  imageUrls: z
    .array(z.string().url())
    .max(MAX_MARKETPLACE_IMAGES)
    .optional(),
});

export type CreateMarketplaceItemInput = z.infer<
  typeof createMarketplaceItemSchema
>;
