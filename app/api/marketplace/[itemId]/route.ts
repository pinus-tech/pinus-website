import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Item from "@/lib/models/Item";
import { toMarketplaceSellerPayload } from "@/lib/marketplace-seller";
import {
  marketplaceImageApiFields,
  parseIncomingImageUrls,
} from "@/lib/marketplace-images";
import { verifyToken } from "@/lib/utils/auth";
import { MARKETPLACE_CONDITION_VALUES } from "@/lib/constants/marketplace-conditions";

// Middleware to check if user is logged in
async function verifyLoggedInUser(req: NextRequest) {
  const token = req.cookies.get("auth-token")?.value;

  if (!token) {
    return null;
  }

  const decoded = verifyToken(token);
  return decoded;
}

// GET - Get specific item details (anyone can view, but contact info only for logged-in users)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    await dbConnect();

    const { itemId } = await params;

    // Check if user is logged in for contact information
    const user = await verifyLoggedInUser(req);
    const isLoggedIn = !!user;

    // Find item by ID
    const item = await Item.findById(itemId).populate('seller', 'name telegram phoneNumber');
    
    if (!item) {
      return NextResponse.json(
        { error: "Item not found" },
        { status: 404 }
      );
    }

    const sellerBase = toMarketplaceSellerPayload(item.seller);
    let sellerInfo: {
      name: string;
      telegram?: string;
      phoneNumber?: string;
    };
    if (isLoggedIn) {
      sellerInfo = sellerBase;
    } else {
      sellerInfo = { name: sellerBase.name };
    }

    const { imageUrls, imageUrl } = marketplaceImageApiFields(item);

    return NextResponse.json({
      item: {
        id: item._id,
        title: item.title,
        description: item.description,
        descriptionMarkdown: !!item.descriptionMarkdown,
        price: item.price,
        seller: sellerInfo,
        status: item.status,
        category: item.category,
        meetupLocation: item.meetupLocation,
        condition: item.condition,
        imageUrls,
        imageUrl,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      },
      isLoggedIn,
    });
  } catch (error) {
    console.error("Error fetching item:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH - Update item (only item seller, admin, or super admin)
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
    const body = await req.json() as Record<string, unknown>;

    // Find item by ID
    const item = await Item.findById(itemId);
    
    if (!item) {
      return NextResponse.json(
        { error: "Item not found" },
        { status: 404 }
      );
    }

    // Check if user can edit this item
    const canEdit = user.isSuperAdmin || 
                   user.isAdmin || 
                   item.seller.toString() === user.userId;

    if (!canEdit) {
      return NextResponse.json(
        { error: "You don't have permission to edit this item" },
        { status: 403 }
      );
    }

    // Validate price if being updated
    if (body.price !== undefined) {
      if (typeof body.price !== 'number' || body.price < 0) {
        return NextResponse.json(
          { error: "Price must be a non-negative number" },
          { status: 400 }
        );
      }
    }

    // Validate category if being updated
    if (body.category) {
      const validCategories = [
        "Electronics", "Books & Academic", "Furniture & Home", "Clothing & Fashion",
        "Sports & Recreation", "Beauty & Personal Care", "Transportation", "Musical Instruments",
        "Art & Crafts", "Food & Beverages", "Health & Wellness", "Baby & Kids",
        "Pets & Animals", "Garden & Outdoor", "Office & Business", "Free Items", "Other"
      ];
      const cat = body.category;
      if (typeof cat !== "string" || !validCategories.includes(cat)) {
        return NextResponse.json(
          { error: "Invalid category" },
          { status: 400 }
        );
      }
    }

    if (body.status !== undefined) {
      const allowedStatus = ["available", "reserved", "sold"];
      if (
        typeof body.status !== "string" ||
        !allowedStatus.includes(body.status)
      ) {
        return NextResponse.json(
          { error: "Invalid status" },
          { status: 400 }
        );
      }
    }

    if (body.condition !== undefined) {
      const c = body.condition;
      if (
        typeof c !== "string" ||
        !(MARKETPLACE_CONDITION_VALUES as readonly string[]).includes(c)
      ) {
        return NextResponse.json(
          { error: "Invalid condition" },
          { status: 400 }
        );
      }
    }

    const updatePayload: Record<string, unknown> = { ...body };
    delete updatePayload.imageUrls;
    delete updatePayload.imageUrl;

    if (
      Object.prototype.hasOwnProperty.call(body, "imageUrls") ||
      Object.prototype.hasOwnProperty.call(body, "imageUrl")
    ) {
      const parsed = parseIncomingImageUrls({
        imageUrls: body.imageUrls,
        imageUrl: body.imageUrl,
      });
      if (!parsed.ok) {
        return NextResponse.json({ error: parsed.error }, { status: 400 });
      }
      updatePayload.imageUrls = parsed.imageUrls;
      updatePayload.imageUrl = parsed.imageUrl;
    }

    if (typeof body.status === "string") {
      updatePayload.soldAt = body.status === "sold" ? new Date() : null;
    }

    // Update item
    const updatedItem = await Item.findByIdAndUpdate(
      itemId,
      updatePayload,
      { new: true }
    ).populate('seller', 'name telegram phoneNumber');

    if (!updatedItem) {
      return NextResponse.json(
        { error: "Item not found" },
        { status: 404 }
      );
    }

    const { imageUrls, imageUrl } = marketplaceImageApiFields(updatedItem);

    return NextResponse.json({
      message: "Item updated successfully",
      item: {
        id: updatedItem._id,
        title: updatedItem.title,
        description: updatedItem.description,
        descriptionMarkdown: !!updatedItem.descriptionMarkdown,
        price: updatedItem.price,
        seller: toMarketplaceSellerPayload(updatedItem.seller),
        status: updatedItem.status,
        category: updatedItem.category,
        meetupLocation: updatedItem.meetupLocation,
        condition: updatedItem.condition,
        imageUrls,
        imageUrl,
        createdAt: updatedItem.createdAt,
        updatedAt: updatedItem.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error updating item:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete item (only item seller, admin, or super admin)
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

    // Find item by ID
    const item = await Item.findById(itemId);
    
    if (!item) {
      return NextResponse.json(
        { error: "Item not found" },
        { status: 404 }
      );
    }

    // Check if user can delete this item
    const canDelete = user.isSuperAdmin || 
                     user.isAdmin || 
                     item.seller.toString() === user.userId;

    if (!canDelete) {
      return NextResponse.json(
        { error: "You don't have permission to delete this item" },
        { status: 403 }
      );
    }

    // Delete item
    await Item.findByIdAndDelete(itemId);

    return NextResponse.json({
      message: "Item deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting item:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
