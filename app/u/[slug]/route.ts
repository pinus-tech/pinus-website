import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import ShortLink from "@/lib/models/ShortLink";
import { normalizeShortLinkSlug } from "@/lib/short-links/normalize-short-slug";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug: raw } = await params;
    const slug = normalizeShortLinkSlug(decodeURIComponent(raw));
    if (!slug) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await dbConnect();

    const doc = await ShortLink.findOne({ slug })
      .select("targetUrl")
      .lean<{ targetUrl: string } | null>();

    if (!doc?.targetUrl) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    try {
      const u = new URL(doc.targetUrl);
      if (u.protocol !== "http:" && u.protocol !== "https:") {
        return NextResponse.json({ error: "Invalid link" }, { status: 500 });
      }
    } catch {
      return NextResponse.json({ error: "Invalid link" }, { status: 500 });
    }

    return NextResponse.redirect(doc.targetUrl, 302);
  } catch (e) {
    console.error("GET /u/[slug]:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
