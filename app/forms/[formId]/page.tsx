'use client';

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/contexts/AuthContext";

export const runtime = 'edge';

export default function FormDetailPage() {
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");

  const { user, loading: authLoading, canCreateForms } = useAuth();
  const router = useRouter();
  const params = useParams();
  const formId = params.formId as string;

  useEffect(() => {
    // Wait for auth to complete before checking user
    if (authLoading) return;

    // Redirect to login if not authenticated
    if (!user) {
      router.push("/login");
      return;
    }

    // TODO: Fetch form details and check permissions
    setLoading(false);
  }, [user, authLoading, router, formId]);

  // Show loading while auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-main"></div>
      </div>
    );
  }

  if (!user) {
    return <div>Redirecting to login...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Form Details</h1>

        {/* TODO: Implement form viewing/filling system */}
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-600 mb-4">
            Form viewing/filling system is under development.
          </p>

          {/* Permission-based access notes */}
          <div className="text-sm text-gray-500 space-y-1">
            <p>• Form ID: {formId}</p>
            <p>
              • Current user: {user.name} ({user.email})
            </p>
            <p>• Is Admin: {user.isAdmin ? "Yes" : "No"}</p>
            <p>• Is Super Admin: {user.isSuperAdmin ? "Yes" : "No"}</p>
            <p>
              • Can Create Forms:{" "}
              {user.isSuperAdmin || canCreateForms() ? "Yes" : "No"}
            </p>
          </div>
        </div>
      </div>

      {/* 
        TODO: Implement the following features:
        
        1. FORM VIEWING
        - GET /api/forms/[formId] - Fetch form details
        - Display form title, description, creator
        - Show form fields with proper styling
        - Display form status (active/inactive)
        - Show submission deadline if set
        
        2. FORM FILLING (For regular users)
        - Dynamic form rendering based on field types
        - Input validation for each field
        - Progress saving for long forms
        - File upload handling
        - Submission confirmation
        - Duplicate submission prevention
        
        3. FORM MANAGEMENT (For form managers/creators)
        - Edit form structure (creators only)
        - View all responses
        - Export responses as CSV/Excel
        - Form analytics and statistics
        - Close/reopen form
        - Delete form (creators only)
        
        4. RESPONSE HANDLING
        - POST /api/forms/[formId]/responses - Submit response
        - Response validation
        - File upload processing
        - Response confirmation email
        - Response tracking and history
        
        5. PERMISSION SYSTEM
        - Public forms: Any logged-in user can fill
        - Private forms: Only invited users can fill
        - Form managers: Can view responses and manage form
        - Form creators: Can edit form structure and manage responses
        - Admins: Can view and manage all forms
        
        6. FIELD TYPES SUPPORT
        - Text input (single line, multi-line)
        - Number input with validation
        - Date picker
        - Checkbox (single, multiple)
        - Radio buttons
        - Dropdown/select
        - File upload
        - Rating scales
        - Matrix questions
        
        7. FORM ANALYTICS
        - Response count and completion rate
        - Response time statistics
        - Field-wise response analysis
        - Export capabilities
        
        8. NOTIFICATIONS
        - Email notifications for new responses (managers)
        - Submission confirmation (users)
        - Form deadline reminders
        
        API Endpoints needed:
        - GET /api/forms/[formId] - Get form details 
        - POST /api/forms/[formId]/responses - Submit response 
        - GET /api/forms/[formId]/responses - Get responses (managers only)
        - PATCH /api/forms/[formId] - Update form (creators only) 
        - DELETE /api/forms/[formId] - Delete form (creators only) 
        
        Permission System:
        - Form filling: Any logged-in user can fill public forms
        - Form viewing: Users can view forms they have access to
        - Form management: Form creators and assigned managers
        - Admin override: Admins can view and manage all forms
      */}
    </div>
  );
}
