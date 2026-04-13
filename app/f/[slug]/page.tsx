import { notFound, redirect } from "next/navigation";
import dbConnect from "@/lib/mongodb";
import Form from "@/lib/models/Form";
import { normalizeFormSlugInput } from "@/lib/forms/form-slug";

type PageProps = { params: Promise<{ slug: string }> };

/**
 * Short URL: /f/{slug} → canonical form page at /forms/{id}
 */
export default async function FormShortLinkPage({ params }: PageProps) {
  const { slug } = await params;
  if (!slug?.trim()) notFound();

  const key = normalizeFormSlugInput(slug) ?? slug.trim().toLowerCase();

  await dbConnect();
  const form = await Form.findOne({ slug: key })
    .select("_id")
    .lean<{ _id: unknown } | null>();

  if (!form?._id) notFound();

  redirect(`/forms/${String(form._id)}`);
}
