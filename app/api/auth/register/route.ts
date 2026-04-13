import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";
import { hashPassword } from "@/lib/utils/auth";
import {
  emailFilterCaseInsensitive,
  normalizeEmail,
} from "@/lib/utils/email";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const body = await req.json();
    const {
      name,
      email,
      password,
      telegram,
      phoneNumber,
      city,
      major,
      intakeYear,
      yearOfStudy,
      highSchool,
      career,
    } = body;

    // Validate required fields
    if (!name || !email || !password || !telegram || !phoneNumber || !city) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const emailNormalized = normalizeEmail(email);

    const existingUser = await User.findOne(emailFilterCaseInsensitive(email));
    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);

    const newUser = new User({
      name,
      email: emailNormalized,
      password: hashedPassword,
      telegram,
      phoneNumber,
      city,
      major,
      intakeYear,
      yearOfStudy,
      highSchool,
      career,
      isEmailVerified: true,
      isApproved: true,
      isAdmin: false,
    });

    await newUser.save();

    return NextResponse.json(
      {
        message: "Registration successful! You can log in with your NUS email.",
        userId: newUser._id,
        email: newUser.email,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
