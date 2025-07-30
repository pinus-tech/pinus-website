'use client';

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/contexts/AuthContext";

export const runtime = 'edge';

export default function MarketplaceItemDetailPage() {
  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState(null);
  const [error, setError] = useState("");

  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const itemId = params.itemId as string;

  useEffect(() => {
    // Wait for auth to complete before checking user
    if (authLoading) return;

    // Anyone can view marketplace items (no login required for viewing)
    // But login is required for contacting seller or managing items

    // TODO: Fetch item details
    setLoading(false);
  }, [authLoading, itemId]);

  // Show loading while auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-main"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Item Details</h1>

        {/* TODO: Implement item viewing system */}
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-600 mb-4">
            Item viewing system is under development.
          </p>

          {/* Permission-based access notes */}
          <div className="text-sm text-gray-500 space-y-1">
            <p>• Item ID: {itemId}</p>
            <p>• Public access: Anyone can view items (no login required)</p>
            <p>• Contact seller: Login required</p>
            {user && (
              <>
                <p>
                  • Current user: {user.name} ({user.email})
                </p>
                <p>• Can contact seller: Yes (logged in)</p>
                <p>• Can manage own items: Yes</p>
                <p>• Admin override: {user.isAdmin ? "Yes" : "No"}</p>
              </>
            )}
            {!user && (
              <p>• Not logged in - can view item but cannot contact seller</p>
            )}
          </div>
        </div>
      </div>

      {/* 
        TODO: Implement the following features:
        
        1. ITEM DETAILS DISPLAY
        - GET /api/marketplace/[itemId] - Fetch item details
        - Display item title, description, price
        - Show item images in gallery format
        - Display seller information
        - Show item status (available/sold)
        - Display creation date and last updated
        
        2. IMAGE GALLERY
        - Multiple image display
        - Image zoom functionality
        - Image carousel/slider
        - Thumbnail navigation
        - Full-screen image view
        
        3. SELLER INFORMATION
        - Seller name and profile
        - Contact information (for logged-in users)
        
        4. CONTACT SYSTEM (Login required)
        - Telegram display
        - Phone number display 
        
        5. ITEM MANAGEMENT (For item owners)
        - Edit item details
        - Mark as sold/available
        - Delete item
        
        6. RELATED ITEMS
        - Items in same category
        - Items by same seller
        
        7. ITEM ACTIONS
        - Share item link
        
        10. ADMIN FEATURES
        - Content moderation tools
        - Item approval/rejection
        - User management
        - Analytics and reporting
        
        API Endpoints needed:
        - GET /api/marketplace/[itemId] - Get item details 
        - PATCH /api/marketplace/[itemId] - Update item (owner/admin only) 
        - DELETE /api/marketplace/[itemId] - Delete item (owner/admin only) 
        
        Permission System:
        - Public viewing: Anyone can view item details (no login required)
        - Contact seller: Login required to contact seller
        - Item management: Users can edit/delete their own items
        - Admin override: Admins can manage all items
      */}
    </div>
  );
}
