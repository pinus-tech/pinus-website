import mongoose from "mongoose";

export interface IShortLink extends mongoose.Document {
  slug: string;
  targetUrl: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const shortLinkSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: 80,
    },
    targetUrl: { type: String, required: true, trim: true, maxlength: 2048 },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.ShortLink ||
  mongoose.model<IShortLink>("ShortLink", shortLinkSchema);
