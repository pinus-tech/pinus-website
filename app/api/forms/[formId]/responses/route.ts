import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Form from "@/lib/models/Form";
import Response from "@/lib/models/Response";
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

// GET - Get all responses for a form (form creator, assigned managers, or super admin only)
export async function GET(
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

    // TODO: Implement response fetching logic
    // - Find form by ID
    // - Check if user can view responses (form creator, assigned manager, or super admin)
    // - Get all responses for this form
    // - Populate respondent information
    // - Format response data for easy viewing
    // - Add pagination if needed
    // - Include analytics data (response count, completion rate, etc.)

    return NextResponse.json(
      {
        message: "TODO: Form response viewing not yet implemented",
        error: "Feature under development",
      },
      { status: 501 }
    );
  } catch (error) {
    console.error("Error fetching form responses:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Submit form response (any logged in user)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  try {
    const user = await verifyLoggedInUser(req);
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required to submit form" },
        { status: 401 }
      );
    }

    await dbConnect();

    const { formId } = await params;

    // TODO: Implement form response submission logic
    // - Find form by ID
    // - Check if form is active and accepting responses
    // - Validate response data against form fields
    // - Check required fields
    // - Validate field types and values
    // - Prevent duplicate submissions if needed
    // - Save response to database
    // - Update form response count
    // - Return success confirmation

    return NextResponse.json(
      {
        message: "TODO: Form submission not yet implemented",
        error: "Feature under development",
      },
      { status: 501 }
    );
  } catch (error) {
    console.error("Error submitting form response:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
