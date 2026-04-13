import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Form from "@/lib/models/Form";
import Response from "@/lib/models/Response";
import { serializeFormUser } from "@/lib/serialize-form-users";
import { validateFormFieldsArray } from "@/lib/forms/validate-form-fields";
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

    const hasSubmitted = !!(await Response.exists({
      formId: form._id,
      respondent: user.userId,
    }));

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
        userHasSubmitted: hasSubmitted,
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
    const body = await req.json();

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

    // Update form
    const updatedForm = await Form.findByIdAndUpdate(
      formId,
      { ...body },
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
    const hasSubmittedU = !!(await Response.exists({
      formId: updatedForm._id,
      respondent: user.userId,
    }));
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
        userHasSubmitted: hasSubmittedU,
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
