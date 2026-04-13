import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Form from "@/lib/models/Form";
import { verifyToken, canCreateForms } from "@/lib/utils/auth";
import { assignUniqueFormSlug } from "@/lib/forms/form-slug";
import { normalizePagesInput } from "@/lib/forms/form-pages";

/** Lean document shape from Form.findById().lean() */
type SourceFormLean = {
  title: string;
  description?: string;
  descriptionMarkdown?: boolean;
  createdBy: unknown;
  managers?: unknown[];
  fields?: unknown;
  pages?: unknown;
  theme?: string;
  headerImageUrl?: string | null;
};

async function verifyFormCreation(req: NextRequest) {
  const token = req.cookies.get("auth-token")?.value;
  if (!token) return null;
  const decoded = verifyToken(token);
  if (!decoded) return null;
  if (!decoded.isSuperAdmin && !canCreateForms(decoded)) return null;
  return decoded;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  try {
    const user = await verifyFormCreation(req);
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized. Form creation permission required." },
        { status: 401 }
      );
    }

    await dbConnect();
    const { formId } = await params;

    const source = await Form.findById(formId).lean<SourceFormLean | null>();
    if (!source) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    const createdBy = String(source.createdBy);
    const managerIds = (source.managers ?? []).map((id: unknown) =>
      String((id as { toString: () => string }).toString())
    );
    const canDuplicate =
      user.isSuperAdmin ||
      user.isAdmin ||
      createdBy === user.userId ||
      managerIds.includes(user.userId);

    if (!canDuplicate) {
      return NextResponse.json(
        { error: "You don't have permission to duplicate this form" },
        { status: 403 }
      );
    }

    const pages = normalizePagesInput(source.pages ?? []);
    const slug = await assignUniqueFormSlug("copy");

    const copy = new Form({
      title: `Copy of ${source.title}`,
      description: source.description,
      descriptionMarkdown: source.descriptionMarkdown ?? false,
      createdBy: user.userId,
      managers: [],
      fields: JSON.parse(JSON.stringify(source.fields ?? [])),
      pages: pages.map((p, i) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        order: i,
      })),
      theme: source.theme ?? "blue",
      headerImageUrl: source.headerImageUrl,
      responses: [],
      isActive: true,
      isShared: false,
      slug,
    });

    await copy.save();

    return NextResponse.json(
      {
        message: "Form duplicated",
        form: {
          id: copy._id,
          title: copy.title,
        },
      },
      { status: 201 }
    );
  } catch (e) {
    console.error("duplicate form:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
