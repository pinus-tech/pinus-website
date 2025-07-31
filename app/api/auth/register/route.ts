import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import { hashPassword } from '@/lib/utils/auth';

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
      isApproved: false,
      isAdmin: false,
    });

    await newUser.save();

    return NextResponse.json(
      {
        message: 'Registration successful! Your account is pending admin approval.',
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          isApproved: newUser.isApproved,
        },
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