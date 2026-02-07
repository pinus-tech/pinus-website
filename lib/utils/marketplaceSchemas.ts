import { z } from "zod";
import { MARKETPLACE_CATEGORIES } from "@/lib/models/Item";
export const createMarketplaceItemSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().max(5000).optional(),
  price: z.coerce.number().min(0),
  category: z.enum(MARKETPLACE_CATEGORIES).optional(),
  meetupLocation: z.string().max(200).optional(),
  imageUrl: z.string().url().optional(),
});

export type CreateMarketplaceItemInput = z.infer<
  typeof createMarketplaceItemSchema
>;
