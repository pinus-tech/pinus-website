"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import Link from "next/link";
import { MARKETPLACE_CATEGORIES } from "@/lib/constants/marketplace-categories";

interface MarketplaceItem {
  id: string;
  title: string;
  description?: string;
  price: number;
  seller: {
    name: string;
    telegram?: string;
    phoneNumber?: string;
  };
  status: "available" | "sold";
  category?: string;
  meetupLocation?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export default function MarketplacePage() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MarketplaceItem | null>(
    null
  );
  const [filtersVisible, setFiltersVisible] = useState(false);

  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    // Wait for auth to complete before checking user
    if (authLoading) return;

    // Anyone can view marketplace (no login required for viewing)
    // But login is required for posting items

    // Fetch marketplace items
    fetchItems();
  }, [authLoading]);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        contactModalOpen &&
        (event.target as Element).classList.contains("modal-backdrop")
      ) {
        setContactModalOpen(false);
      }
    };

    if (contactModalOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "unset";
    };
  }, [contactModalOpen]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams();
      if (selectedCategory !== "all")
        params.append("category", selectedCategory);
      if (searchTerm.trim()) params.append("search", searchTerm.trim());
      if (minPrice && minPrice !== "") params.append("minPrice", minPrice);
      if (maxPrice && maxPrice !== "") params.append("maxPrice", maxPrice);
      params.append("status", "available");

      console.log("Fetching items with params:", params.toString());

      const response = await fetch(`/api/marketplace?${params.toString()}`);

      if (response.ok) {
        const data = await response.json();
        setItems(data.items);
        console.log("Fetched items:", data.items.length);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to fetch items");
        console.error("API error:", errorData);
      }
    } catch (error) {
      console.error("Network error:", error);
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchItems();
  };

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchItems();
  };

  const handleFilterChange = () => {
    fetchItems();
  };

  // Auto-filter when category changes
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(e.target.value);
    // Don't auto-fetch here, let user control with search button
  };

  // Auto-filter when price changes (with debounce)
  const handlePriceChange = (type: "min" | "max", value: string) => {
    if (type === "min") {
      setMinPrice(value);
    } else {
      setMaxPrice(value);
    }
    // Don't auto-fetch here, let user control with search button
  };

  const formatPrice = (price: number) => {
    if (price === 0) return "Free";
    return `$${price.toFixed(2)}`;
  };

  const getCategoryLabel = (category: string) => {
    const cat = MARKETPLACE_CATEGORIES.find((c) => c.value === category);
    return cat ? cat.label : category;
  };

  const handleContact = (item: MarketplaceItem) => {
    setSelectedItem(item);
    setContactModalOpen(true);
  };

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
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Marketplace</h1>
          <div className="flex space-x-2">
            {user && (
              <Link
                href="/marketplace/my-listings"
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                My Listings
              </Link>
            )}
            {user && (
              <Link
                href="/marketplace/create"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Post Item
              </Link>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Quick Search Bar */}
        <div className="bg-white p-4 rounded-lg shadow mb-4">
          <form onSubmit={handleSearchSubmit} className="flex space-x-2">
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchInput}
              placeholder="Search items by title or description..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Search
            </button>
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  fetchItems();
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Clear
              </button>
            )}
          </form>
        </div>

        {/* Search and Filters */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Search & Filters
            </h3>
            <button
              onClick={() => setFiltersVisible(!filtersVisible)}
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 font-medium"
            >
              <span>{filtersVisible ? "Hide" : "Show"} Filters</span>
              <svg
                className={`w-4 h-4 transition-transform ${
                  filtersVisible ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          </div>

          {filtersVisible && (
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={handleCategoryChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Categories</option>
                    {MARKETPLACE_CATEGORIES.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Min Price
                  </label>
                  <input
                    type="number"
                    value={minPrice}
                    onChange={(e) => handlePriceChange("min", e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Price
                  </label>
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => handlePriceChange("max", e.target.value)}
                    placeholder="1000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Apply Filters
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCategory("all");
                    setMinPrice("");
                    setMaxPrice("");
                    fetchItems();
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </form>
          )}

          {/* Quick Filter Summary */}
          {(searchTerm ||
            selectedCategory !== "all" ||
            minPrice ||
            maxPrice) && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span className="font-medium">Active filters:</span>
                  {searchTerm && (
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                      Search: &quot;{searchTerm}&quot;
                    </span>
                  )}
                  {selectedCategory !== "all" && (
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                      Category: {getCategoryLabel(selectedCategory)}
                    </span>
                  )}
                  {minPrice && (
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                      Min: ${minPrice}
                    </span>
                  )}
                  {maxPrice && (
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                      Max: ${maxPrice}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCategory("all");
                    setMinPrice("");
                    setMaxPrice("");
                    fetchItems();
                  }}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Clear All
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Items Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-main"></div>
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No items found
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedCategory !== "all" || minPrice || maxPrice
                ? "Try adjusting your search criteria."
                : "No items are currently available in the marketplace."}
            </p>
            {user && (
              <Link
                href="/marketplace/create"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Post Your First Item
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg shadow overflow-hidden"
              >
                {item.imageUrl && (
                  <div className="aspect-w-16 aspect-h-9 bg-gray-200">
                    <img
                      src={item.imageUrl}
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
                      {item.description}
                    </p>
                  )}

                  <div className="space-y-2 text-sm text-gray-500">
                    <div className="flex justify-between">
                      <span>Category:</span>
                      <span>{getCategoryLabel(item.category || "Other")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Seller:</span>
                      <span>{item.seller.name}</span>
                    </div>
                    {item.meetupLocation && (
                      <div className="flex justify-between">
                        <span>Location:</span>
                        <span className="text-right">
                          {item.meetupLocation}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Posted:</span>
                      <span>
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex space-x-2">
                    <Link
                      href={`/marketplace/${item.id}`}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors text-center"
                    >
                      View Details
                    </Link>
                    {user &&
                      (item.seller.telegram || item.seller.phoneNumber) && (
                        <button
                          onClick={() => handleContact(item)}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
                        >
                          Contact
                        </button>
                      )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info Section */}
        <div className="mt-8 bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Marketplace Information
          </h3>
          <div className="text-sm text-gray-600 space-y-2">
            <p>• Public access: Anyone can view items (no login required)</p>
            <p>• Post items: Login required</p>
            <p>• Contact sellers: Login required to see telegram/phone</p>
            {user ? (
              <>
                <p>
                  • Current user: {user.name} ({user.email})
                </p>
                <p>• Can post items: Yes (logged in)</p>
                <p>• Can manage own items: Yes</p>
                <p>• Can contact sellers: Yes (logged in)</p>
                <p>• Admin override: {user.isAdmin ? "Yes" : "No"}</p>
              </>
            ) : (
              <>
                <p>• Not logged in - can view items but cannot post</p>
                <p>• Not logged in - cannot see seller contact information</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Contact Modal */}
      {contactModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal-backdrop">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                Contact Seller
              </h3>
              <button
                onClick={() => setContactModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 mb-2">
                Contact{" "}
                <span className="font-semibold">
                  {selectedItem.seller.name}
                </span>{" "}
                for:
              </p>
              <p className="text-lg font-medium text-gray-900">
                {selectedItem.title}
              </p>
              <p className="text-blue-600 font-bold">
                {formatPrice(selectedItem.price)}
              </p>
            </div>

            <div className="space-y-3">
              {selectedItem.seller.phoneNumber && (
                <a
                  href={`https://wa.me/${selectedItem.seller.phoneNumber.replace(
                    /[^0-9]/g,
                    ""
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
                  </svg>
                  Contact via WhatsApp
                </a>
              )}

              {selectedItem.seller.telegram && (
                <a
                  href={`https://t.me/${selectedItem.seller.telegram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                  </svg>
                  Contact via Telegram
                </a>
              )}
            </div>

            <button
              onClick={() => setContactModalOpen(false)}
              className="w-full mt-4 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
