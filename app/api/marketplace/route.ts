import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Item from "@/lib/models/Item";
import { toMarketplaceSellerPayload } from "@/lib/marketplace-seller";
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

// GET - Get all marketplace items (anyone can view, no login required)
export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const status = searchParams.get('status') || 'available';
    const seller = searchParams.get('seller');

    // Build query
    const query: { status: string; category?: string; $or?: Array<{ title: { $regex: string; $options: string } } | { description: { $regex: string; $options: string } }>; price?: { $gte?: number; $lte?: number }; seller?: string } = { status };

    if (category && category !== 'all') {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Filter by seller if provided
    if (seller) {
      query.seller = seller;
    }

    // Get items with seller information
    const items = await Item.find(query)
      .populate('seller', 'name telegram phoneNumber')
      .sort({ createdAt: -1 });

    return NextResponse.json({
      items: items.map(item => ({
        id: item._id,
        title: item.title,
        description: item.description,
        price: item.price,
        seller: toMarketplaceSellerPayload(item.seller),
        status: item.status,
        category: item.category,
        meetupLocation: item.meetupLocation,
        imageUrl: item.imageUrl,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      })),
      totalItems: items.length
    });
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

    const body = await req.json();
    const { title, description, price, category, meetupLocation, imageUrl } = body;

    // Validate required fields
    if (!title || price === undefined) {
      return NextResponse.json(
        { error: "Title and price are required" },
        { status: 400 }
      );
    }

    // Validate price
    if (typeof price !== 'number' || price < 0) {
      return NextResponse.json(
        { error: "Price must be a non-negative number" },
        { status: 400 }
      );
    }

    // Validate category if provided
    if (category) {
      const validCategories = [
        "Electronics", "Books & Academic", "Furniture & Home", "Clothing & Fashion",
        "Sports & Recreation", "Beauty & Personal Care", "Transportation", "Musical Instruments",
        "Art & Crafts", "Food & Beverages", "Health & Wellness", "Baby & Kids",
        "Pets & Animals", "Garden & Outdoor", "Office & Business", "Free Items", "Other"
      ];
      
      if (!validCategories.includes(category)) {
        return NextResponse.json(
          { error: "Invalid category" },
          { status: 400 }
        );
      }
    }

    // Create new item
    const newItem = new Item({
      title,
      description,
      price,
      seller: user.userId,
      status: 'available',
      category: category || 'Other',
      meetupLocation,
      imageUrl
    });

    await newItem.save();

    // Populate seller information
    await newItem.populate('seller', 'name telegram phoneNumber');

    return NextResponse.json({
      message: "Item created successfully",
      item: {
        id: newItem._id,
        title: newItem.title,
        description: newItem.description,
        price: newItem.price,
        seller: toMarketplaceSellerPayload(newItem.seller),
        status: newItem.status,
        category: newItem.category,
        meetupLocation: newItem.meetupLocation,
        imageUrl: newItem.imageUrl,
        createdAt: newItem.createdAt,
        updatedAt: newItem.updatedAt
      }
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating marketplace item:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
