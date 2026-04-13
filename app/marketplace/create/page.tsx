"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/AuthContext";
import { MARKETPLACE_CATEGORIES } from "@/lib/constants/marketplace-categories";
import { uploadMarketplaceImage } from "@/lib/firebase/upload-marketplace-image";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";

interface ItemData {
  title: string;
  description: string;
  price: number;
  category: string;
  meetupLocation: string;
  imageUrl: string;
}

type SgdIdrQuote = {
  idrPerSgd: number;
  updatedAt: string | null;
  nextUpdateAt: string | null;
  providerUrl: string;
  documentationUrl: string | null;
  termsUrl: string | null;
  sourceLabel: string;
};

export default function CreateMarketplaceItemPage() {
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  const [itemData, setItemData] = useState<ItemData>({
    title: '',
    description: '',
    price: 0,
    category: 'Other',
    meetupLocation: '',
    imageUrl: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [sgdIdrQuote, setSgdIdrQuote] = useState<SgdIdrQuote | null>(null);
  const [sgdIdrError, setSgdIdrError] = useState<string | null>(null);
  const [sgdIdrLoading, setSgdIdrLoading] = useState(true);
  const [fxModalOpen, setFxModalOpen] = useState(false);

  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setSgdIdrLoading(true);
      setSgdIdrError(null);
      try {
        const res = await fetch("/api/fx/sgd-idr");
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to load rates");
        }
        if (!cancelled) {
          setSgdIdrQuote({
            idrPerSgd: data.idrPerSgd,
            updatedAt: data.updatedAt,
            nextUpdateAt: data.nextUpdateAt ?? null,
            providerUrl: data.providerUrl,
            documentationUrl: data.documentationUrl,
            termsUrl: data.termsUrl ?? null,
            sourceLabel: data.sourceLabel,
          });
        }
      } catch (e) {
        if (!cancelled) {
          setSgdIdrError(
            e instanceof Error ? e.message : "Could not load IDR estimate"
          );
          setSgdIdrQuote(null);
        }
      } finally {
        if (!cancelled) setSgdIdrLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!fxModalOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFxModalOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [fxModalOpen]);

  useEffect(() => {
    // Wait for auth to complete before checking user
    if (authLoading) return;

    // Redirect to login if not authenticated
    if (!user) {
      router.push("/login");
      return;
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!itemData.title.trim()) {
      setError('Item title is required');
      return;
    }

    if (itemData.price < 0) {
      setError('Price must be a non-negative number');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let imageUrl = itemData.imageUrl.trim();

      if (imageFile && user) {
        setUploadingImage(true);
        try {
          imageUrl = await uploadMarketplaceImage(imageFile, user.id);
        } catch (uploadErr) {
          setError(
            uploadErr instanceof Error
              ? uploadErr.message
              : "Failed to upload image"
          );
          setUploadingImage(false);
          setLoading(false);
          return;
        } finally {
          setUploadingImage(false);
        }
      }

      const response = await fetch('/api/marketplace', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...itemData,
          imageUrl,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/marketplace/${data.item.id}`);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create item');
      }
    } catch (error) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

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

  const formatIdr = (n: number) =>
    new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(
      Math.round(n)
    );

  const formatRate = (n: number) =>
    new Intl.NumberFormat("en-SG", { maximumFractionDigits: 2 }).format(n);

  /** Parses API UTC timestamps and formats in the viewer's local timezone. */
  const formatFxDateShort = (utcString: string | null) => {
    if (!utcString) return "";
    const d = new Date(utcString);
    if (Number.isNaN(d.getTime())) return utcString;
    return new Intl.DateTimeFormat(undefined, {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
    }).format(d);
  };

  const formatFxDateLong = (utcString: string | null) => {
    if (!utcString) return "—";
    const d = new Date(utcString);
    if (Number.isNaN(d.getTime())) return utcString;
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(d);
  };

  const idrEquivalent =
    sgdIdrQuote && Number.isFinite(itemData.price)
      ? itemData.price * sgdIdrQuote.idrPerSgd
      : null;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Post New Item</h1>
          <button
            onClick={() => router.push('/marketplace')}
            className="text-gray-600 hover:text-gray-900 font-medium"
          >
            ← Back to Marketplace
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Item Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Item Title *
                </label>
                <input
                  type="text"
                  value={itemData.title}
                  onChange={(e) => setItemData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter item title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={itemData.description}
                  onChange={(e) => setItemData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  placeholder="Describe your item (condition, features, etc.)"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price (SGD) *
                  </label>
                  <input
                    type="number"
                    value={itemData.price}
                    onChange={(e) => setItemData(prev => ({ ...prev, price: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                    min="0"
                    step="0.01"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">Enter 0 for free items</p>
                  <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                    {sgdIdrLoading && (
                      <p className="text-gray-500">Loading IDR estimate…</p>
                    )}
                    {!sgdIdrLoading && sgdIdrError && (
                      <p className="text-amber-800">
                        {sgdIdrError}. Your listing is still saved in SGD only.
                      </p>
                    )}
                    {!sgdIdrLoading && sgdIdrQuote && (
                      <p className="text-sm text-gray-800 leading-snug">
                        ≈ Rp{" "}
                        {idrEquivalent !== null
                          ? formatIdr(idrEquivalent)
                          : "—"}{" "}
                        <span className="text-gray-600">
                          (ExchangeRate-API
                          {sgdIdrQuote.updatedAt
                            ? `, ${formatFxDateShort(sgdIdrQuote.updatedAt)}`
                            : ""}
                          )
                        </span>{" "}
                        <button
                          type="button"
                          onClick={() => setFxModalOpen(true)}
                          className="text-blue-600 hover:text-blue-800 underline font-medium"
                        >
                          see more
                        </button>
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <Select
                    value={itemData.category}
                    onValueChange={(value) =>
                      setItemData((prev) => ({ ...prev, category: value }))
                    }
                  >
                    <SelectTrigger
                      variant="blue"
                      outline
                      rounding="lg"
                      className="w-full"
                    >
                      <SelectValue placeholder="Choose a category" />
                    </SelectTrigger>
                    <SelectContent variant="blue" outline rounding="lg">
                      {MARKETPLACE_CATEGORIES.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {(() => {
                    const cat = MARKETPLACE_CATEGORIES.find(
                      (c) => c.value === itemData.category
                    );
                    return cat?.description ? (
                      <p className="text-xs text-gray-500 mt-2">
                        {cat.description}
                      </p>
                    ) : null;
                  })()}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meetup Location
                </label>
                <input
                  type="text"
                  value={itemData.meetupLocation}
                  onChange={(e) => setItemData(prev => ({ ...prev, meetupLocation: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., NUS Campus, MRT Station, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Photo (optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    setImageFile(f);
                    if (previewUrlRef.current) {
                      URL.revokeObjectURL(previewUrlRef.current);
                      previewUrlRef.current = null;
                    }
                    if (f) {
                      const url = URL.createObjectURL(f);
                      previewUrlRef.current = url;
                      setImagePreview(url);
                    } else {
                      setImagePreview(null);
                    }
                  }}
                  className="w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-blue-50 file:text-blue-700"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Uploads to Firebase Storage (max 8 MB).
                </p>
                {imagePreview && (
                  <div className="mt-3">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-h-48 rounded-lg border border-gray-200 object-contain"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Or image URL (optional)
                </label>
                <input
                  type="url"
                  value={itemData.imageUrl}
                  onChange={(e) =>
                    setItemData((prev) => ({ ...prev, imageUrl: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com/image.jpg"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Used only if you do not upload a file above.
                </p>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Information</h2>
            <div className="text-sm text-gray-600 space-y-2">
              <p>• Your contact information will be displayed to potential buyers</p>
              <p>• Name: {user.name}</p>
              <p>• Telegram: {user.telegram}</p>
              <p>• Phone: {user.phoneNumber}</p>
              <p>• Email: {user.email}</p>
            </div>
          </div>

          {/* Guidelines */}
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
            <h3 className="text-lg font-medium text-blue-900 mb-3">Posting Guidelines</h3>
            <div className="text-sm text-blue-800 space-y-1">
              <p>• Be honest about the condition of your item</p>
              <p>• Include clear photos if possible</p>
              <p>• Set a fair price for your item</p>
              <p>• Meet in safe, public locations</p>
              <p>• Be respectful and professional in communications</p>
              <p>• Report any suspicious activity to admins</p>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.push('/marketplace')}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || uploadingImage}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              {uploadingImage
                ? "Uploading image..."
                : loading
                  ? "Posting..."
                  : "Post Item"}
            </button>
          </div>
        </form>
      </div>

      {fxModalOpen && sgdIdrQuote && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close exchange details"
            onClick={() => setFxModalOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="fx-modal-title"
            className="relative z-10 w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-xl"
          >
            <h2
              id="fx-modal-title"
              className="text-lg font-semibold text-gray-900"
            >
              IDR estimate details
            </h2>
            <div className="mt-4 space-y-3 text-sm text-gray-700">
              <p>
                <span className="font-medium text-gray-900">≈ Rp </span>
                {idrEquivalent !== null ? formatIdr(idrEquivalent) : "—"}{" "}
                <span className="text-gray-500">
                  (from your price in SGD × rate)
                </span>
              </p>
              <p>
                <span className="font-medium text-gray-900">1 SGD ≈ </span>
                {formatRate(sgdIdrQuote.idrPerSgd)} IDR
              </p>
              <p>
                <span className="font-medium text-gray-900">
                  Rate last updated (your time):
                </span>{" "}
                {formatFxDateLong(sgdIdrQuote.updatedAt)}
              </p>
              {sgdIdrQuote.nextUpdateAt && (
                <p>
                  <span className="font-medium text-gray-900">
                    Next data refresh (your time):
                  </span>{" "}
                  {formatFxDateLong(sgdIdrQuote.nextUpdateAt)}
                </p>
              )}
              <p className="text-gray-600">{sgdIdrQuote.sourceLabel}</p>
              <p className="text-gray-600">
                Bank counters (e.g.{" "}
                <a
                  href="https://www.ocbc.com/personal-banking/fx-rates.page"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-700 underline"
                >
                  OCBC
                </a>
                ) or{" "}
                <a
                  href="https://www.google.com/finance/quote/SGD-IDR"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-700 underline"
                >
                  Google Finance
                </a>{" "}
                may show different rates — this is indicative only.
              </p>
              <p>
                <span className="font-medium text-gray-900">Source: </span>
                <a
                  href={sgdIdrQuote.providerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-700 underline"
                >
                  ExchangeRate-API
                </a>
                {sgdIdrQuote.documentationUrl ? (
                  <>
                    {" · "}
                    <a
                      href={sgdIdrQuote.documentationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-700 underline"
                    >
                      Documentation
                    </a>
                  </>
                ) : null}
                {sgdIdrQuote.termsUrl ? (
                  <>
                    {" · "}
                    <a
                      href={sgdIdrQuote.termsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-700 underline"
                    >
                      Terms of use
                    </a>
                  </>
                ) : null}
              </p>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setFxModalOpen(false)}
                className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
