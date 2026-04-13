import mongoose from "mongoose";

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
  status: "available" | "sold";
  soldAt?: Date;
  imageUrl?: string;
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
      enum: ["available", "sold"],
      default: "available",
    },
    meetupLocation: { type: String },
    soldAt: { type: Date },
    imageUrl: { type: String },
    category: { 
      type: String, 
      enum: MARKETPLACE_CATEGORIES,
      default: "Other"
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Item ||
  mongoose.model<IItem>("Item", itemSchema);
