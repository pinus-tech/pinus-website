"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/AuthContext";

export default function CreateMarketplaceItemPage() {
  const [loading, setLoading] = useState(false);

  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait for auth to complete before checking user
    if (authLoading) return;

    // Redirect to login if not authenticated
    if (!user) {
      router.push("/login");
      return;
    }
  }, [user, authLoading, router]);

  // Show loading while auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-main"></div>
      </div>
    );
  }

  // Check permissions - login required for posting items
  if (!user) {
    return <div>Redirecting to login...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Post New Item</h1>
        
        {/* TODO: Implement item creation system */}
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-600 mb-4">Item creation system is under development.</p>
          
          {/* Permission-based access notes */}
          <div className="text-sm text-gray-500 space-y-1">
            <p>• Current user: {user.name} ({user.email})</p>
            <p>• Is Admin: {user.isAdmin ? 'Yes' : 'No'}</p>
            <p>• Is Super Admin: {user.isSuperAdmin ? 'Yes' : 'No'}</p>
            <p>• Can post items: Yes (logged in)</p>
            <p>• Can manage own items: Yes</p>
          </div>
        </div>
      </div>

      {/* 
        TODO: Implement the following features:
        
        1. ITEM CREATION FORM
        - Item title and description
        - Price input with validation
        - Category selection dropdown
        - Condition selection (new, like new, good, fair)
        - Location/pickup details
        - Contact preferences
        
        2. IMAGE UPLOAD SYSTEM
        - Multiple image upload support
        - Image compression and optimization
        - Drag-and-drop interface
        - Image preview and editing
        - File size and format validation
        
        3. CATEGORY SYSTEM
        - Electronics (phones, laptops, accessories)
        - Books (textbooks, novels, academic)
        - Furniture (desks, chairs, storage)
        - Clothing (casual, formal, accessories)
        - Sports & Recreation
        - Household items
        - Free items section
        
        4. PRICING & NEGOTIATION
        - Fixed price or negotiable
        - SGD
        
        5. CONTACT INFORMATION
        - Email contact
        - Telegram username
        - Preferred contact method
        
        6. LOCATION & PICKUP
        - Pickup location details
        - Campus area selection
        - Meeting point preferences
        
        7. FORM VALIDATION
        - Required field validation
        - Price format validation
        - Image upload validation
        - Contact information validation
        
        8. DRAFT SAVING
        - Save as draft functionality
        - Auto-save during form filling
        - Draft recovery on page reload
        
        9. PREVIEW & PUBLISH
        - Preview item before posting
        - Edit before publishing
        - Immediate publishing
    
        API Endpoints needed:
        - POST /api/marketplace - Create new item
        - POST /api/upload/images - Upload item images (TODO)
        - POST /api/marketplace/draft - Save draft item (TODO)
        - GET /api/marketplace/draft - Get saved draft (TODO)
        
        Permission System:
        - Access: Login required to post items
        - Item creation: Any logged-in user can post items
        - Item management: Users can edit/delete their own items
        - Admin override: Admins can manage all items
        - Content moderation: Admins can approve/reject items
      */}
    </div>
  );
}
