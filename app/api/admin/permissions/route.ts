import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import { verifyToken } from '@/lib/utils/auth';

export const runtime = 'edge';

// Middleware to check super admin authentication
async function verifySuperAdmin(req: NextRequest) {
  const token = req.cookies.get('auth-token')?.value;
  
  if (!token) {
    return null;
  }

  const decoded = verifyToken(token);
  if (!decoded || !decoded.isSuperAdmin) {
    return null;
  }

  return decoded;
}

// PATCH - Update user permissions (super admin only)
export async function PATCH(req: NextRequest) {
  try {
    const superAdmin = await verifySuperAdmin(req);
    if (!superAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized. Super admin access required.' },
        { status: 401 }
      );
    }

    await dbConnect();

    const body = await req.json();
    const { userId, permissions, isAdmin, isSuperAdmin } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
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

    // Prevent modifying other super admins
    if (user.isSuperAdmin && user._id.toString() !== superAdmin.userId) {
      return NextResponse.json(
        { error: 'Cannot modify other super admin accounts' },
        { status: 403 }
      );
    }

    // Update user permissions and admin status
    if (permissions !== undefined) {
      user.permissions = {
        canApproveAccounts: permissions.canApproveAccounts || false,
        canCreateForms: permissions.canCreateForms || false,
        canManageUsers: permissions.canManageUsers || false,
        canViewAnalytics: permissions.canViewAnalytics || false,
      };
    }

    if (isAdmin !== undefined) {
      user.isAdmin = isAdmin;
    }

    if (isSuperAdmin !== undefined) {
      user.isSuperAdmin = isSuperAdmin;
    }

    await user.save();

    return NextResponse.json(
      {
        message: 'User permissions updated successfully',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          isAdmin: user.isAdmin,
          isSuperAdmin: user.isSuperAdmin,
          permissions: user.permissions,
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating user permissions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 