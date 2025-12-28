import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Item from "@/lib/models/Item";
import { verifyToken } from "@/lib/utils/auth";
import { createMarketplaceItemSchema } from "@/lib/utils/marketplaceSchemas";
import mongoose from "mongoose";


// Middleware to check if user is logged in
async function verifyLoggedInUser(req: NextRequest) {
  const token = req.cookies.get("auth-token")?.value;
  if (!token) return null;

  const decoded = verifyToken(token);
  if (!decoded) return null;

  return decoded;
}


// GET - Get all marketplace items (anyone can view, no login required)
export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    // TODO: Implement marketplace item listing logic
    // - Fetch all available items with seller information
    // - Add filtering by category, price range, location
    // - Add search functionality (title, description, tags)
    // - Add pagination for large datasets
    // - Sort by date, price, popularity, distance
    // - Include item images and thumbnails

    // Placeholder response - remove when implementing
    return NextResponse.json(
      {
        items: [],
        message: "TODO: Implement marketplace item listing system",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching marketplace items:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create new marketplace item (requires login)
// TODO: Implement item creation logic
    // - Validate item data (title, price, description, category, meetupLocation)
    // - Handle multiple image uploads with compression
    // - Validate price is positive number or allow free items (price = 0)
    // - Set default category if not provided
    // - Add location/pickup details (meetupLocation field)
    // - Create item document with seller information
    // - Return created item information
export async function POST(req: NextRequest) {
  try {
    const user = await verifyLoggedInUser(req);
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required to post items" },
        { status: 401 }
      );
    }

    await dbConnect();
    const body = await req.json();
    //zod validations
    const parsed = createMarketplaceItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { title, description, price, category, meetupLocation, imageUrl } =
      parsed.data;

    //set default categ.
    const finalCategory = category ?? "Other";
    //get sellerid
    const sellerId = user.userId;
if (!sellerId || !mongoose.Types.ObjectId.isValid(sellerId)) {
  return NextResponse.json(
    { error: "Invalid auth token: invalid user id" },
    { status: 401 }
  );
}

    //make item in mongodb
    const created = await Item.create({
      title,
      description,
      price,
      category: finalCategory,
      meetupLocation,
      imageUrl,
      seller: sellerId,
      status: "available",
    });
    //return minim informa.
    return NextResponse.json(
      {
        message: "Marketplace item created",
        item: {
          id: created._id,
          title: created.title,
          price: created.price,
          category: created.category,
          status: created.status,
          meetupLocation: created.meetupLocation,
          imageUrl: created.imageUrl,
          createdAt: created.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating marketplace item:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

