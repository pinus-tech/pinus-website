import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Form from "@/lib/models/Form";
import Response from "@/lib/models/Response";
import User from "@/lib/models/User";
import { serializeFormUser } from "@/lib/serialize-form-users";
import { validateFormFieldsArray } from "@/lib/forms/validate-form-fields";
import {
  assignUniqueFormSlug,
  normalizeFormSlugInput,
} from "@/lib/forms/form-slug";
import { verifyToken, canCreateForms } from "@/lib/utils/auth";

// Middleware to check form creation permission
async function verifyFormCreationPermission(req: NextRequest) {
  const token = req.cookies.get("auth-token")?.value;

  if (!token) {
    return null;
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return null;
  }

  // Check if user has permission to create forms or is super admin
  if (!decoded.isSuperAdmin && !canCreateForms(decoded)) {
    return null;
  }

  return decoded;
}

// Middleware to check if user is logged in (for viewing forms)
async function verifyLoggedInUser(req: NextRequest) {
  const token = req.cookies.get("auth-token")?.value;

  if (!token) {
    return null;
  }

  const decoded = verifyToken(token);
  return decoded;
}

// GET - Get all forms (logged in users can view)
export async function GET(req: NextRequest) {
  try {
    const user = await verifyLoggedInUser(req);
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required to view forms" },
        { status: 401 }
      );
    }

    await dbConnect();

    const isSiteAdmin = user.isSuperAdmin || user.isAdmin;
    const canCreateFormsPerm = user.permissions?.canCreateForms === true;

    let forms;
    if (isSiteAdmin) {
      forms = await Form.find({ isActive: true })
        .populate("createdBy", "name email")
        .populate("managers", "name email")
        .sort({ createdAt: -1 });
    } else if (canCreateFormsPerm) {
      forms = await Form.find({
        isActive: true,
        $or: [
          { createdBy: user.userId },
          { managers: user.userId },
        ],
      })
        .populate("createdBy", "name email")
        .populate("managers", "name email")
        .sort({ createdAt: -1 });
    } else {
      const respondedIds = await Response.distinct("formId", {
        respondent: user.userId,
      });
      forms = await Form.find({
        _id: { $in: respondedIds },
        isActive: true,
      })
        .populate("createdBy", "name email")
        .populate("managers", "name email")
        .sort({ createdAt: -1 });
    }

    return NextResponse.json({
      forms: await Promise.all(
        forms.map(async (form) => {
          const createdBy = serializeFormUser(form.createdBy);
          const managers = (form.managers ?? []).map((m: unknown) =>
            serializeFormUser(m)
          );
          const canEdit =
            user.isSuperAdmin ||
            user.isAdmin ||
            createdBy._id === user.userId ||
            managers.some(
              (manager: { _id: string }) => manager._id === user.userId
            );

          const canViewResponses =
            user.isSuperAdmin ||
            user.isAdmin ||
            createdBy._id === user.userId ||
            managers.some(
              (manager: { _id: string }) => manager._id === user.userId
            );

          const isStaff =
            user.isSuperAdmin ||
            user.isAdmin ||
            createdBy._id === user.userId ||
            managers.some(
              (manager: { _id: string }) => manager._id === user.userId
            );

          const hasSubmitted = !!(await Response.exists({
            formId: form._id,
            respondent: user.userId,
          }));

          const shared = form.isShared ?? true;
          const canFill =
            form.isActive &&
            !hasSubmitted &&
            (shared || isStaff);

          return {
            id: form._id,
            title: form.title,
            description: form.description,
            descriptionMarkdown: !!form.descriptionMarkdown,
            createdBy,
            managers,
            fields: form.fields,
            responses: form.responses,
            isActive: form.isActive,
            isShared: shared,
            createdAt: form.createdAt,
            updatedAt: form.updatedAt,
            responseCount: form.responses.length,
            slug: form.slug ?? null,
            userHasSubmitted: hasSubmitted,
            userPermissions: {
              canEdit,
              canViewResponses,
              canFill,
            },
          };
        })
      ),
    });
  } catch (error) {
    console.error("Error fetching forms:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create new form (requires form creation permission)
export async function POST(req: NextRequest) {
  try {
    const user = await verifyFormCreationPermission(req);
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized. Form creation permission required." },
        { status: 401 }
      );
    }

    await dbConnect();

    const body = await req.json();
    const { title, description, fields, managers, shortLink, descriptionMarkdown } =
      body;

    // Validate required fields
    if (!title || !fields || !Array.isArray(fields)) {
      return NextResponse.json(
        { error: "Title and fields are required" },
        { status: 400 }
      );
    }

    const fieldsError = validateFormFieldsArray(fields);
    if (fieldsError) {
      return NextResponse.json({ error: fieldsError }, { status: 400 });
    }

    let resolvedSlug: string | undefined;
    if (shortLink !== undefined && shortLink !== null && shortLink !== "") {
      const normalized = normalizeFormSlugInput(shortLink);
      if (!normalized) {
        return NextResponse.json(
          {
            error:
              "Short link must be 2–80 characters: letters, numbers, and hyphens only (e.g. form1).",
          },
          { status: 400 }
        );
      }
      resolvedSlug = await assignUniqueFormSlug(normalized);
    }

    // Validate managers if provided
    if (managers && Array.isArray(managers)) {
      for (const managerId of managers) {
        const manager = await User.findById(managerId);
        if (!manager) {
          return NextResponse.json(
            { error: `Manager with ID ${managerId} not found` },
            { status: 400 }
          );
        }
        if (!manager.isApproved) {
          return NextResponse.json(
            { error: `Manager ${manager.name} is not approved` },
            { status: 400 }
          );
        }
      }
    }

    // Create new form
    const newForm = new Form({
      title,
      description,
      descriptionMarkdown: descriptionMarkdown === true,
      createdBy: user.userId,
      managers: managers || [],
      fields,
      responses: [],
      isActive: true,
      isShared: false,
      ...(resolvedSlug ? { slug: resolvedSlug } : {}),
    });

    await newForm.save();

    // Populate creator and managers information
    await newForm.populate('createdBy', 'name email');
    await newForm.populate('managers', 'name email');

    return NextResponse.json({
      message: "Form created successfully",
      form: {
        id: newForm._id,
        title: newForm.title,
        description: newForm.description,
        descriptionMarkdown: !!newForm.descriptionMarkdown,
        createdBy: serializeFormUser(newForm.createdBy),
        managers: (newForm.managers ?? []).map((m: unknown) =>
          serializeFormUser(m)
        ),
        fields: newForm.fields,
        responses: newForm.responses,
        isActive: newForm.isActive,
        slug: newForm.slug ?? null,
        createdAt: newForm.createdAt,
        updatedAt: newForm.updatedAt
      }
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating form:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
