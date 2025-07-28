import mongoose from "mongoose";

export interface IItem extends mongoose.Document {
  title: string;
  description?: string;
  price: number;
  seller: mongoose.Types.ObjectId;
  status: "available" | "sold";
  soldAt?: Date;
  imageUrl?: string;
  category?: string;
  createdAt: Date;
  updatedAt: Date;
}

const itemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
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
    category: { type: String },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Item ||
  mongoose.model<IItem>("Item", itemSchema);
