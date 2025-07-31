import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";
import { verifyToken, canManageUsers } from "@/lib/utils/auth";

// Middleware to check admin authentication with user management permission
async function verifyAdminWithUserManagement(req: NextRequest) {
  const token = req.cookies.get("auth-token")?.value;

  if (!token) {
    return null;
  }

  const decoded = verifyToken(token);
  if (!decoded || !decoded.isAdmin) {
    return null;
  }

  // Check if user has permission to manage users or is super admin
  if (!decoded.isSuperAdmin && !canManageUsers(decoded)) {
    return null;
  }

  return decoded;
}

// GET - Get specific user details (admin with user management permission)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const admin = await verifyAdminWithUserManagement(req);
    if (!admin) {
      return NextResponse.json(
        {
          error:
            "Unauthorized. Admin access with user management permission required.",
        },
        { status: 401 }
      );
    }

    await dbConnect();

    const { userId } = await params;
    const user = await User.findById(userId).select("-password");
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH - Update user details (admin with user management permission or super admin)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const admin = await verifyAdminWithUserManagement(req);
    if (!admin) {
      return NextResponse.json(
        {
          error:
            "Unauthorized. Admin access with user management permission required.",
        },
        { status: 401 }
      );
    }

    await dbConnect();

    const { userId } = await params;
    const body = await req.json();
    const {
      name,
      email,
      telegram,
      phoneNumber,
      city,
      major,
      intakeYear,
      yearOfStudy,
      highSchool,
      career,
    } = body;

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prevent non-super admins from editing super admin accounts
    if (user.isSuperAdmin && !admin.isSuperAdmin) {
      return NextResponse.json(
        { error: "Cannot modify super admin accounts" },
        { status: 403 }
      );
    }

    // Check if email is being changed and if it already exists
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email, _id: { $ne: userId } });
      if (existingUser) {
        return NextResponse.json(
          { error: "Email already exists" },
          { status: 409 }
        );
      }
    }

    // Update user fields
    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (telegram !== undefined) user.telegram = telegram.replace(/^@+/, ""); // Remove @ symbols
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
    if (city !== undefined) user.city = city;
    if (major !== undefined) user.major = major;
    if (intakeYear !== undefined) user.intakeYear = intakeYear;
    if (yearOfStudy !== undefined) user.yearOfStudy = yearOfStudy;
    if (highSchool !== undefined) user.highSchool = highSchool;
    if (career !== undefined) user.career = career;

    await user.save();

    return NextResponse.json(
      {
        message: "User updated successfully",
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
          career: user.career,
          isAdmin: user.isAdmin,
          isSuperAdmin: user.isSuperAdmin,
          permissions: user.permissions,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
