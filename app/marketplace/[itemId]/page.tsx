"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useParams, usePathname } from "next/navigation";
import { useAuth } from "@/lib/contexts/AuthContext";
import { buildLoginUrl } from "@/lib/login-callback";
import { DescriptionContent } from "@/app/components/DescriptionContent";
import { MAX_MARKETPLACE_IMAGES, galleryImageUrls } from "@/lib/marketplace-images";
import { MARKETPLACE_CONDITION_OPTIONS } from "@/lib/constants/marketplace-conditions";
import { uploadMarketplaceImage } from "@/lib/firebase/upload-marketplace-image";
import { deleteMarketplaceImageByUrl } from "@/lib/firebase/delete-marketplace-image";
import {
  prepareMarketplaceListingImage,
  FORM_FILE_MAX_SOURCE_BYTES,
} from "@/lib/forms/form-file-prepare";
import { ImageCropModal } from "@/app/components/ImageCropModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Button } from "@/app/components/ui/button";
import { Checkbox } from "@/app/components/ui/checkbox";

type SgdIdrQuote = {
  idrPerSgd: number;
  updatedAt: string | null;
  nextUpdateAt?: string | null;
  sourceLabel?: string;
};

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
  imageDisplayMode?: "collage" | "carousel";
  createdAt: string;
  updatedAt: string;
}

type EditableImageSlot =
  | { type: "existing"; url: string }
  | { type: "new"; file: File; preview: string; replacedUrl?: string };

export default function MarketplaceItemDetailPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [item, setItem] = useState<MarketplaceItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<MarketplaceItem>>({});
  const [sgdIdrQuote, setSgdIdrQuote] = useState<SgdIdrQuote | null>(null);
  const [sgdIdrError, setSgdIdrError] = useState<string | null>(null);
  const [sgdIdrLoading, setSgdIdrLoading] = useState(false);
  const [fxModalOpen, setFxModalOpen] = useState(false);
  const [galleryMode, setGalleryMode] = useState<"collage" | "carousel">(
    "collage"
  );
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [editImageSlots, setEditImageSlots] = useState<EditableImageSlot[]>([]);
  const [submittingImages, setSubmittingImages] = useState(false);
  const replaceImageIndexRef = useRef<number | null>(null);
  const [cropOpen, setCropOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const cropSrcRef = useRef<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

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
            updatedAt: data.updatedAt ?? null,
            nextUpdateAt: data.nextUpdateAt ?? null,
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
    return () => {
      if (cropSrcRef.current) {
        URL.revokeObjectURL(cropSrcRef.current);
      }
      editImageSlots.forEach((slot) => {
        if (slot.type === "new") {
          URL.revokeObjectURL(slot.preview);
        }
      });
    };
  }, [editImageSlots]);

  useEffect(() => {
    if (!item) return;
    setGalleryMode(item.imageDisplayMode ?? "collage");
  }, [item]);

  useEffect(() => {
    if (!item) return;
    const len = galleryImageUrls(item).length;
    if (len === 0) {
      setCarouselIndex(0);
      return;
    }
    if (carouselIndex >= len) {
      setCarouselIndex(0);
    }
  }, [item, carouselIndex]);

  const fetchItem = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/marketplace/${itemId}`);

      if (response.ok) {
        const data = await response.json();
        setItem(data.item);
        if (typeof window !== "undefined") {
          sessionStorage.removeItem(`pinus-marketplace-item-ise-${itemId}`);
        }
      } else {
        const errorData = await response.json();
        const message = errorData.error || "Failed to fetch item";
        if (
          typeof window !== "undefined" &&
          message.toLowerCase().includes("internal server error")
        ) {
          const key = `pinus-marketplace-item-ise-${itemId}`;
          if (!sessionStorage.getItem(key)) {
            sessionStorage.setItem(key, "1");
            window.location.reload();
            return;
          }
          sessionStorage.removeItem(key);
          router.replace("/marketplace");
          return;
        }
        setError(message);
      }
    } catch (error) {
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const clearEditImagePreviews = (slots: EditableImageSlot[]) => {
    slots.forEach((slot) => {
      if (slot.type === "new") {
        URL.revokeObjectURL(slot.preview);
      }
    });
  };

  const beginEditing = () => {
    if (!item) return;
    setSuccess(null);
    setError(null);
    setEditData({});
    setEditImageSlots(
      galleryImageUrls(item).map((url) => ({ type: "existing", url }))
    );
    setIsEditing(true);
  };

  const cancelEditing = () => {
    clearEditImagePreviews(editImageSlots);
    setEditImageSlots([]);
    setIsEditing(false);
    setEditData({});
    replaceImageIndexRef.current = null;
    if (cropSrcRef.current) {
      URL.revokeObjectURL(cropSrcRef.current);
      cropSrcRef.current = null;
    }
    setCropSrc(null);
    setCropOpen(false);
  };

  const onEditImageFileSelected = (f: File | null) => {
    if (!f) return;
    if (
      replaceImageIndexRef.current === null &&
      editImageSlots.length >= MAX_MARKETPLACE_IMAGES
    ) {
      setError(`You can add at most ${MAX_MARKETPLACE_IMAGES} photos.`);
      return;
    }
    if (!/^image\/(jpeg|png|gif|webp)$/i.test(f.type)) {
      setError("Please choose a JPEG, PNG, GIF, or WebP image.");
      return;
    }
    if (f.size > FORM_FILE_MAX_SOURCE_BYTES) {
      setError("Image must be 3 MB or smaller.");
      return;
    }
    setError(null);
    if (cropSrcRef.current) {
      URL.revokeObjectURL(cropSrcRef.current);
      cropSrcRef.current = null;
    }
    const url = URL.createObjectURL(f);
    cropSrcRef.current = url;
    setCropSrc(url);
    setCropOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item || !user?.id) return;

    setSubmitting(true);
    setSubmittingImages(false);
    setError(null);

    const originalImageUrls = galleryImageUrls(item);
    const uploadedUrlsThisAttempt: string[] = [];

    try {
      const nextImageUrls: string[] = [];
      if (editImageSlots.length > 0) {
        setSubmittingImages(true);
        for (const slot of editImageSlots) {
          if (slot.type === "existing") {
            nextImageUrls.push(slot.url);
            continue;
          }
          const prepared = await prepareMarketplaceListingImage(slot.file);
          const uploadedUrl = await uploadMarketplaceImage(
            prepared.blob,
            prepared.filename,
            prepared.contentType,
            user.id
          );
          uploadedUrlsThisAttempt.push(uploadedUrl);
          nextImageUrls.push(uploadedUrl);
        }
      }

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
          imageUrls: nextImageUrls,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const deletedCandidates = originalImageUrls.filter(
          (u) => !nextImageUrls.includes(u)
        );
        await Promise.allSettled(
          deletedCandidates.map((u) => deleteMarketplaceImageByUrl(u))
        );
        clearEditImagePreviews(editImageSlots);
        setItem(data.item);
        setIsEditing(false);
        setEditData({});
        setEditImageSlots([]);
        setSuccess("Item updated successfully!");
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to update item");
        await Promise.allSettled(
          uploadedUrlsThisAttempt.map((u) => deleteMarketplaceImageByUrl(u))
        );
      }
    } catch (error) {
      setError("Network error occurred");
      await Promise.allSettled(
        uploadedUrlsThisAttempt.map((u) => deleteMarketplaceImageByUrl(u))
      );
    } finally {
      setSubmitting(false);
      setSubmittingImages(false);
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

  const formatIdr = (n: number) =>
    new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(
      Math.round(n)
    );

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
    if (!utcString) return "-";
    const d = new Date(utcString);
    if (Number.isNaN(d.getTime())) return utcString;
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(d);
  };

  const formatRate = (n: number) =>
    new Intl.NumberFormat("en-SG", { maximumFractionDigits: 2 }).format(n);

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

  const idrEquivalent =
    sgdIdrQuote && Number.isFinite(item.price) && item.price > 0
      ? item.price * sgdIdrQuote.idrPerSgd
      : null;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button
            type="button"
            variant="black"
            outline
            onClick={() => router.push("/marketplace")}
          >
            ← Back to Marketplace
          </Button>
          {canEditItem && (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="blue"
                onClick={() => (isEditing ? cancelEditing() : beginEditing())}
              >
                {isEditing ? "Cancel Edit" : "Edit Item"}
              </Button>
              <Button type="button" variant="red" onClick={handleDelete}>
                Delete Item
              </Button>
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
                  <Checkbox
                    checked={
                      editData.descriptionMarkdown ??
                      item.descriptionMarkdown ??
                      false
                    }
                    onCheckedChange={(c) =>
                      setEditData((prev) => ({
                        ...prev,
                        descriptionMarkdown: c === true,
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
                  <Select
                    value={editData.status || item.status}
                    onValueChange={(v) =>
                      setEditData((prev) => ({
                        ...prev,
                        status: v as MarketplaceItem["status"],
                      }))
                    }
                  >
                    <SelectTrigger
                      variant="blue"
                      outline
                      rounding="lg"
                      className="w-full"
                    >
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent variant="blue" outline rounding="lg">
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="reserved">Reserved</SelectItem>
                      <SelectItem value="sold">Sold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Condition
                </label>
                <Select
                  value={
                    editData.condition !== undefined
                      ? editData.condition
                      : item.condition ?? "Other"
                  }
                  onValueChange={(v) =>
                    setEditData((prev) => ({
                      ...prev,
                      condition: v,
                    }))
                  }
                >
                  <SelectTrigger
                    variant="blue"
                    outline
                    rounding="lg"
                    className="w-full"
                  >
                    <SelectValue placeholder="Condition" />
                  </SelectTrigger>
                  <SelectContent variant="blue" outline rounding="lg">
                    {MARKETPLACE_CONDITION_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image display
                </label>
                <Select
                  value={
                    (editData.imageDisplayMode as "collage" | "carousel") ??
                    item.imageDisplayMode ??
                    "collage"
                  }
                  onValueChange={(v) =>
                    setEditData((prev) => ({
                      ...prev,
                      imageDisplayMode: v as "collage" | "carousel",
                    }))
                  }
                >
                  <SelectTrigger
                    variant="blue"
                    outline
                    rounding="lg"
                    className="w-full"
                  >
                    <SelectValue placeholder="Image display" />
                  </SelectTrigger>
                  <SelectContent variant="blue" outline rounding="lg">
                    <SelectItem value="collage">Collage grid</SelectItem>
                    <SelectItem value="carousel">Carousel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                <p className="mb-2 text-sm font-medium text-slate-800">
                  Photos (up to {MAX_MARKETPLACE_IMAGES})
                </p>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="sr-only"
                  tabIndex={-1}
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    e.target.value = "";
                    onEditImageFileSelected(f);
                  }}
                />
                {editImageSlots.length > 0 && (
                  <div className="mb-3 grid gap-3 sm:grid-cols-2">
                    {editImageSlots.map((slot, index) => {
                      const preview =
                        slot.type === "existing" ? slot.url : slot.preview;
                      return (
                        <div
                          key={`${preview}-${index}`}
                          className="rounded-lg border border-slate-200 bg-white p-3"
                        >
                          <p className="mb-2 text-xs text-slate-500">
                            Photo {index + 1}
                          </p>
                          <img
                            src={preview}
                            alt=""
                            className="max-h-44 w-full rounded object-contain"
                          />
                          <div className="mt-2 flex flex-wrap gap-2">
                            <Button
                              type="button"
                              variant="blue"
                              outline
                              size="sm"
                              onClick={() => {
                                replaceImageIndexRef.current = index;
                                imageInputRef.current?.click();
                              }}
                            >
                              Change
                            </Button>
                            <Button
                              type="button"
                              variant="red"
                              outline
                              size="sm"
                              onClick={() => {
                                setEditImageSlots((prev) => {
                                  const next = [...prev];
                                  const [removed] = next.splice(index, 1);
                                  if (removed?.type === "new") {
                                    URL.revokeObjectURL(removed.preview);
                                  }
                                  return next;
                                });
                              }}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {editImageSlots.length < MAX_MARKETPLACE_IMAGES && (
                  <Button
                    type="button"
                    variant="blue"
                    outline
                    size="sm"
                    onClick={() => {
                      replaceImageIndexRef.current = null;
                      imageInputRef.current?.click();
                    }}
                  >
                    {editImageSlots.length === 0
                      ? "Add photo"
                      : "Add another photo"}
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                <Button type="submit" variant="blue" disabled={submitting}>
                  {submittingImages
                    ? "Uploading photos..."
                    : submitting
                      ? "Saving..."
                      : "Save Changes"}
                </Button>
                <Button
                  type="button"
                  variant="black"
                  outline
                  onClick={cancelEditing}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Item Details */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {itemGallery.length > 0 && galleryMode === "carousel" ? (
            <div className="bg-gray-100">
              <div className="relative">
                <img
                  src={itemGallery[carouselIndex]}
                  alt=""
                  className="h-72 w-full object-contain sm:h-96"
                />
                {itemGallery.length > 1 && (
                  <>
                    <button
                      type="button"
                      className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/55 px-3 py-2 text-sm font-bold text-white"
                      onClick={() =>
                        setCarouselIndex((idx) =>
                          idx === 0 ? itemGallery.length - 1 : idx - 1
                        )
                      }
                      aria-label="Previous image"
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/55 px-3 py-2 text-sm font-bold text-white"
                      onClick={() =>
                        setCarouselIndex((idx) => (idx + 1) % itemGallery.length)
                      }
                      aria-label="Next image"
                    >
                      ›
                    </button>
                  </>
                )}
              </div>
              {itemGallery.length > 1 && (
                <div className="flex flex-wrap items-center justify-center gap-2 px-4 pb-3 pt-2">
                  {itemGallery.map((url, idx) => (
                    <button
                      key={`${url}-${idx}`}
                      type="button"
                      className={`h-2.5 w-2.5 rounded-full ${
                        idx === carouselIndex ? "bg-blue-600" : "bg-gray-300"
                      }`}
                      onClick={() => setCarouselIndex(idx)}
                      aria-label={`Go to image ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : itemGallery.length > 0 ? (
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
          ) : null}

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
                {item.price > 0 && (
                  <div className="mt-1 space-y-0.5 text-sm text-gray-600">
                    {sgdIdrLoading && (
                      <p className="text-gray-500">IDR estimate…</p>
                    )}
                    {!sgdIdrLoading && sgdIdrError && (
                      <p className="text-xs text-amber-800">{sgdIdrError}</p>
                    )}
                    {!sgdIdrLoading && idrEquivalent !== null && sgdIdrQuote && (
                      <p className="text-sm leading-snug">
                        ≈ Rp {formatIdr(idrEquivalent)}{" "}
                        <span className="text-gray-500">
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
                )}
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
                  <div className="flex justify-between gap-2">
                    <span className="shrink-0 text-gray-600">Price:</span>
                    <span className="text-right font-medium">
                      <span className="block">{formatPrice(item.price)}</span>
                      {item.price > 0 &&
                        !sgdIdrLoading &&
                        idrEquivalent !== null &&
                        sgdIdrQuote && (
                          <span className="block text-xs font-normal text-gray-600">
                            ≈ Rp {formatIdr(idrEquivalent)}{" "}
                            <button
                              type="button"
                              onClick={() => setFxModalOpen(true)}
                              className="text-blue-600 hover:text-blue-800 underline font-medium"
                            >
                              see more
                            </button>
                          </span>
                        )}
                      {item.price > 0 && sgdIdrLoading && (
                        <span className="block text-xs font-normal text-gray-500">
                          IDR estimate…
                        </span>
                      )}
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
                        : "-"}
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

      <ImageCropModal
        imageSrc={cropSrc}
        open={cropOpen}
        title="Adjust listing photo"
        outputFileName="listing-photo.jpg"
        onCancel={() => {
          replaceImageIndexRef.current = null;
          setCropOpen(false);
          if (cropSrcRef.current) {
            URL.revokeObjectURL(cropSrcRef.current);
            cropSrcRef.current = null;
          }
          setCropSrc(null);
        }}
        onComplete={(file) => {
          const preview = URL.createObjectURL(file);
          const idx = replaceImageIndexRef.current;
          replaceImageIndexRef.current = null;
          if (idx !== null) {
            setEditImageSlots((prev) => {
              const next = [...prev];
              const old = next[idx];
              if (old?.type === "new") URL.revokeObjectURL(old.preview);
              next[idx] = {
                type: "new",
                file,
                preview,
                replacedUrl: old?.type === "existing" ? old.url : old?.replacedUrl,
              };
              return next;
            });
          } else {
            setEditImageSlots((prev) => {
              if (prev.length >= MAX_MARKETPLACE_IMAGES) {
                URL.revokeObjectURL(preview);
                return prev;
              }
              return [...prev, { type: "new", file, preview }];
            });
          }
          setCropOpen(false);
          if (cropSrcRef.current) {
            URL.revokeObjectURL(cropSrcRef.current);
            cropSrcRef.current = null;
          }
          setCropSrc(null);
          setError(null);
        }}
      />

      {fxModalOpen && sgdIdrQuote && idrEquivalent !== null && (
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
            aria-labelledby="fx-modal-title-item"
            className="relative z-10 w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-xl"
          >
            <h2
              id="fx-modal-title-item"
              className="text-lg font-semibold text-gray-900"
            >
              IDR estimate details
            </h2>
            <div className="mt-4 space-y-3 text-sm text-gray-700">
              <p>
                <span className="font-medium text-gray-900">≈ Rp </span>
                {formatIdr(idrEquivalent)}{" "}
                <span className="text-gray-500">
                  (from the listing price in SGD × rate)
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
                may show different rates - this is indicative only.
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
