import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import ShortLink from "@/lib/models/ShortLink";
import { verifyToken } from "@/lib/utils/auth";
import { normalizeShortLinkSlug } from "@/lib/short-links/normalize-short-slug";
import { validateAndNormalizeTargetUrl } from "@/lib/short-links/validate-target-url";
import { suggestAvailableNumericSlugs } from "@/lib/short-links/suggest-available-slugs";
import mongoose from "mongoose";

async function verifyAdmin(req: NextRequest) {
  const token = req.cookies.get("auth-token")?.value;
  if (!token) return null;
  const decoded = verifyToken(token);
  if (!decoded || !decoded.isAdmin) return null;
  return decoded;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ linkId: string }> }
) {
  try {
    const admin = await verifyAdmin(req);
    if (!admin) {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 401 }
      );
    }

    const { linkId } = await params;
    if (!mongoose.Types.ObjectId.isValid(linkId)) {
      return NextResponse.json({ error: "Invalid link id" }, { status: 400 });
    }

    const body = (await req.json()) as {
      slug?: unknown;
      targetUrl?: unknown;
    };

    await dbConnect();

    const doc = await ShortLink.findById(linkId);
    if (!doc) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    if (body.slug !== undefined) {
      const slug = normalizeShortLinkSlug(body.slug);
      if (!slug) {
        return NextResponse.json(
          {
            error:
              "Invalid slug. Use 2–80 characters: letters, numbers, hyphens only.",
          },
          { status: 400 }
        );
      }
      if (slug !== doc.slug) {
        const taken = await ShortLink.findOne({
          slug,
          _id: { $ne: linkId },
        }).lean();
        if (taken) {
          const suggestedSlugs = await suggestAvailableNumericSlugs(slug, 5);
          return NextResponse.json(
            {
              error:
                "This slug is already in use. Try a suggestion or another slug.",
              suggestedSlugs,
            },
            { status: 409 }
          );
        }
        doc.slug = slug;
      }
    }

    if (body.targetUrl !== undefined) {
      const target = validateAndNormalizeTargetUrl(body.targetUrl);
      if (!target.ok) {
        return NextResponse.json({ error: target.error }, { status: 400 });
      }
      doc.targetUrl = target.url;
    }

    await doc.save();

    const populated = await ShortLink.findById(doc._id)
      .populate("createdBy", "name email")
      .lean<{
        createdBy?: { name?: string; email?: string } | null;
      } | null>();

    const by = populated?.createdBy;

    return NextResponse.json({
      link: {
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
      },
    });
  } catch (e) {
    console.error("PATCH /api/admin/short-links/[linkId]:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ linkId: string }> }
) {
  try {
    const admin = await verifyAdmin(req);
    if (!admin) {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 401 }
      );
    }

    const { linkId } = await params;
    if (!mongoose.Types.ObjectId.isValid(linkId)) {
      return NextResponse.json({ error: "Invalid link id" }, { status: 400 });
    }

    await dbConnect();

    const res = await ShortLink.findByIdAndDelete(linkId);
    if (!res) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Deleted" });
  } catch (e) {
    console.error("DELETE /api/admin/short-links/[linkId]:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
