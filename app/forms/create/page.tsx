"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { buildLoginUrl } from "@/lib/login-callback";
import { useAuth } from "@/lib/contexts/AuthContext";
import type { FormFieldDefinition } from "@/lib/form-field-types";
import {
  createDefaultPage,
  type FormPageDefinition,
  type FormTheme,
  FORM_THEMES,
} from "@/lib/forms/form-pages";
import { FormFieldsEditor } from "@/app/components/forms/FormFieldsEditor";
import { FormPagesManager } from "@/app/components/forms/FormPagesManager";
import { FormSelect } from "@/app/components/forms/FormSelect";
import { uploadFormHeaderImage } from "@/lib/firebase/upload-form-header";
import {
  prepareFormFileForUpload,
  FORM_FILE_MAX_SOURCE_BYTES,
} from "@/lib/forms/form-file-prepare";
import { FORM_HEADER_IMAGE_CROP_ASPECT } from "@/lib/forms/form-header-aspect";
import { ImageCropModal } from "@/app/components/ImageCropModal";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Button } from "@/app/components/ui/button";
import { Checkbox } from "@/app/components/ui/checkbox";

type FormField = FormFieldDefinition;

interface FormData {
  title: string;
  description: string;
  /** When true, description is rendered as Markdown on the form page. */
  descriptionMarkdown: boolean;
  fields: FormField[];
  pages: FormPageDefinition[];
  theme: FormTheme;
  headerImageUrl: string;
  managers: string[];
  /** Optional short path segment for /f/{shortLink} */
  shortLink: string;
}

export default function CreateFormPage() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    descriptionMarkdown: false,
    fields: [],
    pages: [createDefaultPage()],
    theme: "blue",
    headerImageUrl: "",
    managers: [],
    shortLink: '',
  });
  const [headerUploading, setHeaderUploading] = useState(false);
  const [headerCropOpen, setHeaderCropOpen] = useState(false);
  const [headerCropSrc, setHeaderCropSrc] = useState<string | null>(null);
  const headerCropSrcRef = useRef<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [potentialManagers, setPotentialManagers] = useState<Array<{
    id: string;
    name: string;
    email: string;
  }>>([]);

  const { user, canCreateForms, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (authLoading) return;
    // Redirect if not authenticated
    if (!user) {
      router.push(buildLoginUrl(pathname));
      return;
    }

    // Allow access if user is super admin OR has canCreateForms permission
    if (!user.isSuperAdmin && !canCreateForms()) {
      router.push("/forms");
      return;
    }

    // Fetch potential managers
    fetchPotentialManagers();
  }, [user, canCreateForms, router, pathname]);

  const fetchPotentialManagers = async () => {
    try {
      const response = await fetch('/api/forms/managers');
      if (response.ok) {
        const data = await response.json();
        setPotentialManagers(data.managers);
      }
    } catch (error) {
      console.error('Error fetching potential managers:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.fields.length === 0) {
      setError('At least one field is required');
      return;
    }

    for (const field of formData.fields) {
      if (field.type === "section") {
        const mode = field.sectionDisplay ?? "both";
        const title = (field.sectionTitle ?? "").trim();
        const desc = (field.sectionDescription ?? "").trim();
        if (mode === "title_only" && !title) {
          setError("Section (title only) needs a section title");
          return;
        }
        if (mode === "description_only" && !desc) {
          setError("Section (description only) needs a section description");
          return;
        }
        if (mode === "both" && !title && !desc) {
          setError("Section needs a title and/or description");
          return;
        }
        if (!field.label.trim()) {
          setError("All fields must have a label (used as an internal name)");
          return;
        }
        continue;
      }

      if (!field.label.trim()) {
        setError("All fields must have a label");
        return;
      }

      if (
        (field.type === "dropdown" || field.type === "multiple_choice") &&
        (!field.options || field.options.filter((o) => o.trim()).length === 0)
      ) {
        setError(
          "Dropdown and multiple-choice fields need at least one option"
        );
        return;
      }

    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/forms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          descriptionMarkdown: formData.descriptionMarkdown,
          fields: formData.fields,
          pages: formData.pages,
          theme: formData.theme,
          ...(formData.headerImageUrl.trim()
            ? { headerImageUrl: formData.headerImageUrl.trim() }
            : {}),
          managers: formData.managers,
          ...(formData.shortLink.trim()
            ? { shortLink: formData.shortLink.trim() }
            : {}),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/forms/${data.form.id}`);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create form');
      }
    } catch (error) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

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
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Create New Form</h1>
          <button
            onClick={() => router.push('/forms')}
            className="text-gray-600 hover:text-gray-900 font-medium"
          >
            ← Back to Forms
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Form Basic Info */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Form Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Form title
                </label>
                <Input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Optional — shown to respondents"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={3}
                  placeholder="Enter form description (optional)"
                />
                <label className="mt-2 flex cursor-pointer items-center gap-2">
                  <Checkbox
                    checked={formData.descriptionMarkdown}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({
                        ...prev,
                        descriptionMarkdown: checked === true,
                      }))
                    }
                  />
                  <span className="text-sm text-gray-700">
                    Format description as Markdown (headings, lists, links, etc.)
                  </span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Short link (optional)
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Share <code className="rounded bg-gray-100 px-1">/f/&lt;slug&gt;</code>{" "}
                  instead of the long form URL. Letters, numbers, and hyphens
                  only. If the slug is taken, a suffix like{" "}
                  <span className="font-mono">my-form-2</span> is added
                  automatically.
                </p>
                <Input
                  type="text"
                  value={formData.shortLink}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      shortLink: e.target.value,
                    }))
                  }
                  placeholder="e.g. form1"
                  className="font-mono"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Colour theme
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Accent colour for the form participants see (PINUS logo
                  palette).
                </p>
                <FormSelect
                  value={formData.theme}
                  onValueChange={(v) =>
                    setFormData((prev) => ({
                      ...prev,
                      theme: v as FormTheme,
                    }))
                  }
                  options={FORM_THEMES}
                  placeholder="Theme"
                  className="max-w-xs"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Header image (optional)
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Shown at the top of the form. Paste an HTTPS URL, or upload -
                  you&apos;ll crop a wide banner (21∶9), same rules as marketplace
                  photos: up to 1 MB as-is; larger (up to 3 MB) compressed.
                </p>
                <Input
                  type="url"
                  value={formData.headerImageUrl}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      headerImageUrl: e.target.value,
                    }))
                  }
                  placeholder="https://…"
                  className="mb-2"
                />
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="text-sm text-gray-600"
                  disabled={headerUploading || !user || headerCropOpen}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    e.target.value = "";
                    if (!f || !user) return;
                    if (!/^image\/(jpeg|png|gif|webp)$/i.test(f.type)) {
                      setError(
                        "Please choose a JPEG, PNG, GIF, or WebP image."
                      );
                      return;
                    }
                    if (f.size > FORM_FILE_MAX_SOURCE_BYTES) {
                      setError("Image must be 3 MB or smaller.");
                      return;
                    }
                    setError(null);
                    if (headerCropSrcRef.current) {
                      URL.revokeObjectURL(headerCropSrcRef.current);
                      headerCropSrcRef.current = null;
                    }
                    const url = URL.createObjectURL(f);
                    headerCropSrcRef.current = url;
                    setHeaderCropSrc(url);
                    setHeaderCropOpen(true);
                  }}
                />
                {headerUploading && (
                  <p className="text-xs text-gray-500 mt-1">Uploading…</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <FormPagesManager
              pages={formData.pages}
              onChange={(pages) =>
                setFormData((prev) => ({ ...prev, pages }))
              }
              onRemovePage={(removedId, remaining) => {
                const target = remaining[0]?.id;
                if (!target) return;
                setFormData((prev) => ({
                  ...prev,
                  fields: prev.fields.map((field) =>
                    field.pageId === removedId
                      ? { ...field, pageId: target }
                      : field
                  ),
                }));
              }}
            />
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <FormFieldsEditor
              fields={formData.fields}
              onChange={(fields) =>
                setFormData((prev) => ({ ...prev, fields }))
              }
              pages={formData.pages}
            />
          </div>

          {/* Manager Selection */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Form Managers (Optional)</h2>
            <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-300 rounded-md p-3">
              {potentialManagers.map((manager) => (
                <div key={manager.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`create-mgr-${manager.id}`}
                    checked={formData.managers.includes(manager.id)}
                    onCheckedChange={(checked) => {
                      if (checked === true) {
                        setFormData((prev) => ({
                          ...prev,
                          managers: [...prev.managers, manager.id],
                        }));
                      } else {
                        setFormData((prev) => ({
                          ...prev,
                          managers: prev.managers.filter(
                            (id) => id !== manager.id
                          ),
                        }));
                      }
                    }}
                  />
                  <label
                    htmlFor={`create-mgr-${manager.id}`}
                    className="text-sm cursor-pointer"
                  >
                    {manager.name} ({manager.email})
                  </label>
                </div>
              ))}
              {potentialManagers.length === 0 && (
                <p className="text-sm text-gray-500 italic">
                  No potential managers found. Only users with form creation permission can be managers.
                </p>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Managers can view responses and edit this form.
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="black"
              outline
              onClick={() => router.push("/forms")}
            >
              Cancel
            </Button>
            <Button type="submit" variant="blue" disabled={loading}>
              {loading ? "Creating..." : "Create Form"}
            </Button>
          </div>
        </form>
      </div>

      <ImageCropModal
        imageSrc={headerCropSrc}
        open={headerCropOpen}
        aspect={FORM_HEADER_IMAGE_CROP_ASPECT}
        title="Adjust header banner"
        description="Wide banner (21∶9). Drag to position and zoom. Same rules as marketplace listing photos."
        outputFileName="form-header.jpg"
        completeLabel="Use this image"
        onCancel={() => {
          setHeaderCropOpen(false);
          if (headerCropSrcRef.current) {
            URL.revokeObjectURL(headerCropSrcRef.current);
            headerCropSrcRef.current = null;
          }
          setHeaderCropSrc(null);
        }}
        onComplete={async (file) => {
          setHeaderCropOpen(false);
          if (headerCropSrcRef.current) {
            URL.revokeObjectURL(headerCropSrcRef.current);
            headerCropSrcRef.current = null;
          }
          setHeaderCropSrc(null);
          if (!user) return;
          setHeaderUploading(true);
          setError(null);
          try {
            const prepared = await prepareFormFileForUpload(file, {
              acceptedTypes: ["jpeg", "png", "gif", "webp"],
            });
            const url = await uploadFormHeaderImage(
              prepared.blob,
              prepared.filename,
              prepared.contentType,
              "draft",
              user.id
            );
            setFormData((prev) => ({ ...prev, headerImageUrl: url }));
          } catch (err) {
            setError(
              err instanceof Error ? err.message : "Upload failed"
            );
          } finally {
            setHeaderUploading(false);
          }
        }}
      />
    </div>
  );
}
