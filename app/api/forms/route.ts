import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Form from '@/lib/models/Form';
import { verifyToken, canCreateForms } from '@/lib/utils/auth';

// Middleware to check form creation permission
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

// Middleware to check if user is logged in (for viewing forms)
async function verifyLoggedInUser(req: NextRequest) {
  const token = req.cookies.get('auth-token')?.value;
  
  if (!token) {
    return null;
  }

  const decoded = verifyToken(token);
  return decoded;
}

// GET - Get all forms (logged in users can view)
export async function GET(req: NextRequest) {
  try {
    const user = await verifyLoggedInUser(req);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required to view forms' },
        { status: 401 }
      );
    }

    await dbConnect();

    // TODO: Implement form listing logic
    // - Fetch forms user can manage (assigned to them or admin)
    // - For regular users: only forms they are assigned to manage
    // - For admins: all forms
    // - Populate creator and managers information
    // - Return form list with management permissions
    
    // Placeholder response - remove when implementing
    return NextResponse.json({ 
      forms: [],
      message: "TODO: Implement form management system with user assignments"
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching forms:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new form (requires form creation permission)
export async function POST(req: NextRequest) {
  try {
    const user = await verifyFormCreationPermission(req);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Form creation permission required.' },
        { status: 401 }
      );
    }

    await dbConnect();

    // TODO: Implement form creation logic
    // - Validate form data (title, description, fields)
    // - Validate field types and options
    // - Allow selection of users who can manage this form
    // - Create new form document with managers array
    // - Send notifications to assigned managers
    // - Return created form information
    
    return NextResponse.json(
      {
        message: 'TODO: Form creation not yet implemented',
        error: 'Feature under development'
      },
      { status: 501 }
    );

  } catch (error) {
    console.error('Error creating form:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 