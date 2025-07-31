import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import { verifyToken } from '@/lib/utils/auth';

// Middleware to check if user is logged in
async function verifyLoggedInUser(req: NextRequest) {
  const token = req.cookies.get('auth-token')?.value;
  
  if (!token) {
    return null;
  }

  const decoded = verifyToken(token);
  return decoded;
}

// GET - Get current user's profile information
export async function GET(req: NextRequest) {
  try {
    const user = await verifyLoggedInUser(req);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    await dbConnect();

    const userProfile = await User.findById(user.userId).select('-password');
    if (!userProfile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user: userProfile }, { status: 200 });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH - Update current user's profile information
export async function PATCH(req: NextRequest) {
  try {
    const user = await verifyLoggedInUser(req);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    await dbConnect();

    const body = await req.json();
    const { name, telegram, phoneNumber, city, major, career } = body;

    // Validate required fields
    if (!name || !phoneNumber || !city) {
      return NextResponse.json(
        { error: 'Name, phone number, and city are required' },
        { status: 400 }
      );
    }

    // Find and update the user
    const userProfile = await User.findById(user.userId);
    if (!userProfile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update allowed fields only
    userProfile.name = name;
    userProfile.telegram = telegram ? telegram.replace(/^@+/, '') : ''; // Remove @ symbols
    userProfile.phoneNumber = phoneNumber;
    userProfile.city = city;
    userProfile.major = major || '';
    userProfile.career = career || 'undergrad';

    await userProfile.save();

    // Return updated user data (without password)
    const updatedUser = await User.findById(user.userId).select('-password');

    return NextResponse.json(
      {
        message: 'Profile updated successfully',
        user: updatedUser
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 