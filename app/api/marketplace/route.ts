import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Item from "@/lib/models/Item";
import { verifyToken } from "@/lib/utils/auth";

export const runtime = 'edge';

// Middleware to check if user is logged in
async function verifyLoggedInUser(req: NextRequest) {
  const token = req.cookies.get("auth-token")?.value;

  if (!token) {
    return null;
  }

  const decoded = verifyToken(token);
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

    // TODO: Implement item creation logic
    // - Validate item data (title, price, description, category)
    // - Handle multiple image uploads with compression
    // - Validate price is positive number or allow free items
    // - Set default category if not provided
    // - Add location/pickup details
    // - Create item document with seller information
    // - Return created item information

    return NextResponse.json(
      {
        message: "TODO: Marketplace item creation not yet implemented",
        error: "Feature under development",
      },
      { status: 501 }
    );
  } catch (error) {
    console.error("Error creating marketplace item:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
