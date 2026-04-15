import { notFound } from "next/navigation";
import type { Metadata } from "next";
import dbConnect from "@/lib/mongodb";
import ShortLink from "@/lib/models/ShortLink";
import { normalizeShortLinkSlug } from "@/lib/short-links/normalize-short-slug";
import ShortLinkInterstitial from "./ShortLinkInterstitial";

export const metadata: Metadata = {
  title: "Redirect | PINUS",
  robots: { index: false, follow: false },
};

export default async function ShortLinkRedirectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug: raw } = await params;
  const slug = normalizeShortLinkSlug(decodeURIComponent(raw));
  if (!slug) {
    notFound();
  }

  await dbConnect();

  const doc = await ShortLink.findOne({ slug })
    .select("targetUrl")
    .lean<{ targetUrl: string } | null>();

  if (!doc?.targetUrl) {
    notFound();
  }

  try {
    const u = new URL(doc.targetUrl);
    if (u.protocol !== "http:" && u.protocol !== "https:") {
      notFound();
    }
  } catch {
    notFound();
  }

  return <ShortLinkInterstitial targetUrl={doc.targetUrl} />;
}
