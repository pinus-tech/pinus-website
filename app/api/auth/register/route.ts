import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";
import { generateToken, hashPassword } from "@/lib/utils/auth";
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

    const iy =
      intakeYear === undefined || intakeYear === null || intakeYear === ""
        ? undefined
        : parseInt(String(intakeYear), 10);
    const yos =
      yearOfStudy === undefined || yearOfStudy === null || yearOfStudy === ""
        ? undefined
        : parseInt(String(yearOfStudy), 10);
    if (iy !== undefined && !Number.isFinite(iy)) {
      return NextResponse.json(
        { error: "Intake year must be a valid number" },
        { status: 400 }
      );
    }
    if (yos !== undefined && !Number.isFinite(yos)) {
      return NextResponse.json(
        { error: "Year of study must be a valid number" },
        { status: 400 }
      );
    }
    if (iy !== undefined && (iy < 1990 || iy > 2100)) {
      return NextResponse.json(
        { error: "Intake year must be between 1990 and 2100" },
        { status: 400 }
      );
    }
    if (yos !== undefined && (yos < 1 || yos > 10)) {
      return NextResponse.json(
        { error: "Year of study must be between 1 and 10" },
        { status: 400 }
      );
    }

    const newUser = new User({
      name,
      email: emailNormalized,
      password: hashedPassword,
      telegram,
      phoneNumber,
      city,
      major,
      intakeYear: iy,
      yearOfStudy: yos,
      highSchool,
      career,
      isEmailVerified: true,
      isApproved: true,
      isAdmin: false,
    });

    await newUser.save();

    const token = generateToken(
      newUser._id.toString(),
      newUser.isAdmin,
      newUser.isSuperAdmin,
      newUser.permissions
    );

    const response = NextResponse.json(
      {
        message: "Registration successful! You are now signed in.",
        userId: newUser._id,
        email: newUser.email,
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          telegram: newUser.telegram,
          phoneNumber: newUser.phoneNumber,
          city: newUser.city,
          major: newUser.major,
          intakeYear: newUser.intakeYear,
          yearOfStudy: newUser.yearOfStudy,
          highSchool: newUser.highSchool,
          career: newUser.career,
          isAdmin: newUser.isAdmin,
          isSuperAdmin: newUser.isSuperAdmin,
          isEmailVerified: newUser.isEmailVerified,
          permissions: newUser.permissions,
          isApproved: newUser.isApproved,
          createdAt: newUser.createdAt,
        },
      },
      { status: 201 }
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
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
