import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import Form from "@/lib/models/Form";
import Response from "@/lib/models/Response";
import { verifyToken } from "@/lib/utils/auth";

async function verifyLoggedInUser(req: NextRequest) {
  const token = req.cookies.get("auth-token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

/** DELETE a single submission (organisers / admins only). */
export async function DELETE(
  req: NextRequest,
  {
    params,
  }: { params: Promise<{ formId: string; responseId: string }> }
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
    const { formId, responseId } = await params;

    if (!mongoose.Types.ObjectId.isValid(formId) || !mongoose.Types.ObjectId.isValid(responseId)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const form = await Form.findById(formId);
    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    const managerIds = (form.managers ?? []).map((id: { toString: () => string }) =>
      id.toString()
    );
    const canManage =
      user.isSuperAdmin ||
      user.isAdmin ||
      form.createdBy.toString() === user.userId ||
      managerIds.includes(user.userId);

    if (!canManage) {
      return NextResponse.json(
        { error: "You don't have permission to delete responses" },
        { status: 403 }
      );
    }

    const responseDoc = await Response.findOne({
      _id: responseId,
      formId,
    });

    if (!responseDoc) {
      return NextResponse.json({ error: "Response not found" }, { status: 404 });
    }

    await Response.deleteOne({ _id: responseId });
    await Form.findByIdAndUpdate(formId, {
      $pull: { responses: new mongoose.Types.ObjectId(responseId) },
    });

    return NextResponse.json({ message: "Response deleted" });
  } catch (error) {
    console.error("DELETE form response:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
