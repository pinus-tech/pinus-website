import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Form from "@/lib/models/Form";
import { serializeFormUser } from "@/lib/serialize-form-users";
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
        createdAt: form.createdAt,
        updatedAt: form.updatedAt,
        responseCount: form.responses.length,
        userPermissions: {
          canEdit,
          canViewResponses,
          canFill: true // All logged-in users can fill forms
        }
      }
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

    // Validate fields if they're being updated
    if (body.fields && Array.isArray(body.fields)) {
      for (const field of body.fields) {
        if (!field.label || !field.type) {
          return NextResponse.json(
            { error: "Each field must have a label and type" },
            { status: 400 }
          );
        }

        const validTypes = ['text', 'number', 'date', 'checkbox', 'dropdown'];
        if (!validTypes.includes(field.type)) {
          return NextResponse.json(
            { error: `Invalid field type: ${field.type}` },
            { status: 400 }
          );
        }

        if (field.type === 'dropdown' && (!field.options || !Array.isArray(field.options) || field.options.length === 0)) {
          return NextResponse.json(
            { error: "Dropdown fields must have options" },
            { status: 400 }
          );
        }
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

    return NextResponse.json({
      message: "Form updated successfully",
      form: {
        id: updatedForm._id,
        title: updatedForm.title,
        description: updatedForm.description,
        createdBy: serializeFormUser(updatedForm.createdBy),
        managers: (updatedForm.managers ?? []).map((m: unknown) =>
          serializeFormUser(m)
        ),
        fields: updatedForm.fields,
        responses: updatedForm.responses,
        isActive: updatedForm.isActive,
        createdAt: updatedForm.createdAt,
        updatedAt: updatedForm.updatedAt
      }
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
