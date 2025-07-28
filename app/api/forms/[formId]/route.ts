import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Form from "@/lib/models/Form";
import { verifyToken, canCreateForms } from "@/lib/utils/auth";

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

    // TODO: Implement individual form fetching logic
    // - Find form by ID
    // - Check if user can manage this form (assigned manager or admin)
    // - Populate creator and managers information
    // - Check if form is active
    // - Return full form details including fields and management permissions

    return NextResponse.json(
      {
        message: "TODO: Individual form viewing not yet implemented",
        error: "Feature under development",
      },
      { status: 501 }
    );
  } catch (error) {
    console.error("Error fetching form:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH - Update form (only form creator, assigned managers, or super admin)
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

    // TODO: Implement form update logic
    // - Find form by ID
    // - Check if user can edit this form (creator, assigned manager, or super admin)
    // - Validate updated fields
    // - Update form document
    // - Handle manager assignments (add/remove managers)
    // - Handle field modifications carefully (existing responses)
    // - Return updated form information

    return NextResponse.json(
      {
        message: "TODO: Form editing not yet implemented",
        error: "Feature under development",
      },
      { status: 501 }
    );
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

    // TODO: Implement form deletion logic
    // - Find form by ID
    // - Check if user can delete this form (creator or super admin only)
    // - Handle existing responses
    // - Clean up related data

    return NextResponse.json(
      {
        message: "TODO: Form deletion not yet implemented",
        error: "Feature under development",
      },
      { status: 501 }
    );
  } catch (error) {
    console.error("Error deleting form:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
