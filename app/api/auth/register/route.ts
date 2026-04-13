import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import { hashPassword, sendVerificationEmail, generateVerificationCode } from '@/lib/utils/auth';

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
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Generate verification code
    const verificationCode = generateVerificationCode();
    const verificationExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create new user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      telegram,
      phoneNumber,
      city,
      major,
      intakeYear,
      yearOfStudy,
      highSchool,
      career,
      isEmailVerified: false,
      emailVerificationToken: verificationCode,
      emailVerificationExpires: verificationExpires,
      isApproved: true, // Auto-approve after email verification
      isAdmin: false,
    });

    await newUser.save();

    // Send verification email (Mailjet: sender must be validated; sandbox only allows test recipients)
    const emailResult = await sendVerificationEmail(email, verificationCode);

    if (!emailResult.ok) {
      console.error("Verification email failed:", emailResult.error);
      await User.findByIdAndDelete(newUser._id);
      const isDev = process.env.NODE_ENV === "development";
      return NextResponse.json(
        {
          error: isDev
            ? `Failed to send verification email: ${emailResult.error}`
            : "Failed to send verification email. Please try again.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: 'Registration successful! Please check your email for the verification code.',
        userId: newUser._id,
        email: newUser.email,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 