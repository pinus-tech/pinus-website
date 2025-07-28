"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/AuthContext";

export default function CreateFormPage() {
  const [loading, setLoading] = useState(false);

  const { user, canCreateForms, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    // Redirect if not authenticated
    if (!user) {
      router.push("/login");
      return;
    }

    // Allow access if user is super admin OR has canCreateForms permission
    if (!user.isSuperAdmin && !canCreateForms()) {
      router.push("/forms");
      return;
    }
  }, [user, canCreateForms, router]);

  // Show loading while checking permissions
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-main"></div>
      </div>
    );
  }

  // Check permissions - allow super admin OR users with canCreateForms permission
  if (!user.isSuperAdmin && !canCreateForms()) {
    return <div>Redirecting...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Create New Form
        </h1>

        {/* TODO: Implement form creation system */}
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-600 mb-4">
            Form creation system is under development.
          </p>

          {/* Permission-based access notes */}
          <div className="text-sm text-gray-500 space-y-1">
            <p>
              • Current user: {user.name} ({user.email})
            </p>
            <p>• Is Admin: {user.isAdmin ? "Yes" : "No"}</p>
            <p>• Is Super Admin: {user.isSuperAdmin ? "Yes" : "No"}</p>
            <p>
              • Can Create Forms:{" "}
              {user.isSuperAdmin || canCreateForms() ? "Yes" : "No"}
            </p>
            <p>
              • Access granted:{" "}
              {user.isSuperAdmin
                ? "Super Admin privileges"
                : "Form creation permission"}
            </p>
          </div>
        </div>
      </div>

      {/* 
        TODO: Implement the following features:
        
        1. FORM BUILDER INTERFACE
        - Drag-and-drop form builder
        - Field type selection (text, number, date, checkbox, dropdown, file upload)
        - Field validation settings
        - Required field indicators
        - Field ordering and grouping
        
        2. FORM SETTINGS
        - Form title and description
        - Form visibility (public/private)
        - Submission deadline
        - Response limit per user
        - Allow anonymous submissions
        - Form template selection
        
        3. MANAGER ASSIGNMENT
        - Select users who can manage this form
        - Multiple manager support
        - Manager permissions (view responses, export data)
        - Manager notification settings
        
        4. FIELD TYPES
        - Text input (short/long)
        - Number input with validation
        - Date picker
        - Checkbox (single/multiple)
        - Dropdown with custom options
        - File upload with size limits
        - Rating scales
        - Matrix questions
        
        5. PREVIEW & TESTING
        - Live form preview
        - Test submission functionality
        - Mobile responsiveness testing
        - Form validation testing
        
        6. SAVE & PUBLISH
        - Save as draft
        - Publish form
        - Schedule publication
        - Form versioning
        
        API Endpoints needed:
        - GET /api/forms/managers - Get potential form managers (✅ implemented)
        - POST /api/forms - Create new form 
        - POST /api/upload/files - Upload form attachments 
        - GET /api/forms/templates - Get form templates
        
        Permission System:
        - Access: Super admin OR users with canCreateForms permission
        - Form creation: Full access to form builder
        - Manager assignment: Can assign users with form management permissions
        - Form publishing: Can publish forms immediately or schedule
      */}
    </div>
  );
}
