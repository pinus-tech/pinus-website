import type { FilterQuery } from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Item, {
  type IItem,
  MARKETPLACE_IMAGE_DISPLAY_MODES,
} from "@/lib/models/Item";
import { toMarketplaceSellerPayload } from "@/lib/marketplace-seller";
import {
  marketplaceImageApiFields,
  parseIncomingImageUrls,
} from "@/lib/marketplace-images";
import { MARKETPLACE_CONDITION_VALUES } from "@/lib/constants/marketplace-conditions";
import type { MarketplaceCondition } from "@/lib/constants/marketplace-conditions";
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
    const statusParam = searchParams.get("status");
    const seller = searchParams.get("seller");
    const conditionParam = searchParams.get("condition");
    const sortParam = searchParams.get("sort") ?? "newest";

    const query: FilterQuery<IItem> = {};

    if (seller) {
      query.seller = seller;
      if (
        statusParam === "available" ||
        statusParam === "reserved" ||
        statusParam === "sold"
      ) {
        query.status = statusParam;
      }
    } else {
      // Public browse: show active listings (not sold) unless narrowed.
      if (!statusParam || statusParam === "active") {
        query.status = { $in: ["available", "reserved"] };
      } else if (statusParam === "available" || statusParam === "reserved") {
        query.status = statusParam;
      } else {
        query.status = { $in: ["available", "reserved"] };
      }
    }

    if (category && category !== "all") {
      query.category = category;
    }

    if (
      conditionParam &&
      conditionParam !== "all" &&
      (MARKETPLACE_CONDITION_VALUES as readonly string[]).includes(
        conditionParam
      )
    ) {
      query.condition = conditionParam as MarketplaceCondition;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    let sort: Record<string, 1 | -1> = { createdAt: -1 };
    switch (sortParam) {
      case "price_asc":
        sort = { price: 1 };
        break;
      case "price_desc":
        sort = { price: -1 };
        break;
      case "oldest":
        sort = { createdAt: 1 };
        break;
      case "newest":
      default:
        sort = { createdAt: -1 };
    }

    const items = await Item.find(query)
      .populate("seller", "name telegram phoneNumber")
      .sort(sort);

    return NextResponse.json({
      items: items.map((item) => {
        const { imageUrls, imageUrl } = marketplaceImageApiFields(item);
        return {
          id: item._id,
          title: item.title,
          description: item.description,
          descriptionMarkdown: !!item.descriptionMarkdown,
          price: item.price,
          seller: toMarketplaceSellerPayload(item.seller),
          status: item.status,
          category: item.category,
          meetupLocation: item.meetupLocation,
          condition: item.condition,
          imageUrls,
          imageUrl,
          imageDisplayMode: item.imageDisplayMode ?? "collage",
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        };
      }),
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
    const {
      title,
      description,
      price,
      category,
      meetupLocation,
      descriptionMarkdown,
      condition,
      imageDisplayMode,
    } = body;

    const parsedImages = parseIncomingImageUrls({
      imageUrls: body.imageUrls,
      imageUrl: body.imageUrl,
    });
    if (!parsedImages.ok) {
      return NextResponse.json(
        { error: parsedImages.error },
        { status: 400 }
      );
    }

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

    let resolvedCondition: MarketplaceCondition = "Other";
    if (condition !== undefined && condition !== null) {
      if (
        typeof condition !== "string" ||
        !(MARKETPLACE_CONDITION_VALUES as readonly string[]).includes(condition)
      ) {
        return NextResponse.json(
          { error: "Invalid condition" },
          { status: 400 }
        );
      }
      resolvedCondition = condition as MarketplaceCondition;
    }

    let resolvedImageDisplayMode: "collage" | "carousel" = "collage";
    if (imageDisplayMode !== undefined && imageDisplayMode !== null) {
      if (
        typeof imageDisplayMode !== "string" ||
        !(MARKETPLACE_IMAGE_DISPLAY_MODES as readonly string[]).includes(
          imageDisplayMode
        )
      ) {
        return NextResponse.json(
          { error: "Invalid imageDisplayMode" },
          { status: 400 }
        );
      }
      resolvedImageDisplayMode = imageDisplayMode as "collage" | "carousel";
    }

    // Create new item
    const newItem = new Item({
      title,
      description,
      descriptionMarkdown: descriptionMarkdown === true,
      price,
      seller: user.userId,
      status: 'available',
      category: category || 'Other',
      meetupLocation,
      condition: resolvedCondition,
      imageDisplayMode: resolvedImageDisplayMode,
      imageUrls: parsedImages.imageUrls,
      imageUrl: parsedImages.imageUrl,
    });

    await newItem.save();

    // Populate seller information
    await newItem.populate('seller', 'name telegram phoneNumber');

    const { imageUrls, imageUrl } = marketplaceImageApiFields(newItem);

    return NextResponse.json({
      message: "Item created successfully",
      item: {
        id: newItem._id,
        title: newItem.title,
        description: newItem.description,
        descriptionMarkdown: !!newItem.descriptionMarkdown,
        price: newItem.price,
        seller: toMarketplaceSellerPayload(newItem.seller),
        status: newItem.status,
        category: newItem.category,
        meetupLocation: newItem.meetupLocation,
        condition: newItem.condition,
        imageUrls,
        imageUrl,
        imageDisplayMode: newItem.imageDisplayMode ?? "collage",
        createdAt: newItem.createdAt,
        updatedAt: newItem.updatedAt,
      },
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating marketplace item:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
