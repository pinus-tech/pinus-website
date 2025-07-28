"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";

export default function FormsPage() {
  const [loading, setLoading] = useState(true);

  const { user, loading: authLoading, canCreateForms } = useAuth();

  useEffect(() => {
    // Wait for auth to complete before checking user
    if (authLoading) return;

    // Redirect to login if not authenticated
    if (!user) {
      window.location.href = "/login";
      return;
    }

    // TODO: Fetch forms user can manage
    setLoading(false);
  }, [user, authLoading]);

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
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Forms</h1>

        {/* TODO: Implement forms management system */}
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-600 mb-4">
            Forms system is under development.
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
          </div>
        </div>
      </div>

      {/* 
        TODO: Implement the following features:
        
        1. FORMS LISTING
        - GET /api/forms - List forms user can manage
        - Display forms in a table/grid layout
        - Show form title, description, creator, response count
        - Filter by forms user created vs forms assigned to user
        
        2. FORM MANAGEMENT
        - Edit/delete buttons for owned forms
        - View responses button for managed forms
        - Export responses as CSV/Excel
        - Form analytics (completion rate, response count)
        
        3. FORM CREATION (Permission: canCreateForms OR isSuperAdmin)
        - Link to /forms/create page
        - Form builder with drag-and-drop interface
        - Field types: text, number, date, checkbox, dropdown, file upload
        - Manager assignment system
        
        4. FORM FILLING
        - List of public forms available to fill
        - Form submission interface
        - Progress saving for long forms
        - Submission confirmation
        
        5. RESPONSE MANAGEMENT (For form managers)
        - View all responses to managed forms
        - Individual response details
        - Response filtering and search
        - Response export functionality
        
        6. PERMISSION SYSTEM
        - Form creators can assign managers
        - Managers can view/export responses but not edit form structure
        - Admins can see and manage all forms
        - Super admins have full access
        
        7. NOTIFICATIONS
        - Email notifications for new form responses
        - Notifications when assigned as form manager
        - Form deadline reminders
        
        8. FORM TEMPLATES
        - Save forms as templates
        - Template library for common form types
        - Clone existing forms
        
        API Endpoints needed:
        - GET /api/forms - List forms 
        - POST /api/forms - Create form 
        - GET /api/forms/[id] - Get form details 
        - PATCH /api/forms/[id] - Update form 
        - DELETE /api/forms/[id] - Delete form 
        - GET /api/forms/[id]/responses - Get form responses 
        - POST /api/forms/[id]/responses - Submit response 
        - GET /api/forms/managers - Get potential form managers (✅ implemented)
      */}
    </div>
  );
}
