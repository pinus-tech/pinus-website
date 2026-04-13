'use client';

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { buildLoginUrl } from "@/lib/login-callback";
import { useAuth } from "@/lib/contexts/AuthContext";
import Link from "next/link";
import { descriptionCardPreview } from "@/lib/description-preview";
import { primaryMarketplaceImageUrl } from "@/lib/marketplace-images";
import { MARKETPLACE_CONDITION_OPTIONS } from "@/lib/constants/marketplace-conditions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";

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

export default function MyListingsPage() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<
    "all" | "available" | "reserved" | "sold"
  >("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push(buildLoginUrl(pathname));
      return;
    }

    fetchMyListings();
  }, [user, authLoading, router, pathname]);

  const fetchMyListings = async () => {
    try {
      setLoading(true);
      
      // Always load all statuses for this seller; tabs filter client-side.
      // (Sending no status for seller returns available + sold - see API.)
      const params = new URLSearchParams();
      params.append("seller", user!.id);

      const response = await fetch(`/api/marketplace?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        setItems(data.items);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch listings');
      }
    } catch (error) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (
    itemId: string,
    newStatus: "available" | "reserved" | "sold"
  ) => {
    setActionLoading(itemId);
    try {
      const response = await fetch(`/api/marketplace/${itemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        // Update the item in the local state
        setItems(prev => prev.map(item => 
          item.id === itemId ? { ...item, status: newStatus } : item
        ));
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update item status');
      }
    } catch (error) {
      setError('Network error occurred');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
      return;
    }

    setActionLoading(itemId);
    try {
      const response = await fetch(`/api/marketplace/${itemId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove the item from the local state
        setItems(prev => prev.filter(item => item.id !== itemId));
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to delete item');
      }
    } catch (error) {
      setError('Network error occurred');
    } finally {
      setActionLoading(null);
    }
  };

  const formatPrice = (price: number) => {
    if (price === 0) return 'Free';
    return `$${price.toFixed(2)}`;
  };

  const getCategoryLabel = (category: string) => {
    const categories = [
      "Electronics", "Books & Academic", "Furniture & Home", "Clothing & Fashion",
      "Sports & Recreation", "Beauty & Personal Care", "Transportation", "Musical Instruments",
      "Art & Crafts", "Food & Beverages", "Health & Wellness", "Baby & Kids",
      "Pets & Animals", "Garden & Outdoor", "Office & Business", "Free Items", "Other"
    ];
    return categories.includes(category) ? category : 'Other';
  };

  const getStatusBadge = (status: string) => {
    if (status === "available") {
      return (
        <span className="rounded bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
          Available
        </span>
      );
    }
    if (status === "reserved") {
      return (
        <span className="rounded bg-amber-100 px-2 py-1 text-xs font-medium text-amber-900">
          Reserved
        </span>
      );
    }
    return (
      <span className="rounded bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
        Sold
      </span>
    );
  };

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
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">My Listings</h1>
          <Link
            href="/marketplace/create"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Post New Item
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Filter Controls */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="flex items-center justify-between">
            <div className="flex space-x-4">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterStatus === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                All ({items.length})
              </button>
              <button
                onClick={() => setFilterStatus('available')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterStatus === 'available'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Available ({items.filter(item => item.status === 'available').length})
              </button>
              <button
                onClick={() => setFilterStatus('reserved')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterStatus === 'reserved'
                    ? 'bg-amber-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Reserved ({items.filter(item => item.status === 'reserved').length})
              </button>
              <button
                onClick={() => setFilterStatus('sold')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterStatus === 'sold'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Sold ({items.filter(item => item.status === 'sold').length})
              </button>
            </div>
            <button
              onClick={fetchMyListings}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Listings */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-main"></div>
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No listings found</h3>
            <p className="text-gray-600 mb-4">
              {filterStatus !== 'all' 
                ? `You don't have any ${filterStatus} listings.`
                : "You haven't posted any items yet."
              }
            </p>
            <Link
              href="/marketplace/create"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Post Your First Item
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items
              .filter(item => filterStatus === 'all' || item.status === filterStatus)
              .map((item) => {
                const thumb = primaryMarketplaceImageUrl(item);
                return (
                <div key={item.id} className="bg-white rounded-lg shadow overflow-hidden">
                  {thumb && (
                    <div className="aspect-w-16 aspect-h-9 bg-gray-200">
                      <img
                        src={thumb}
                        alt={item.title}
                        className="w-full h-48 object-cover"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                        {item.title}
                      </h3>
                      <span className="text-lg font-bold text-blue-600">
                        {formatPrice(item.price)}
                      </span>
                    </div>
                    
                    {item.description && (
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {descriptionCardPreview(
                          item.description,
                          !!item.descriptionMarkdown
                        )}
                      </p>
                    )}

                    <div className="space-y-2 text-sm text-gray-500 mb-4">
                      <div className="flex justify-between">
                        <span>Category:</span>
                        <span>{getCategoryLabel(item.category || 'Other')}</span>
                      </div>
                      {item.condition && (
                        <div className="flex justify-between">
                          <span>Condition:</span>
                          <span className="text-right">
                            {MARKETPLACE_CONDITION_OPTIONS.find(
                              (o) => o.value === item.condition
                            )?.label ?? item.condition}
                          </span>
                        </div>
                      )}
                      {item.meetupLocation && (
                        <div className="flex justify-between">
                          <span>Location:</span>
                          <span className="text-right">{item.meetupLocation}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Posted:</span>
                        <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Status:</span>
                        {getStatusBadge(item.status)}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:space-x-2">
                      <Link
                        href={`/marketplace/${item.id}`}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors text-center"
                      >
                        View Details
                      </Link>
                      <Select
                        value={item.status}
                        disabled={actionLoading === item.id}
                        onValueChange={(v) =>
                          handleStatusChange(
                            item.id,
                            v as "available" | "reserved" | "sold"
                          )
                        }
                      >
                        <SelectTrigger
                          variant="blue"
                          outline
                          rounding="lg"
                          size="sm"
                          className="w-full min-w-0 flex-1 sm:min-w-[160px]"
                          aria-label="Change listing status"
                        >
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent variant="blue" outline rounding="lg">
                          <SelectItem value="available">
                            Mark: Available
                          </SelectItem>
                          <SelectItem value="reserved">
                            Mark: Reserved
                          </SelectItem>
                          <SelectItem value="sold">Mark: Sold</SelectItem>
                        </SelectContent>
                      </Select>
                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={actionLoading === item.id}
                        className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
              })}
          </div>
        )}

        {/* Summary */}
        {items.length > 0 && (
          <div className="mt-8 bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium">Total Listings:</span> {items.length}
              </div>
              <div>
                <span className="font-medium">Available:</span> {items.filter(item => item.status === 'available').length}
              </div>
              <div>
                <span className="font-medium">Reserved:</span> {items.filter(item => item.status === 'reserved').length}
              </div>
              <div>
                <span className="font-medium">Sold:</span> {items.filter(item => item.status === 'sold').length}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 