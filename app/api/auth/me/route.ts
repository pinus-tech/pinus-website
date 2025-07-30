import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";
import { verifyToken } from "@/lib/utils/auth";

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("auth-token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "No authentication token found" },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    await dbConnect();

    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          telegram: user.telegram,
          phoneNumber: user.phoneNumber,
          city: user.city,
          major: user.major,
          intakeYear: user.intakeYear,
          yearOfStudy: user.yearOfStudy,
          highSchool: user.highSchool,
          isAdmin: user.isAdmin,
          isSuperAdmin: user.isSuperAdmin,
          permissions: user.permissions,
          isApproved: user.isApproved,
          createdAt: user.createdAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching user data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
