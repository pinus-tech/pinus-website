import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Form from "@/lib/models/Form";
import Response from "@/lib/models/Response";
import { serializeFormUser } from "@/lib/serialize-form-users";
import { validateFormFieldsArray } from "@/lib/forms/validate-form-fields";
import {
  assignUniqueFormSlug,
  normalizeFormSlugInput,
} from "@/lib/forms/form-slug";
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

// GET - Get specific form details (logged in users can view)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  try {
    const user = await verifyLoggedInUser(req);
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required to view form" },
        { status: 401 }
      );
    }

    await dbConnect();

    const { formId } = await params;

    // Find form by ID
    const form = await Form.findById(formId)
      .populate('createdBy', 'name email')
      .populate('managers', 'name email');
    
    if (!form) {
      return NextResponse.json(
        { error: "Form not found" },
        { status: 404 }
      );
    }

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

    const existingResponseDoc = await Response.findOne({
      formId: form._id,
      respondent: user.userId,
    }).lean<{
      responses: Array<{ fieldLabel: string; value: unknown }>;
      submittedAt: Date;
    } | null>();

    const hasSubmitted = !!existingResponseDoc;

    const shared = form.isShared ?? true;
    const canViewForm = shared || isStaff || hasSubmitted;
    if (!canViewForm) {
      return NextResponse.json(
        {
          error:
            "This form is not open yet. Ask an organiser to share the participation link.",
        },
        { status: 403 }
      );
    }

    const canFill =
      form.isActive &&
      !hasSubmitted &&
      (shared || isStaff);

    return NextResponse.json({
      form: {
        id: form._id,
        title: form.title,
        description: form.description,
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
        mySubmission: hasSubmitted && existingResponseDoc
          ? {
              responses: existingResponseDoc.responses,
              submittedAt: existingResponseDoc.submittedAt,
            }
          : null,
        userPermissions: {
          canEdit,
          canViewResponses,
          canFill,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching form:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH - Update form (only form creator, managers, or super admin)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
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

    const { formId } = await params;
    const body = (await req.json()) as Record<string, unknown>;

    // Find form by ID
    const form = await Form.findById(formId);
    
    if (!form) {
      return NextResponse.json(
        { error: "Form not found" },
        { status: 404 }
      );
    }

    const managerIds = (form.managers ?? []).map((id: { toString: () => string }) =>
      id.toString()
    );
    // Check if user can edit this form
    const canEdit = user.isSuperAdmin || 
                   user.isAdmin || 
                   form.createdBy.toString() === user.userId ||
                   managerIds.includes(user.userId);

    if (!canEdit) {
      return NextResponse.json(
        { error: "You don't have permission to edit this form" },
        { status: 403 }
      );
    }

    if (body.fields && Array.isArray(body.fields)) {
      const fieldsError = validateFormFieldsArray(body.fields);
      if (fieldsError) {
        return NextResponse.json({ error: fieldsError }, { status: 400 });
      }
    }

    const setDoc: Record<string, unknown> = {};

    if (typeof body.title === "string") setDoc.title = body.title;
    if (body.description !== undefined) setDoc.description = body.description;
    if (body.fields && Array.isArray(body.fields))
      setDoc.fields = body.fields;
    if (typeof body.isActive === "boolean") setDoc.isActive = body.isActive;
    if (typeof body.isShared === "boolean") setDoc.isShared = body.isShared;
    if (Array.isArray(body.managers)) setDoc.managers = body.managers;

    const unsetDoc: Record<string, 1> = {};

    if ("slug" in body) {
      const raw = body.slug;
      if (raw === null || raw === "") {
        unsetDoc.slug = 1;
      } else {
        const normalized = normalizeFormSlugInput(raw);
        if (!normalized) {
          return NextResponse.json(
            {
              error:
                "Short link must be 2–80 characters: letters, numbers, and hyphens only (e.g. form1).",
            },
            { status: 400 }
          );
        }
        const unique = await assignUniqueFormSlug(normalized, formId);
        setDoc.slug = unique;
      }
    }

    const updateQuery: { $set?: Record<string, unknown>; $unset?: Record<string, 1> } =
      {};
    if (Object.keys(setDoc).length) updateQuery.$set = setDoc;
    if (Object.keys(unsetDoc).length) updateQuery.$unset = unsetDoc;

    if (!updateQuery.$set && !updateQuery.$unset) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    // Update form
    const updatedForm = await Form.findByIdAndUpdate(
      formId,
      updateQuery,
      { new: true }
    ).populate('createdBy', 'name email').populate('managers', 'name email');

    if (!updatedForm) {
      return NextResponse.json(
        { error: "Form not found" },
        { status: 404 }
      );
    }

    const createdByU = serializeFormUser(updatedForm.createdBy);
    const managersU = (updatedForm.managers ?? []).map((m: unknown) =>
      serializeFormUser(m)
    );
    const canEditU =
      user.isSuperAdmin ||
      user.isAdmin ||
      createdByU._id === user.userId ||
      managersU.some(
        (manager: { _id: string }) => manager._id === user.userId
      );
    const canViewResponsesU =
      user.isSuperAdmin ||
      user.isAdmin ||
      createdByU._id === user.userId ||
      managersU.some(
        (manager: { _id: string }) => manager._id === user.userId
      );
    const isStaffU =
      user.isSuperAdmin ||
      user.isAdmin ||
      createdByU._id === user.userId ||
      managersU.some(
        (manager: { _id: string }) => manager._id === user.userId
      );
    const existingAfterPatch = await Response.findOne({
      formId: updatedForm._id,
      respondent: user.userId,
    }).lean<{
      responses: Array<{ fieldLabel: string; value: unknown }>;
      submittedAt: Date;
    } | null>();

    const hasSubmittedU = !!existingAfterPatch;
    const sharedU = updatedForm.isShared ?? true;
    const canFillU =
      updatedForm.isActive &&
      !hasSubmittedU &&
      (sharedU || isStaffU);

    return NextResponse.json({
      message: "Form updated successfully",
      form: {
        id: updatedForm._id,
        title: updatedForm.title,
        description: updatedForm.description,
        createdBy: createdByU,
        managers: managersU,
        fields: updatedForm.fields,
        responses: updatedForm.responses,
        isActive: updatedForm.isActive,
        isShared: sharedU,
        createdAt: updatedForm.createdAt,
        updatedAt: updatedForm.updatedAt,
        responseCount: updatedForm.responses.length,
        slug: updatedForm.slug ?? null,
        userHasSubmitted: hasSubmittedU,
        mySubmission: hasSubmittedU && existingAfterPatch
          ? {
              responses: existingAfterPatch.responses,
              submittedAt: existingAfterPatch.submittedAt,
            }
          : null,
        userPermissions: {
          canEdit: canEditU,
          canViewResponses: canViewResponsesU,
          canFill: canFillU,
        },
      },
    });
  } catch (error) {
    console.error("Error updating form:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete form (only form creator or super admin)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
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

    const { formId } = await params;

    // Find form by ID
    const form = await Form.findById(formId);
    
    if (!form) {
      return NextResponse.json(
        { error: "Form not found" },
        { status: 404 }
      );
    }

    // Check if user can delete this form
    const canDelete = user.isSuperAdmin || 
                     form.createdBy.toString() === user.userId;

    if (!canDelete) {
      return NextResponse.json(
        { error: "You don't have permission to delete this form" },
        { status: 403 }
      );
    }

    // Delete form
    await Form.findByIdAndDelete(formId);

    return NextResponse.json({
      message: "Form deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting form:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
