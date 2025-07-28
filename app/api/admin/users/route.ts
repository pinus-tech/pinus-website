import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import { verifyToken, sendApprovalEmail, canApproveAccounts } from '@/lib/utils/auth';

// Middleware to check admin authentication with account approval permission
async function verifyAdminWithApprovalPermission(req: NextRequest) {
  const token = req.cookies.get('auth-token')?.value;
  
  if (!token) {
    return null;
  }

  const decoded = verifyToken(token);
  if (!decoded || !decoded.isAdmin) {
    return null;
  }

  // Check if user has permission to approve accounts
  if (!canApproveAccounts(decoded)) {
    return null;
  }

  return decoded;
}

// Middleware to check any admin authentication (for viewing users)
async function verifyAdmin(req: NextRequest) {
  const token = req.cookies.get('auth-token')?.value;
  
  if (!token) {
    return null;
  }

  const decoded = verifyToken(token);
  if (!decoded || !decoded.isAdmin) {
    return null;
  }

  return decoded;
}

// GET - Get all users (any admin can view)
export async function GET(req: NextRequest) {
  try {
    const admin = await verifyAdmin(req);
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    await dbConnect();

    const users = await User.find({})
      .select('-password')
      .sort({ createdAt: -1 });

    return NextResponse.json({ users }, { status: 200 });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH - Approve/reject user (requires account approval permission)
export async function PATCH(req: NextRequest) {
  try {
    const admin = await verifyAdminWithApprovalPermission(req);
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access with account approval permission required.' },
        { status: 401 }
      );
    }

    await dbConnect();

    const body = await req.json();
    const { userId, action } = body; // action: 'approve' or 'reject'

    if (!userId || !action) {
      return NextResponse.json(
        { error: 'User ID and action are required' },
        { status: 400 }
      );
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (action === 'approve') {
      user.isApproved = true;
      user.approvedAt = new Date();
      await user.save();

      // Send approval email
      try {
        await sendApprovalEmail(user.email, user.name);
      } catch (emailError) {
        console.error('Error sending approval email:', emailError);
        // Don't fail the approval if email fails
      }

      return NextResponse.json(
        { 
          message: 'User approved successfully',
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            isApproved: user.isApproved,
          }
        },
        { status: 200 }
      );
    } else if (action === 'reject') {
      await User.findByIdAndDelete(userId);
      
      return NextResponse.json(
        { message: 'User rejected and removed successfully' },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "approve" or "reject"' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error updating user status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 