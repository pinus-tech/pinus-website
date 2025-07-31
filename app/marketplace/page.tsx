"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { MARKETPLACE_CATEGORIES } from "@/lib/constants/marketplace-categories";

export default function MarketplacePage() {
  const [loading, setLoading] = useState(true);

  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    // Wait for auth to complete before checking user
    if (authLoading) return;

    // Anyone can view marketplace (no login required for viewing)
    // But login is required for posting items

    // TODO: Fetch marketplace items
    setLoading(false);
  }, [authLoading]);

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
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Marketplace</h1>

        {/* TODO: Implement marketplace system */}
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-600 mb-4">
            Marketplace system is under development.
          </p>

          {/* Permission-based access notes */}
          <div className="text-sm text-gray-500 space-y-1">
            <p>• Public access: Anyone can view items (no login required)</p>
            <p>• Post items: Login required</p>
            <p>• Contact sellers: Login required to see telegram/phone</p>
            {user && (
              <>
                <p>
                  • Current user: {user.name} ({user.email})
                </p>
                <p>• Can post items: Yes (logged in)</p>
                <p>• Can manage own items: Yes</p>
                <p>• Can contact sellers: Yes (logged in)</p>
                <p>• Admin override: {user.isAdmin ? "Yes" : "No"}</p>
              </>
            )}
            {!user && (
              <>
                <p>• Not logged in - can view items but cannot post</p>
                <p>• Not logged in - cannot see seller contact information</p>
              </>
            )}
          </div>

          {/* Available Categories */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Available Categories ({MARKETPLACE_CATEGORIES.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {MARKETPLACE_CATEGORIES.map((category) => (
                <div
                  key={category.value}
                  className="bg-gray-50 p-3 rounded border"
                >
                  <div className="font-medium text-gray-900">
                    {category.label}
                  </div>
                  <div className="text-sm text-gray-600">
                    {category.description}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 
        TODO: Implement the following features:
        
        1. ITEM LISTINGS
        - GET /api/marketplace - List all available items
        - Display items in a grid/card layout
        - Show item image, title, price, seller, status
        - Pagination for large datasets
        
        2. SEARCH & FILTERING
        - Search by item title and description
        - Filter by category (using MARKETPLACE_CATEGORIES)
        - Filter by price range
        - Sort by price, date posted
        
        3. ITEM DETAILS
        - Individual item page with full details
        - Image gallery with zoom functionality
        - Seller contact information (telegram/phone - login required)
        - Item description, condition, pickup details
        
        4. ITEM POSTING (Requires login)
        - Link to /marketplace/create page
        - Item creation form with image upload
        - Multiple image support with compression
        - Category selection (using MARKETPLACE_CATEGORIES)
        - Location/pickup details
        - Contact preferences
        
        5. ITEM MANAGEMENT (For item owners)
        - Edit item details and images
        - Mark items as sold/available
        - Delete items
        - View item statistics (views, inquiries)
        
        6. CONTACT SYSTEM
        - Email seller button (for logged-in users)
        - Telegram contact (login required)
        - Phone number display (login required)
        
        7. CATEGORIES
        - Use MARKETPLACE_CATEGORIES for consistent categorization
        - Filter items by category
        - Show category-specific items
        
        8. ADMIN FEATURES
        - Content moderation
        - User management
        
        API Endpoints needed:
        - GET /api/marketplace - List items with search/filter 
        - POST /api/marketplace - Create new item (requires login) 
        - GET /api/marketplace/[id] - Get item details 
        - PATCH /api/marketplace/[id] - Update item (owner/admin only) 
        - DELETE /api/marketplace/[id] - Delete item (owner/admin only) 
        - GET /api/marketplace/categories - Get available categories 
        - POST /api/upload/images - Upload item images 
        
        Permission System:
        - Public viewing: Anyone can browse items (no login required)
        - Post items: Login required to post items for sale
        - Item management: Users can edit/delete their own items
        - Admin override: Admins can manage all items
        - Content moderation: Admins can approve/reject items
        - Contact sellers: Login required to see telegram/phone numbers
      */}
    </div>
  );
}
