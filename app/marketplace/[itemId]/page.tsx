"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams, usePathname } from "next/navigation";
import { useAuth } from "@/lib/contexts/AuthContext";
import { buildLoginUrl } from "@/lib/login-callback";
import { DescriptionContent } from "@/app/components/DescriptionContent";
import { galleryImageUrls } from "@/lib/marketplace-images";
import { MARKETPLACE_CONDITION_OPTIONS } from "@/lib/constants/marketplace-conditions";

interface MarketplaceItem {
  id: string;
  title: string;
  description?: string;
  descriptionMarkdown?: boolean;
  price: number;
  seller: {
    name: string;
    telegram?: string;
    phoneNumber?: string;
  };
  status: "available" | "reserved" | "sold";
  category?: string;
  condition?: string;
  meetupLocation?: string;
  imageUrl?: string;
  imageUrls?: string[];
  createdAt: string;
  updatedAt: string;
}

export default function MarketplaceItemDetailPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [item, setItem] = useState<MarketplaceItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<MarketplaceItem>>({});

  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const itemId = params.itemId as string;
  const loginHref = buildLoginUrl(pathname);

  useEffect(() => {
    // Wait for auth to complete before checking user
    if (authLoading) return;

    // Anyone can view marketplace items (no login required for viewing)
    // But login is required for contacting seller or managing items

    // Fetch item details
    fetchItem();
  }, [authLoading, itemId]);

  const fetchItem = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/marketplace/${itemId}`);

      if (response.ok) {
        const data = await response.json();
        setItem(data.item);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to fetch item");
      }
    } catch (error) {
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/marketplace/${itemId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...editData,
          descriptionMarkdown:
            editData.descriptionMarkdown ??
            item.descriptionMarkdown ??
            false,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setItem(data.item);
        setIsEditing(false);
        setEditData({});
        setSuccess("Item updated successfully!");
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to update item");
      }
    } catch (error) {
      setError("Network error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this item? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/marketplace/${itemId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push("/marketplace");
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to delete item");
      }
    } catch (error) {
      setError("Network error occurred");
    }
  };

  const canEditItem =
    user &&
    item &&
    (user.isSuperAdmin || user.isAdmin || item.seller.name === user.name);

  const formatPrice = (price: number) => {
    if (price === 0) return "Free";
    return `$${price.toFixed(2)}`;
  };

  const getCategoryLabel = (category: string) => {
    const categories = [
      "Electronics",
      "Books & Academic",
      "Furniture & Home",
      "Clothing & Fashion",
      "Sports & Recreation",
      "Beauty & Personal Care",
      "Transportation",
      "Musical Instruments",
      "Art & Crafts",
      "Food & Beverages",
      "Health & Wellness",
      "Baby & Kids",
      "Pets & Animals",
      "Garden & Outdoor",
      "Office & Business",
      "Free Items",
      "Other",
    ];
    return categories.includes(category) ? category : "Other";
  };

  // Show loading while auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-main"></div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-main"></div>
      </div>
    );
  }

  const itemGallery = item ? galleryImageUrls(item) : [];

  if (!item) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error || "Item not found"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.push("/marketplace")}
            className="text-gray-600 hover:text-gray-900 font-medium"
          >
            ← Back to Marketplace
          </button>
          {canEditItem && (
            <div className="flex space-x-2">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                {isEditing ? "Cancel Edit" : "Edit Item"}
              </button>
              <button
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Delete Item
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
            {success}
          </div>
        )}

        {/* Edit Form */}
        {isEditing && canEditItem && (
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Edit Item
            </h2>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Item Title
                </label>
                <input
                  type="text"
                  value={editData.title || item.title}
                  onChange={(e) =>
                    setEditData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={editData.description || item.description || ""}
                  onChange={(e) =>
                    setEditData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
                <label className="mt-2 flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300"
                    checked={
                      editData.descriptionMarkdown ??
                      item.descriptionMarkdown ??
                      false
                    }
                    onChange={(e) =>
                      setEditData((prev) => ({
                        ...prev,
                        descriptionMarkdown: e.target.checked,
                      }))
                    }
                  />
                  <span className="text-sm text-gray-700">
                    Format description as Markdown (headings, lists, links, etc.)
                  </span>
                </label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price (SGD)
                  </label>
                  <input
                    type="number"
                    value={
                      editData.price !== undefined ? editData.price : item.price
                    }
                    onChange={(e) =>
                      setEditData((prev) => ({
                        ...prev,
                        price: Number(e.target.value),
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={editData.status || item.status}
                    onChange={(e) =>
                      setEditData((prev) => ({
                        ...prev,
                        status: e.target.value as MarketplaceItem["status"],
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="available">Available</option>
                    <option value="reserved">Reserved</option>
                    <option value="sold">Sold</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Condition
                </label>
                <select
                  value={
                    editData.condition !== undefined
                      ? editData.condition
                      : item.condition ?? "Other"
                  }
                  onChange={(e) =>
                    setEditData((prev) => ({
                      ...prev,
                      condition: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {MARKETPLACE_CONDITION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  {submitting ? "Saving..." : "Save Changes"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Item Details */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {itemGallery.length > 0 && (
            <div
              className={`grid gap-1 bg-gray-200 p-1 ${
                itemGallery.length === 1
                  ? "grid-cols-1"
                  : itemGallery.length === 2
                    ? "grid-cols-2"
                    : "grid-cols-2 sm:grid-cols-3"
              }`}
            >
              {itemGallery.map((url, i) => (
                <img
                  key={`${url}-${i}`}
                  src={url}
                  alt=""
                  className={`w-full object-cover ${
                    itemGallery.length === 1 ? "h-72" : "h-44 sm:h-52"
                  }`}
                />
              ))}
            </div>
          )}

          <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {item.title}
                </h1>
                <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {getCategoryLabel(item.category || "Other")}
                  </span>
                  <span
                    className={`px-2 py-1 rounded ${
                      item.status === "available"
                        ? "bg-green-100 text-green-800"
                        : item.status === "reserved"
                          ? "bg-amber-100 text-amber-900"
                          : "bg-red-100 text-red-800"
                    }`}
                  >
                    {item.status === "available"
                      ? "Available"
                      : item.status === "reserved"
                        ? "Reserved"
                        : "Sold"}
                  </span>
                  {item.condition && (
                    <span className="rounded bg-gray-100 px-2 py-1 text-gray-800">
                      {MARKETPLACE_CONDITION_OPTIONS.find(
                        (o) => o.value === item.condition
                      )?.label ?? item.condition}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-blue-600">
                  {formatPrice(item.price)}
                </div>
                <div className="text-sm text-gray-500">
                  Posted {new Date(item.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Description */}
            {item.description && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Description
                </h3>
                <DescriptionContent
                  text={item.description}
                  asMarkdown={!!item.descriptionMarkdown}
                  className="text-gray-700"
                />
              </div>
            )}

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Item Details
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Category:</span>
                    <span className="font-medium">
                      {getCategoryLabel(item.category || "Other")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Price:</span>
                    <span className="font-medium">
                      {formatPrice(item.price)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="font-medium">
                      {item.status === "available"
                        ? "Available"
                        : item.status === "reserved"
                          ? "Reserved"
                          : "Sold"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Condition:</span>
                    <span className="font-medium">
                      {item.condition
                        ? MARKETPLACE_CONDITION_OPTIONS.find(
                            (o) => o.value === item.condition
                          )?.label ?? item.condition
                        : "—"}
                    </span>
                  </div>
                  {item.meetupLocation && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Location:</span>
                      <span className="font-medium">{item.meetupLocation}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Seller Information
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium">{item.seller.name}</span>
                  </div>
                  {user && item.seller.telegram && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Telegram:</span>
                      <a
                        href={`https://t.me/${item.seller.telegram}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-blue-600 hover:text-blue-800"
                      >
                        @{item.seller.telegram}
                      </a>
                    </div>
                  )}
                  {!user && (
                    <p className="text-gray-500">
                      <Link
                        href={loginHref}
                        className="font-medium text-blue-600 underline underline-offset-2 hover:text-blue-800"
                      >
                        Log in
                      </Link>{" "}
                      to see contact information
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Contact Actions */}
            {user && item.status === "available" && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Contact Seller
                </h3>
                <div className="flex space-x-4">
                  {item.seller.telegram && (
                    <a
                      href={`https://t.me/${item.seller.telegram}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                    >
                      Contact via Telegram
                    </a>
                  )}
                  {item.seller.phoneNumber && (
                    <a
                      href={`https://wa.me/${item.seller.phoneNumber.replace(
                        /[^0-9]/g,
                        ""
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                    >
                      WhatsApp Seller
                    </a>
                  )}
                </div>
              </div>
            )}

            {!user && item.status === "available" && (
              <div className="border-t pt-6">
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
                  Please{" "}
                  <Link
                    href={loginHref}
                    className="font-semibold text-blue-700 underline underline-offset-2 hover:text-blue-900"
                  >
                    log in
                  </Link>{" "}
                  to contact the seller.
                </div>
              </div>
            )}

            {item.status === "reserved" && (
              <div className="border-t pt-6">
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
                  This listing is reserved. The seller may not be taking new enquiries for this item.
                </div>
              </div>
            )}

            {item.status === "sold" && (
              <div className="border-t pt-6">
                <div className="bg-gray-50 border border-gray-200 text-gray-700 px-4 py-3 rounded-lg">
                  This item has been sold.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
