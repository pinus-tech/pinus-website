import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Form from "@/lib/models/Form";
import Response from "@/lib/models/Response";
import type { FormFieldDefinition } from "@/lib/form-field-types";
import { isDataField } from "@/lib/form-field-types";
import {
  isEmptyValue,
  validateFieldValue,
} from "@/lib/forms/validate-submission";
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

// GET - Get all responses for a form (form creator, managers, or super admin only)
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

    // Find form by ID
    const form = await Form.findById(formId);
    
    if (!form) {
      return NextResponse.json(
        { error: "Form not found" },
        { status: 404 }
      );
    }

    // Check if user can view responses
    const canViewResponses = user.isSuperAdmin || 
                           user.isAdmin || 
                           form.createdBy.toString() === user.userId ||
                           form.managers.includes(user.userId);

    if (!canViewResponses) {
      return NextResponse.json(
        { error: "You don't have permission to view responses for this form" },
        { status: 403 }
      );
    }

    // Get all responses for this form
    const responses = await Response.find({ formId })
      .populate('respondent', 'name email')
      .sort({ submittedAt: -1 });

    return NextResponse.json({
      responses: responses.map(response => ({
        id: response._id,
        respondent: response.respondent,
        responses: response.responses,
        submittedAt: response.submittedAt
      })),
      totalResponses: responses.length
    });
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
    const body = await req.json();
    const { responses } = body;

    // Find form by ID
    const form = await Form.findById(formId);
    
    if (!form) {
      return NextResponse.json(
        { error: "Form not found" },
        { status: 404 }
      );
    }

    // Check if form is active
    if (!form.isActive) {
      return NextResponse.json(
        { error: "This form is not accepting responses" },
        { status: 400 }
      );
    }

    // Validate response data
    if (!responses || !Array.isArray(responses)) {
      return NextResponse.json(
        { error: "Responses are required" },
        { status: 400 }
      );
    }

    const formFields = form.fields as FormFieldDefinition[];
    const dataLabels = new Set(
      formFields.filter((f) => isDataField(f)).map((f) => f.label)
    );

    for (const r of responses) {
      if (!dataLabels.has(r.fieldLabel)) {
        return NextResponse.json(
          {
            error: `Unknown field or invalid field: ${r.fieldLabel}`,
          },
          { status: 400 }
        );
      }
    }

    for (const field of formFields) {
      if (!isDataField(field) || !field.required) continue;
      const resp = responses.find((x) => x.fieldLabel === field.label);
      if (!resp || isEmptyValue(field, resp.value)) {
        return NextResponse.json(
          { error: `Required field '${field.label}' is missing` },
          { status: 400 }
        );
      }
    }

    for (const response of responses) {
      const formField = formFields.find((f) => f.label === response.fieldLabel);
      if (!formField || !isDataField(formField)) continue;
      const err = validateFieldValue(formField, response.value);
      if (err) {
        return NextResponse.json(
          { error: `${response.fieldLabel}: ${err}` },
          { status: 400 }
        );
      }
    }

    // Check for duplicate submission (optional - can be disabled)
    const existingResponse = await Response.findOne({
      formId,
      respondent: user.userId
    });

    if (existingResponse) {
      return NextResponse.json(
        { error: "You have already submitted a response to this form" },
        { status: 400 }
      );
    }

    // Create new response
    const newResponse = new Response({
      formId,
      respondent: user.userId,
      responses,
      submittedAt: new Date()
    });

    await newResponse.save();

    // Update form response count
    await Form.findByIdAndUpdate(formId, {
      $push: { responses: newResponse._id }
    });

    return NextResponse.json({
      message: "Form response submitted successfully",
      responseId: newResponse._id
    }, { status: 201 });
  } catch (error) {
    console.error("Error submitting form response:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
