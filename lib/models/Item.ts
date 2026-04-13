import mongoose from "mongoose";
import { MARKETPLACE_CONDITION_VALUES } from "@/lib/constants/marketplace-conditions";
import type { MarketplaceCondition } from "@/lib/constants/marketplace-conditions";

// Marketplace categories
export const MARKETPLACE_CATEGORIES = [
  "Electronics",
  "Books & Academic", 
  "Furniture & Home",
  "Clothing & Fashion",
  "Sports & Recreation",
  "Beauty & Personal Care",
  "Transportation",
  "Musical Instruments",
  "Art & Crafts",
  "Food & Beverages",
  "Health & Wellness",
  "Baby & Kids",
  "Pets & Animals",
  "Garden & Outdoor",
  "Office & Business",
  "Free Items",
  "Other"
] as const;

export type MarketplaceCategory = typeof MARKETPLACE_CATEGORIES[number];

export interface IItem extends mongoose.Document {
  title: string;
  description?: string;
  /** When true, `description` is rendered as Markdown instead of plain text. */
  descriptionMarkdown?: boolean;
  price: number;
  seller: mongoose.Types.ObjectId;
  status: "available" | "reserved" | "sold";
  soldAt?: Date;
  /** Physical / wear condition of the item. */
  condition?: MarketplaceCondition;
  /** @deprecated Use imageUrls; kept for legacy documents. */
  imageUrl?: string;
  /** Up to 5 Firebase download URLs. */
  imageUrls?: string[];
  category?: MarketplaceCategory;
  meetupLocation?: string;
  createdAt: Date;
  updatedAt: Date;
}

const itemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    descriptionMarkdown: { type: Boolean, default: false },
    price: { type: Number, required: true },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["available", "reserved", "sold"],
      default: "available",
    },
    meetupLocation: { type: String },
    soldAt: { type: Date },
    imageUrl: { type: String },
    imageUrls: [{ type: String }],
    category: { 
      type: String, 
      enum: MARKETPLACE_CATEGORIES,
      default: "Other"
    },
    condition: {
      type: String,
      enum: [...MARKETPLACE_CONDITION_VALUES],
      default: "Other",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Item ||
  mongoose.model<IItem>("Item", itemSchema);
