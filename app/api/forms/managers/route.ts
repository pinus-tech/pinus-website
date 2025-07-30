import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import { verifyToken, canCreateForms } from '@/lib/utils/auth';

export const runtime = 'edge';

// Middleware to check form creation permission (needed to assign managers)
async function verifyFormCreationPermission(req: NextRequest) {
  const token = req.cookies.get('auth-token')?.value;
  
  if (!token) {
    return null;
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return null;
  }

  // Check if user has permission to create forms or is super admin
  if (!decoded.isSuperAdmin && !canCreateForms(decoded)) {
    return null;
  }

  return decoded;
}

// GET - Get all users who can manage forms (for form creator to assign managers)
export async function GET(req: NextRequest) {
  try {
    const user = await verifyFormCreationPermission(req);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Form creation permission required to view potential managers.' },
        { status: 401 }
      );
    }

    await dbConnect();

    // TODO: Implement user fetching logic for form managers
    // - Get all users who have canCreateForms permission or are admins
    // - Exclude the current user (form creator)
    // - Return user list with basic info (id, name, email)
    // - Add search and pagination if needed
    
    const potentialManagers = await User.find({
      $and: [
        { _id: { $ne: user.userId } }, // Exclude current user
        {
          $or: [
            { isAdmin: true }, // All admins can manage forms
            { 'permissions.canCreateForms': true } // Users with form creation permission
          ]
        },
        { isApproved: true } // Only approved users
      ]
    })
    .select('name email telegram isAdmin isSuperAdmin permissions')
    .sort({ name: 1 });

    const managersData = potentialManagers.map(manager => ({
      id: manager._id,
      name: manager.name,
      email: manager.email,
      telegram: manager.telegram,
      isAdmin: manager.isAdmin,
      isSuperAdmin: manager.isSuperAdmin,
      canCreateForms: manager.permissions?.canCreateForms || false
    }));

    return NextResponse.json({ 
      managers: managersData,
      count: managersData.length
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching potential form managers:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 