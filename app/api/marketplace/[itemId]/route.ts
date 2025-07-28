import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Item from "@/lib/models/Item";
import { verifyToken } from "@/lib/utils/auth";

// Middleware to check if user is logged in
async function verifyLoggedInUser(req: NextRequest) {
  const token = req.cookies.get("auth-token")?.value;

  if (!token) {
    return null;
  }

  const decoded = verifyToken(token);
  return decoded;
}

// GET - Get specific item details (anyone can view)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    await dbConnect();

    const { itemId } = await params;

    // TODO: Implement individual item fetching logic
    // - Find item by ID with full details
    // - Populate seller information (contact details)
    // - Include all item images and descriptions
    // - Track view count and analytics
    // - Show similar/related items
    // - Include seller rating/reviews
    // - Add item to recently viewed

    return NextResponse.json(
      {
        message: "TODO: Individual item viewing not yet implemented",
        error: "Feature under development",
      },
      { status: 501 }
    );
  } catch (error) {
    console.error("Error fetching item:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH - Update item (only item seller or super admin)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const user = await verifyLoggedInUser(req);
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    await dbConnect();

    const { itemId } = await params;

    // TODO: Implement item update logic
    // - Find item by ID
    // - Check if user can edit this item (seller or super admin)
    // - Validate updated fields (title, price, description, images)
    // - Handle image updates (add/remove/reorder)
    // - Update item document with change history
    // - Handle status changes (mark as sold, reserved, available)
    // - Return updated item information

    return NextResponse.json(
      {
        message: "TODO: Item editing not yet implemented",
        error: "Feature under development",
      },
      { status: 501 }
    );
  } catch (error) {
    console.error("Error updating item:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete item (only item seller or super admin)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const user = await verifyLoggedInUser(req);
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    await dbConnect();

    const { itemId } = await params;

    // TODO: Implement item deletion logic
    // - Find item by ID
    // - Check if user can delete this item (seller or super admin only)
    // - Handle image cleanup (delete from storage)
    // - Clean up related data (views, messages, etc.)

    return NextResponse.json(
      {
        message: "TODO: Item deletion not yet implemented",
        error: "Feature under development",
      },
      { status: 501 }
    );
  } catch (error) {
    console.error("Error deleting item:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
