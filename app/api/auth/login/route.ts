import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";
import { comparePassword, generateToken } from "@/lib/utils/auth";
import {
  emailFilterCaseInsensitive,
  normalizeEmail,
} from "@/lib/utils/email";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const user = await User.findOne(emailFilterCaseInsensitive(email));
    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const canonical = normalizeEmail(email);
    if (user.email !== canonical) {
      user.email = canonical;
      await user.save();
    }

    const token = generateToken(
      user._id.toString(),
      user.isAdmin,
      user.isSuperAdmin,
      user.permissions
    );

    const response = NextResponse.json(
      {
        message: "Login successful",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          isAdmin: user.isAdmin,
          isSuperAdmin: user.isSuperAdmin,
          isEmailVerified: user.isEmailVerified,
          permissions: user.permissions,
          isApproved: user.isApproved,
          career: user.career,
        },
      },
      { status: 200 }
    );

    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    const isDev = process.env.NODE_ENV === "development";
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      {
        error: isDev ? message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
