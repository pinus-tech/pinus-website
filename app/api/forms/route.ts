import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Form from "@/lib/models/Form";
import User from "@/lib/models/User";
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

    // All logged-in users can see all active forms
    const forms = await Form.find({ isActive: true })
      .populate('createdBy', 'name email')
      .populate('managers', 'name email')
      .sort({ createdAt: -1 });

    return NextResponse.json({
      forms: forms.map(form => {
        // Determine user permissions for this form
        const canEdit = user.isSuperAdmin || 
                       user.isAdmin || 
                       form.createdBy._id.toString() === user.userId ||
                       form.managers.some((manager: { _id: { toString: () => string } }) => manager._id.toString() === user.userId);
        
        const canViewResponses = user.isSuperAdmin || 
                               user.isAdmin || 
                               form.createdBy._id.toString() === user.userId ||
                               form.managers.some((manager: { _id: { toString: () => string } }) => manager._id.toString() === user.userId);

        return {
          id: form._id,
          title: form.title,
          description: form.description,
          createdBy: form.createdBy,
          managers: form.managers || [],
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
        };
      })
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
    const { title, description, fields, managers } = body;

    // Validate required fields
    if (!title || !fields || !Array.isArray(fields)) {
      return NextResponse.json(
        { error: "Title and fields are required" },
        { status: 400 }
      );
    }

    // Validate fields structure
    for (const field of fields) {
      if (!field.label || !field.type) {
        return NextResponse.json(
          { error: "Each field must have a label and type" },
          { status: 400 }
        );
      }

      // Validate field type
      const validTypes = ['text', 'number', 'date', 'checkbox', 'dropdown'];
      if (!validTypes.includes(field.type)) {
        return NextResponse.json(
          { error: `Invalid field type: ${field.type}` },
          { status: 400 }
        );
      }

      // Validate dropdown options
      if (field.type === 'dropdown' && (!field.options || !Array.isArray(field.options) || field.options.length === 0)) {
        return NextResponse.json(
          { error: "Dropdown fields must have options" },
          { status: 400 }
        );
      }
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
      createdBy: user.userId,
      managers: managers || [],
      fields,
      responses: [],
      isActive: true
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
        createdBy: newForm.createdBy,
        managers: newForm.managers,
        fields: newForm.fields,
        responses: newForm.responses,
        isActive: newForm.isActive,
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
