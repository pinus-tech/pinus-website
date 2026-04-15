import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import ShortLink from "@/lib/models/ShortLink";
import { verifyToken } from "@/lib/utils/auth";
import { normalizeShortLinkSlug } from "@/lib/short-links/normalize-short-slug";
import { suggestAvailableNumericSlugs } from "@/lib/short-links/suggest-available-slugs";
import { validateAndNormalizeTargetUrl } from "@/lib/short-links/validate-target-url";

async function verifyAdmin(req: NextRequest) {
  const token = req.cookies.get("auth-token")?.value;
  if (!token) return null;
  const decoded = verifyToken(token);
  if (!decoded || !decoded.isAdmin) return null;
  return decoded;
}

export async function GET(req: NextRequest) {
  try {
    const admin = await verifyAdmin(req);
    if (!admin) {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 401 }
      );
    }

    await dbConnect();

    const links = await ShortLink.find({})
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 })
      .lean<
        Array<{
          _id: { toString(): string };
          slug: string;
          targetUrl: string;
          createdAt: Date;
          updatedAt: Date;
          createdBy?: { name?: string; email?: string } | null;
        }>
      >();

    return NextResponse.json({
      links: links.map((doc) => {
        const by = doc.createdBy;
        return {
          id: doc._id.toString(),
          slug: doc.slug,
          targetUrl: doc.targetUrl,
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt,
          createdBy:
            by && typeof by === "object"
              ? {
                  name: by.name ?? "Unknown",
                  email: by.email ?? "",
                }
              : null,
        };
      }),
    });
  } catch (e) {
    console.error("GET /api/admin/short-links:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  /** Set before create, for duplicate-key race handling in catch. */
  let slugForRaceConflict: string | null = null;
  try {
    const admin = await verifyAdmin(req);
    if (!admin) {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 401 }
      );
    }

    const body = (await req.json()) as {
      slug?: unknown;
      targetUrl?: unknown;
    };

    const slug = normalizeShortLinkSlug(body.slug);
    if (!slug) {
      return NextResponse.json(
        {
          error:
            "Invalid slug. Use 2–80 characters: letters, numbers, hyphens only. Some names are reserved.",
        },
        { status: 400 }
      );
    }

    const target = validateAndNormalizeTargetUrl(body.targetUrl);
    if (!target.ok) {
      return NextResponse.json({ error: target.error }, { status: 400 });
    }

    await dbConnect();

    const duplicate = await ShortLink.exists({ slug });
    if (duplicate) {
      const suggestedSlugs = await suggestAvailableNumericSlugs(slug, 5);
      return NextResponse.json(
        {
          error:
            "This slug is already in use. Choose another one - try a suggestion below or type your own slug.",
          suggestedSlugs,
        },
        { status: 409 }
      );
    }

    slugForRaceConflict = slug;

    const created = await ShortLink.create({
      slug,
      targetUrl: target.url,
      createdBy: admin.userId,
    });

    const populated = await ShortLink.findById(created._id)
      .populate("createdBy", "name email")
      .lean<{
        createdBy?: { name?: string; email?: string } | null;
      } | null>();

    const by = populated?.createdBy;

    return NextResponse.json(
      {
        link: {
          id: String(created._id),
          slug: created.slug,
          targetUrl: created.targetUrl,
          createdAt: created.createdAt,
          updatedAt: created.updatedAt,
          createdBy:
            by && typeof by === "object"
              ? {
                  name: by.name ?? "Unknown",
                  email: by.email ?? "",
                }
              : null,
        },
      },
      { status: 201 }
    );
  } catch (e: unknown) {
    if (
      e &&
      typeof e === "object" &&
      "code" in e &&
      (e as { code?: number }).code === 11000
    ) {
      let suggestedSlugs: string[] = [];
      if (slugForRaceConflict) {
        await dbConnect();
        suggestedSlugs = await suggestAvailableNumericSlugs(
          slugForRaceConflict,
          5
        );
      }
      return NextResponse.json(
        {
          error:
            "This slug was just taken by someone else. Try a suggestion below or another slug.",
          suggestedSlugs,
        },
        { status: 409 }
      );
    }
    console.error("POST /api/admin/short-links:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
