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

    // Prepare seller information based on login status
    let sellerInfo;
    if (isLoggedIn) {
      // Show full contact information for logged-in users
      sellerInfo = {
        name: item.seller.name,
        telegram: item.seller.telegram,
        phoneNumber: item.seller.phoneNumber
      };
    } else {
      // Only show name for non-logged-in users
      sellerInfo = {
        name: item.seller.name
      };
    }

    return NextResponse.json({
      item: {
        id: item._id,
        title: item.title,
        description: item.description,
        price: item.price,
        seller: sellerInfo,
        status: item.status,
        category: item.category,
        meetupLocation: item.meetupLocation,
        imageUrl: item.imageUrl,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      },
      isLoggedIn
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
    const body = await req.json();

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
      
      if (!validCategories.includes(body.category)) {
        return NextResponse.json(
          { error: "Invalid category" },
          { status: 400 }
        );
      }
    }

    // Update item
    const updatedItem = await Item.findByIdAndUpdate(
      itemId,
      { ...body },
      { new: true }
    ).populate('seller', 'name telegram phoneNumber');

    return NextResponse.json({
      message: "Item updated successfully",
      item: {
        id: updatedItem._id,
        title: updatedItem.title,
        description: updatedItem.description,
        price: updatedItem.price,
        seller: updatedItem.seller,
        status: updatedItem.status,
        category: updatedItem.category,
        meetupLocation: updatedItem.meetupLocation,
        imageUrl: updatedItem.imageUrl,
        createdAt: updatedItem.createdAt,
        updatedAt: updatedItem.updatedAt
      }
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
