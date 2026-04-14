'use client';

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
import { buildLoginUrl } from "@/lib/login-callback";
import { useAuth } from "@/lib/contexts/AuthContext";
import Link from "next/link";
import type { FormFieldDefinition } from "@/lib/form-field-types";
import { isDataField } from "@/lib/form-field-types";
import { isEmptyValue, validateFieldValue } from "@/lib/forms/validate-submission";
import { FormDateField } from "@/app/components/forms/FormDateField";
import { FormFieldsEditor } from "@/app/components/forms/FormFieldsEditor";
import { FormSelect } from "@/app/components/forms/FormSelect";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Button } from "@/app/components/ui/button";
import { Checkbox } from "@/app/components/ui/checkbox";
import { DescriptionContent } from "@/app/components/DescriptionContent";
import { validateFormFieldsArray } from "@/lib/forms/validate-form-fields";
import { format, parseISO } from "date-fns";
import {
  prepareFormFileForUpload,
  FORM_FILE_MAX_SOURCE_BYTES,
  isPdfFile,
} from "@/lib/forms/form-file-prepare";
import {
  isFileAccepted,
  buildAcceptHtmlAttribute,
  acceptedTypesSummary,
} from "@/lib/forms/file-accepted";
import { uploadFormAttachment } from "@/lib/firebase/upload-form-attachment";
import { FormAttachmentViewer } from "@/app/components/forms/FormAttachmentViewer";
import { FormFilePendingPreview } from "@/app/components/forms/FormFilePendingPreview";
import { ImageCropModal } from "@/app/components/ImageCropModal";
import type { FormPageDefinition, FormTheme } from "@/lib/forms/form-pages";
import {
  createDefaultPage,
  fieldsOnPage,
  resolveNextPageIndex,
  FORM_THEMES,
} from "@/lib/forms/form-pages";
import { formThemeClass } from "@/lib/forms/form-theme-styles";
import { FORM_HEADER_IMAGE_CROP_ASPECT } from "@/lib/forms/form-header-aspect";
import { FormPagesManager } from "@/app/components/forms/FormPagesManager";
import { uploadFormHeaderImage } from "@/lib/firebase/upload-form-header";

type FormField = FormFieldDefinition;

interface Form {
  id: string;
  title: string;
  description?: string;
  descriptionMarkdown?: boolean;
  createdBy: {
    name: string;
    email: string;
  };
  managers?: Array<{
    _id?: string;
    id?: string;
    name: string;
    email: string;
  }>;
  fields: FormField[];
  pages?: FormPageDefinition[];
  theme?: FormTheme;
  headerImageUrl?: string | null;
  responseCount: number;
  isActive: boolean;
  isShared?: boolean;
  userHasSubmitted?: boolean;
  mySubmission?: {
    responses: Array<{ fieldLabel: string; value: unknown }>;
    submittedAt: string;
  } | null;
  createdAt: string;
  updatedAt: string;
  slug?: string | null;
  userPermissions?: {
    canEdit: boolean;
    canViewResponses: boolean;
    canFill: boolean;
  };
}

interface FormResponse {
  fieldLabel: string;
  value: string | number | boolean | string[];
}

function defaultValueForField(field: FormField): FormResponse["value"] {
  switch (field.type) {
    case "checkbox":
      return false;
    case "multiple_choice":
      return [];
    default:
      return "";
  }
}

function formatSubmittedAnswer(field: FormField, value: unknown): string {
  if (value === null || value === undefined) return "-";
  switch (field.type) {
    case "checkbox":
      return value ? "Yes" : "No";
    case "multiple_choice":
      return Array.isArray(value) ? (value as string[]).join(", ") : String(value);
    case "date": {
      const mode = field.dateMode ?? "date";
      const s = String(value);
      if (mode === "time") return s;
      if (mode === "date") {
        try {
          return format(parseISO(`${s}T12:00:00`), "PPP");
        } catch {
          return s;
        }
      }
      try {
        return format(parseISO(s), "PPP p");
      } catch {
        return s;
      }
    }
    default:
      return String(value);
  }
}

export default function FormDetailPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<Form | null>(null);
  const [responses, setResponses] = useState<FormResponse[]>([]);
  /** Pending files for file_upload fields (uploaded on submit). */
  const [pendingFiles, setPendingFiles] = useState<Record<string, File | null>>({});
  const [fileCropOpen, setFileCropOpen] = useState(false);
  const [fileCropSrc, setFileCropSrc] = useState<string | null>(null);
  const [fileCropFieldLabel, setFileCropFieldLabel] = useState<string | null>(
    null
  );
  const fileCropSrcRef = useRef<string | null>(null);
  /** One hidden file input per row index for file_upload fields (change / replace). */
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [fillStep, setFillStep] = useState(0);
  const [headerUploading, setHeaderUploading] = useState(false);
  const [headerCropOpen, setHeaderCropOpen] = useState(false);
  const [headerCropSrc, setHeaderCropSrc] = useState<string | null>(null);
  const headerCropSrcRef = useRef<string | null>(null);
  const headerFileInputRef = useRef<HTMLInputElement>(null);
  /** Local preview blob URL while uploading or right after crop (revoked when replaced). */
  const [headerBlobPreviewUrl, setHeaderBlobPreviewUrl] = useState<string | null>(
    null
  );
  const [editData, setEditData] = useState<{
    title?: string;
    description?: string;
    descriptionMarkdown?: boolean;
    fields?: FormField[];
    pages?: FormPageDefinition[];
    theme?: FormTheme;
    headerImageUrl?: string;
    isActive?: boolean;
    shortLink?: string;
  }>({});
  const [potentialManagers, setPotentialManagers] = useState<Array<{
    id: string;
    name: string;
    email: string;
  }>>([]);
  const [selectedManagers, setSelectedManagers] = useState<string[]>([]);
  const [shareBusy, setShareBusy] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareCopiedKind, setShareCopiedKind] = useState<"long" | "short" | null>(
    null
  );

  const { user, loading: authLoading, canCreateForms } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const formId = params.formId as string;

  useEffect(() => {
    // Wait for auth to complete before checking user
    if (authLoading) return;

    // Redirect to login if not authenticated
    if (!user) {
      router.push(buildLoginUrl(pathname));
      return;
    }

    // Fetch form details and potential managers
    fetchForm();
    fetchPotentialManagers();
  }, [user, authLoading, router, formId, pathname]);

  useEffect(() => {
    if (!shareModalOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShareModalOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [shareModalOpen]);

  useEffect(() => {
    return () => {
      if (fileCropSrcRef.current) {
        URL.revokeObjectURL(fileCropSrcRef.current);
        fileCropSrcRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!fileCropOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setFileCropOpen(false);
      if (fileCropSrcRef.current) {
        URL.revokeObjectURL(fileCropSrcRef.current);
        fileCropSrcRef.current = null;
      }
      setFileCropSrc(null);
      setFileCropFieldLabel(null);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [fileCropOpen]);

  const fetchForm = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/forms/${formId}`);
      
      if (response.ok) {
        const data = await response.json();
        setForm(data.form);
        setFillStep(0);

        const map = new Map<string, unknown>();
        if (data.form.mySubmission?.responses?.length) {
          for (const r of data.form.mySubmission.responses) {
            map.set(r.fieldLabel, r.value);
          }
        }

        const initialResponses: FormResponse[] = data.form.fields
          .filter((field: FormField) => isDataField(field))
          .map((field: FormField) => ({
            fieldLabel: field.label,
            value: map.has(field.label)
              ? (map.get(field.label) as FormResponse["value"])
              : defaultValueForField(field),
          }));
        setResponses(initialResponses);
        
        // Initialize selected managers
        if (data.form.managers) {
          setSelectedManagers(
            data.form.managers.map((m: { id?: string; _id?: string }) =>
              String(m._id ?? m.id ?? "")
            ).filter(Boolean)
          );
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to fetch form");
        setForm(null);
      }
    } catch (error) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchPotentialManagers = async () => {
    try {
      const response = await fetch('/api/forms/managers');
      if (response.ok) {
        const data = await response.json();
        // Filter out the current user from potential managers
        const filteredManagers = data.managers.filter((manager: { id: string }) => manager.id !== user?.id);
        setPotentialManagers(filteredManagers);
      } else {
        console.error('Failed to fetch potential managers');
      }
    } catch (error) {
      console.error('Error fetching potential managers:', error);
    }
  };

  const handleResponseChange = (
    fieldLabel: string,
    value: string | number | boolean | string[]
  ) => {
    setResponses((prev) =>
      prev.map((response) =>
        response.fieldLabel === fieldLabel ? { ...response, value } : response
      )
    );
  };

  const handleMultipleChoiceToggle = (
    fieldLabel: string,
    option: string,
    checked: boolean
  ) => {
    const fieldDef = form?.fields.find((f) => f.label === fieldLabel);
    const max =
      fieldDef?.type === "multiple_choice"
        ? fieldDef.maxSelections
        : undefined;

    setResponses((prev) =>
      prev.map((response) => {
        if (response.fieldLabel !== fieldLabel) return response;
        const cur = Array.isArray(response.value)
          ? (response.value as string[])
          : [];
        if (checked) {
          if (
            max !== undefined &&
            cur.length >= max &&
            !cur.includes(option)
          ) {
            setError(
              `You can select at most ${max} option(s) for "${fieldLabel}"`
            );
            return response;
          }
          return { ...response, value: [...cur, option] };
        }
        return {
          ...response,
          value: cur.filter((x) => x !== option),
        };
      })
    );
  };

  const startEditing = () => {
    if (!form) return;
    setEditData({
      title: form.title,
      description: form.description ?? "",
      descriptionMarkdown: form.descriptionMarkdown ?? false,
      fields: JSON.parse(JSON.stringify(form.fields)) as FormField[],
      pages: form.pages?.length
        ? (JSON.parse(JSON.stringify(form.pages)) as FormPageDefinition[])
        : [createDefaultPage()],
      theme: form.theme ?? "blue",
      headerImageUrl: form.headerImageUrl ?? "",
      isActive: form.isActive,
      shortLink: form.slug ?? "",
    });
    setSelectedManagers(
      (form.managers ?? []).map((m) => String(m._id ?? m.id ?? "")).filter(Boolean)
    );
    setIsEditing(true);
    setError(null);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;

    const fields = editData.fields ?? form.fields;
    if (!fields.length) {
      setError("At least one field is required");
      return;
    }
    const fieldsError = validateFormFieldsArray(fields);
    if (fieldsError) {
      setError(fieldsError);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/forms/${formId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: editData.title ?? form.title,
          description: editData.description,
          descriptionMarkdown:
            editData.descriptionMarkdown ?? form.descriptionMarkdown ?? false,
          fields,
          pages: editData.pages ?? form.pages,
          theme: editData.theme ?? form.theme ?? "blue",
          headerImageUrl:
            (editData.headerImageUrl ?? "").trim() === ""
              ? null
              : editData.headerImageUrl?.trim(),
          isActive: editData.isActive ?? form.isActive,
          managers: selectedManagers,
          slug:
            (editData.shortLink ?? "").trim() === ""
              ? null
              : editData.shortLink,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setForm(data.form);
        setHeaderBlobPreviewUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return null;
        });
        setIsEditing(false);
        setEditData({});
        setSuccess("Form updated successfully!");
        const map = new Map<string, unknown>();
        if (data.form.mySubmission?.responses?.length) {
          for (const r of data.form.mySubmission.responses) {
            map.set(r.fieldLabel, r.value);
          }
        }
        const initialResponses: FormResponse[] = data.form.fields
          .filter((field: FormField) => isDataField(field))
          .map((field: FormField) => ({
            fieldLabel: field.label,
            value: map.has(field.label)
              ? (map.get(field.label) as FormResponse["value"])
              : defaultValueForField(field),
          }));
        setResponses(initialResponses);
        if (data.form.managers) {
          setSelectedManagers(
            data.form.managers.map((m: { _id?: string; id?: string }) =>
              String(m._id ?? m.id ?? "")
            ).filter(Boolean)
          );
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to update form");
      }
    } catch {
      setError("Network error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const canEditForm = user && form && (
    user.isSuperAdmin || 
    user.isAdmin || 
    form.createdBy.email === user.email ||
    form.managers?.some(manager => manager.email === user.email) ||
    form.userPermissions?.canEdit
  );

  const canFillForm = user && form && form.userPermissions?.canFill;

  const isFormFiller = user && form && !form.userPermissions?.canEdit && form.userPermissions?.canFill;

  /** Creators, managers, and admins can open sharing / copy the participant link */
  const canShareLink = !!canEditForm;

  const openShareModal = async () => {
    if (!formId) return;
    setShareBusy(true);
    setError(null);
    try {
      const patch = await fetch(`/api/forms/${formId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isShared: true }),
      });
      if (!patch.ok) {
        const err = await patch.json();
        setError(err.error || "Could not enable sharing");
        return;
      }
      const data = await patch.json();
      setForm(data.form);
      setShareCopiedKind(null);
      setShareModalOpen(true);
      setSuccess(
        "This form is open for submissions. Copy a link below to share."
      );
    } catch {
      setError("Could not enable sharing");
    } finally {
      setShareBusy(false);
    }
  };

  const copyShareUrl = async (kind: "long" | "short") => {
    if (!formId || !form) return;
    const origin = window.location.origin;
    const longUrl = `${origin}/forms/${formId}`;
    const shortUrl = form.slug ? `${origin}/f/${form.slug}` : null;
    const text = kind === "long" ? longUrl : shortUrl;
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setShareCopiedKind(kind);
      window.setTimeout(() => setShareCopiedKind(null), 2500);
    } catch {
      setError("Could not copy to clipboard");
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

  if (!user) {
    return <div>Redirecting to login...</div>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-main"></div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error || 'Form not found'}
          </div>
        </div>
      </div>
    );
  }

  const pagesList: FormPageDefinition[] =
    form.pages && form.pages.length > 0
      ? form.pages
      : [{ id: "_default", title: "", description: "", order: 0 }];
  const multiPageFill = pagesList.length > 1;
  const activeFillPageId = pagesList[fillStep]?.id ?? pagesList[0]!.id;
  const fieldsForFillStep = multiPageFill
    ? form.fields.filter((f) => (f.pageId ?? pagesList[0]!.id) === activeFillPageId)
    : form.fields;
  const atLastFillStep =
    !multiPageFill || fillStep >= pagesList.length - 1;

  const validateFillStepFields = (): string | null => {
    for (const field of fieldsForFillStep) {
      if (!isDataField(field) || !field.required) continue;
      const response = responses.find((r) => r.fieldLabel === field.label);
      if (field.type === "file_upload") {
        const hasUrl =
          typeof response?.value === "string" &&
          response.value.trim().length > 0;
        const hasPending = !!pendingFiles[field.label];
        if (!hasUrl && !hasPending) {
          return `Field "${field.label}" is required`;
        }
        continue;
      }
      if (!response || isEmptyValue(field, response.value)) {
        return `Field "${field.label}" is required`;
      }
    }
    return null;
  };

  const handleFillNext = () => {
    const err = validateFillStepFields();
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    const map = new Map(responses.map((r) => [r.fieldLabel, r.value]));
    const nextIdx = resolveNextPageIndex(
      pagesList,
      fillStep,
      fieldsOnPage(form.fields, activeFillPageId),
      map
    );
    setFillStep(nextIdx);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form) return;

    if (multiPageFill && !atLastFillStep) {
      const err = validateFillStepFields();
      if (err) {
        setError(err);
        return;
      }
      setError(null);
      const map = new Map(responses.map((r) => [r.fieldLabel, r.value]));
      const nextIdx = resolveNextPageIndex(
        pagesList,
        fillStep,
        fieldsOnPage(form.fields, activeFillPageId),
        map
      );
      setFillStep(nextIdx);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    for (const field of form.fields) {
      if (!isDataField(field) || !field.required) continue;
      const response = responses.find((r) => r.fieldLabel === field.label);
      if (field.type === "file_upload") {
        const hasUrl =
          typeof response?.value === "string" &&
          response.value.trim().length > 0;
        const hasPending = !!pendingFiles[field.label];
        if (!hasUrl && !hasPending) {
          setError(`Field "${field.label}" is required`);
          return;
        }
        continue;
      }
      if (!response || isEmptyValue(field, response.value)) {
        setError(`Field "${field.label}" is required`);
        return;
      }
    }

    for (const field of form.fields) {
      if (!isDataField(field)) continue;
      const response = responses.find((r) => r.fieldLabel === field.label);
      if (field.type === "file_upload" && pendingFiles[field.label]) {
        continue;
      }
      const err = validateFieldValue(field, response?.value);
      if (err) {
        setError(`${field.label}: ${err}`);
        return;
      }
    }

    setSubmitting(true);
    setError(null);

    try {
      if (!user?.id) {
        setError("You must be signed in to submit.");
        setSubmitting(false);
        return;
      }

      let responsesPayload = responses.map((r) => ({ ...r }));

      for (const field of form.fields) {
        if (field.type !== "file_upload") continue;
        const file = pendingFiles[field.label];
        if (!file) continue;
        const prepared = await prepareFormFileForUpload(file, {
          acceptedTypes: field.acceptedFileTypes,
        });
        const url = await uploadFormAttachment(
          prepared.blob,
          prepared.filename,
          prepared.contentType,
          formId,
          user.id
        );
        responsesPayload = responsesPayload.map((r) =>
          r.fieldLabel === field.label ? { ...r, value: url } : r
        );
      }

      for (const field of form.fields) {
        if (!isDataField(field)) continue;
        const payload = responsesPayload.find(
          (r) => r.fieldLabel === field.label
        );
        const err = validateFieldValue(field, payload?.value);
        if (err) {
          setError(`${field.label}: ${err}`);
          setSubmitting(false);
          return;
        }
      }

      const response = await fetch(`/api/forms/${formId}/responses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ responses: responsesPayload }),
      });

      if (response.ok) {
        router.push(`/forms/${formId}/thank-you`);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to submit form");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Network error occurred"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const showGoogleStyleFillCard =
    form.isActive && !!canFillForm && !isEditing;

  const formDisplayTitle = form.title?.trim() || "Untitled form";

  const editHeaderPreviewSrc =
    headerBlobPreviewUrl ||
    (editData.headerImageUrl ?? form.headerImageUrl ?? "").trim();

  const revokeHeaderBlobPreview = () => {
    setHeaderBlobPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  };

  const topBarActions =
    (canShareLink || canEditForm || form.userPermissions?.canViewResponses) && (
      <div className="flex flex-wrap gap-2 justify-end">
        {canShareLink && (
          <Button
            type="button"
            variant="blue"
            onClick={openShareModal}
            disabled={shareBusy}
          >
            {shareBusy ? "…" : "Share form"}
          </Button>
        )}
        {canEditForm && (
          <Button
            type="button"
            variant="blue"
            onClick={() => {
              if (isEditing) {
                revokeHeaderBlobPreview();
                setIsEditing(false);
                setEditData({});
              } else {
                startEditing();
              }
            }}
          >
            {isEditing ? "Cancel Edit" : "Edit Form"}
          </Button>
        )}
        {form.userPermissions?.canViewResponses && (
          <Link
            href={`/forms/${formId}/responses`}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            View Responses ({form.responseCount})
          </Link>
        )}
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {showGoogleStyleFillCard ? (
          topBarActions && (
            <div className="mb-6 flex justify-end">{topBarActions}</div>
          )
        ) : (
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {formDisplayTitle}
              </h1>
              {form.description && (
                <div className="text-gray-600 mt-2 max-w-3xl">
                  <DescriptionContent
                    text={form.description}
                    asMarkdown={!!form.descriptionMarkdown}
                  />
                </div>
              )}
              {form.slug && (
                <p className="text-gray-500 mt-2 text-sm">
                  Short link:{" "}
                  <code className="rounded bg-gray-100 px-1.5 py-0.5 text-gray-800">
                    /f/{form.slug}
                  </code>
                </p>
              )}
              {form.userHasSubmitted && !form.userPermissions?.canFill && (
                <p className="text-green-700 mt-1 text-sm font-medium">
                  You have already submitted this form.
                </p>
              )}
            </div>
            {topBarActions && (
              <div className="shrink-0 sm:pt-1">{topBarActions}</div>
            )}
          </div>
        )}

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

        {!isEditing && canEditForm && (
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Form Managers</h2>
            <div className="text-sm text-gray-600">
              {form.managers && form.managers.length > 0 ? (
                <p>
                  Current managers:{" "}
                  {form.managers.map((m) => m.name).join(", ")}
                </p>
              ) : (
                <p>
                  No managers assigned. Use &quot;Edit Form&quot; to add managers
                  and change fields.
                </p>
              )}
            </div>
          </div>
        )}

        {isEditing && canEditForm && (
          <div className="bg-white p-6 rounded-lg shadow mb-6 pb-20">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Edit form
            </h2>
            <form id="form-edit-form" onSubmit={handleEditSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Form title
                </label>
                <Input
                  type="text"
                  value={editData.title ?? form.title}
                  onChange={(e) =>
                    setEditData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Optional — shown to respondents"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <Textarea
                  value={editData.description ?? form.description ?? ""}
                  onChange={(e) =>
                    setEditData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={3}
                />
                <label className="mt-2 flex cursor-pointer items-center gap-2">
                  <Checkbox
                    checked={
                      editData.descriptionMarkdown ??
                      form.descriptionMarkdown ??
                      false
                    }
                    onCheckedChange={(checked) =>
                      setEditData((prev) => ({
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
                  Public URL:{" "}
                  <code className="rounded bg-gray-100 px-1 py-0.5 text-gray-800">
                    /f/&lt;slug&gt;
                  </code>{" "}
                  redirects to this form. Letters, numbers, and hyphens only.
                </p>
                <Input
                  type="text"
                  value={editData.shortLink ?? ""}
                  onChange={(e) =>
                    setEditData((prev) => ({
                      ...prev,
                      shortLink: e.target.value,
                    }))
                  }
                  placeholder="e.g. form1"
                  className="font-mono"
                />
                <p className="text-xs text-gray-500 mt-2">
                  If the slug is taken, a numeric suffix is added (e.g.{" "}
                  <span className="font-mono">form1-2</span>). Clear the field
                  to remove the short link. The long <span className="font-mono">/forms/…</span>{" "}
                  URL always works.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Colour theme
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Accent for participants (PINUS logo palette).
                </p>
                <FormSelect
                  value={editData.theme ?? form.theme ?? "blue"}
                  onValueChange={(v) =>
                    setEditData((prev) => ({
                      ...prev,
                      theme: v as FormTheme,
                    }))
                  }
                  options={FORM_THEMES}
                  placeholder="Theme"
                  className="max-w-xs"
                />
              </div>
              <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50/80 p-5 shadow-sm">
                <label className="block text-sm font-semibold text-gray-900 mb-1">
                  Header image (optional)
                </label>
                <p className="text-sm text-gray-500 mb-4">
                  21∶9 wide banner. After you choose a file, the crop tool opens.
                  Source files up to 3 MB; images over 1 MB are compressed so the
                  stored image stays within 1 MB.
                </p>
                <input
                  ref={headerFileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="sr-only"
                  tabIndex={-1}
                  disabled={
                    headerUploading || !user || headerCropOpen
                  }
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    e.target.value = "";
                    if (!f || !user || !formId) return;
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
                {editHeaderPreviewSrc ? (
                  <div className="mb-4">
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                      Header preview
                    </p>
                    <div className="aspect-[21/9] w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                      <img
                        src={editHeaderPreviewSrc}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="blue"
                        outline
                        disabled={
                          headerUploading || !user || headerCropOpen
                        }
                        onClick={() => headerFileInputRef.current?.click()}
                      >
                        {headerUploading ? "Uploading…" : "Change image"}
                      </Button>
                      <Button
                        type="button"
                        variant="red"
                        outline
                        disabled={
                          headerUploading || !user || headerCropOpen
                        }
                        onClick={() => {
                          revokeHeaderBlobPreview();
                          setEditData((prev) => ({
                            ...prev,
                            headerImageUrl: "",
                          }));
                          if (headerFileInputRef.current) {
                            headerFileInputRef.current.value = "";
                          }
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="blue"
                    outline
                    disabled={
                      headerUploading || !user || headerCropOpen
                    }
                    onClick={() => headerFileInputRef.current?.click()}
                  >
                    {headerUploading ? "Uploading…" : "Choose header image"}
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="edit-form-active"
                  checked={editData.isActive ?? form.isActive}
                  onCheckedChange={(c) =>
                    setEditData((prev) => ({
                      ...prev,
                      isActive: c === true,
                    }))
                  }
                />
                <label
                  htmlFor="edit-form-active"
                  className="text-sm font-medium text-gray-700 cursor-pointer"
                >
                  Form is active (accepting responses)
                </label>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Managers
                </h3>
                <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-md p-3 space-y-2">
                  {potentialManagers.map((manager) => (
                    <div key={manager.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`mgr-${manager.id}`}
                        checked={selectedManagers.includes(manager.id)}
                        onCheckedChange={(checked) => {
                          if (checked === true) {
                            setSelectedManagers((prev) => [...prev, manager.id]);
                          } else {
                            setSelectedManagers((prev) =>
                              prev.filter((id) => id !== manager.id)
                            );
                          }
                        }}
                      />
                      <label
                        htmlFor={`mgr-${manager.id}`}
                        className="text-sm cursor-pointer"
                      >
                        {manager.name} ({manager.email})
                      </label>
                    </div>
                  ))}
                  {potentialManagers.length === 0 && (
                    <p className="text-sm text-gray-500 italic">
                      No potential managers found.
                    </p>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Managers can view responses and edit this form.
                </p>
              </div>

              <div className="border-t border-gray-200 pt-4 space-y-6">
                <FormPagesManager
                  pages={
                    editData.pages ??
                    (form.pages?.length
                      ? form.pages
                      : [createDefaultPage()])
                  }
                  onChange={(pages) =>
                    setEditData((prev) => ({ ...prev, pages }))
                  }
                  onRemovePage={(removedId, remaining) => {
                    const target = remaining[0]?.id;
                    if (!target) return;
                    setEditData((prev) => ({
                      ...prev,
                      fields: (prev.fields ?? form.fields).map((field) =>
                        field.pageId === removedId
                          ? { ...field, pageId: target }
                          : field
                      ),
                    }));
                  }}
                />
                <FormFieldsEditor
                  fields={editData.fields ?? form.fields}
                  pages={
                    editData.pages ??
                    (form.pages?.length
                      ? form.pages
                      : [createDefaultPage()])
                  }
                  onChange={(fields) =>
                    setEditData((prev) => ({ ...prev, fields }))
                  }
                  addFieldFabClassName="fixed bottom-24 right-6 z-40 shadow-lg"
                />
              </div>
            </form>
          </div>
        )}

        {isEditing && canEditForm && (
          <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] px-4 py-3">
            <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-gray-600 hidden sm:block">
                Save changes to title, fields, managers, and short link.
              </p>
              <div className="flex flex-wrap gap-3 justify-end ml-auto">
                <Button
                  type="button"
                  variant="black"
                  outline
                  onClick={() => {
                    revokeHeaderBlobPreview();
                    setIsEditing(false);
                    setEditData({});
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  form="form-edit-form"
                  variant="blue"
                  disabled={submitting}
                >
                  {submitting ? "Saving..." : "Save all changes"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {form.userHasSubmitted &&
          !form.userPermissions?.canFill &&
          form.mySubmission &&
          !isEditing && (
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-1">
              Your responses
            </h2>
            {form.mySubmission?.submittedAt && (
              <p className="text-sm text-gray-500 mb-6">
                Submitted{" "}
                {format(
                  new Date(form.mySubmission.submittedAt),
                  "PPP p"
                )}
              </p>
            )}
            <div className="space-y-6">
              {form.fields.map((field, index) => (
                <div key={index} className="space-y-2">
                  {field.type === "section" ? (
                    <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                      {(field.sectionDisplay ?? "both") !==
                        "description_only" &&
                        (field.sectionTitle?.trim() || field.label) && (
                          <h3 className="text-lg font-semibold text-gray-900">
                            {field.sectionTitle?.trim() || field.label}
                          </h3>
                        )}
                      {(field.sectionDisplay ?? "both") !== "title_only" &&
                        field.sectionDescription?.trim() && (
                          <div className="mt-1 text-sm text-gray-600">
                            <DescriptionContent
                              text={field.sectionDescription}
                              asMarkdown={!!field.sectionDescriptionMarkdown}
                              className="text-sm text-gray-600"
                            />
                          </div>
                        )}
                    </div>
                  ) : (
                    <>
                      <div>
                        <span className="block text-sm font-medium text-gray-900">
                          {field.label}
                        </span>
                        {field.description?.trim() && (
                          <p className="text-sm text-gray-500 mt-1 whitespace-pre-wrap">
                            {field.description}
                          </p>
                        )}
                      </div>
                      <div className="text-gray-900 border border-gray-100 rounded-md bg-gray-50 px-3 py-2 text-sm">
                        {field.type === "file_upload" ? (
                          <FormAttachmentViewer
                            url={String(
                              responses.find((r) => r.fieldLabel === field.label)
                                ?.value ?? ""
                            )}
                          />
                        ) : (
                          formatSubmittedAnswer(
                            field,
                            responses.find((r) => r.fieldLabel === field.label)
                              ?.value
                          )
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {form.isActive && canFillForm && !isEditing ? (
          <div
            className={`relative overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm ${formThemeClass(
              form.theme ?? "blue"
            )}`}
          >
            <span
              className="pointer-events-none absolute right-4 top-4 z-10 inline-flex items-center rounded-full border border-emerald-200/90 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800 shadow-sm"
              title="This form is accepting responses"
            >
              Active
            </span>
            {form.headerImageUrl && (
              <img
                src={form.headerImageUrl}
                alt=""
                className="h-44 w-full object-cover"
              />
            )}
            <div
              className="border-b px-8 py-8"
              style={{
                borderColor: "rgba(0,0,0,0.06)",
                background:
                  "linear-gradient(180deg, var(--pf-accent-soft) 0%, #fff 100%)",
              }}
            >
              <h2 className="text-[1.65rem] font-normal leading-tight tracking-tight text-gray-900">
                {formDisplayTitle}
              </h2>
              {form.description?.trim() && (
                <div className="mt-3 max-w-2xl text-base text-gray-600">
                  <DescriptionContent
                    text={form.description}
                    asMarkdown={!!form.descriptionMarkdown}
                  />
                </div>
              )}
              {multiPageFill && (
                <div className="mt-4 space-y-1">
                  <p className="text-sm text-gray-500">
                    Page {fillStep + 1} of {pagesList.length}
                    {pagesList[fillStep]?.title?.trim()
                      ? ` - ${pagesList[fillStep]!.title}`
                      : ""}
                  </p>
                  {pagesList[fillStep]?.description?.trim() && (
                    <p className="text-sm text-gray-600 max-w-2xl whitespace-pre-wrap">
                      {pagesList[fillStep]!.description}
                    </p>
                  )}
                </div>
              )}
            </div>
            <div className="p-6 sm:p-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              {isFormFiller ? "Your answers" : "Your responses"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              {fieldsForFillStep.map((field) => {
                const fi = form.fields.findIndex((x) => x.label === field.label);
                return (
                <div key={`${field.label}-${fi}`} className="space-y-2">
                  {field.type === "section" ? (
                    <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                      {(field.sectionDisplay ?? "both") !== "description_only" &&
                        (field.sectionTitle?.trim() || field.label) && (
                          <h3 className="text-lg font-semibold text-gray-900">
                            {field.sectionTitle?.trim() || field.label}
                          </h3>
                        )}
                      {(field.sectionDisplay ?? "both") !== "title_only" &&
                        field.sectionDescription?.trim() && (
                          <div className="mt-1 text-sm text-gray-600">
                            <DescriptionContent
                              text={field.sectionDescription}
                              asMarkdown={!!field.sectionDescriptionMarkdown}
                              className="text-sm text-gray-600"
                            />
                          </div>
                        )}
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          {field.label}
                          {field.required && (
                            <span className="text-red-500 ml-1">*</span>
                          )}
                        </label>
                        {field.description?.trim() && (
                          <p className="text-sm text-gray-500 mt-1 whitespace-pre-wrap">
                            {field.description}
                          </p>
                        )}
                      </div>

                      {field.type === "multiple_choice" &&
                        (field.minSelections != null ||
                          field.maxSelections != null) && (
                          <p className="text-xs text-gray-500 -mt-1">
                            {field.minSelections != null &&
                            field.minSelections > 0
                              ? `Choose at least ${field.minSelections}. `
                              : ""}
                            {field.maxSelections != null
                              ? `Choose at most ${field.maxSelections}.`
                              : ""}
                          </p>
                        )}

                      {field.type === "text" && (
                        <div>
                          <Input
                            type="text"
                            value={
                              (responses.find((r) => r.fieldLabel === field.label)
                                ?.value as string) || ""
                            }
                            onChange={(e) =>
                              handleResponseChange(field.label, e.target.value)
                            }
                            required={field.required}
                            minLength={
                              field.minLength != null && field.minLength > 0
                                ? field.minLength
                                : undefined
                            }
                            maxLength={field.maxLength}
                          />
                          {(field.minLength != null ||
                            field.maxLength != null) && (
                            <p className="mt-1 text-xs text-gray-500">
                              {field.minLength != null && field.minLength > 0
                                ? `Min ${field.minLength} characters. `
                                : ""}
                              {field.maxLength != null
                                ? `Max ${field.maxLength} characters.`
                                : ""}
                            </p>
                          )}
                        </div>
                      )}

                      {field.type === "segmented_text" && (
                        <div>
                          <Input
                            type="text"
                            value={
                              (responses.find((r) => r.fieldLabel === field.label)
                                ?.value as string) || ""
                            }
                            onChange={(e) =>
                              handleResponseChange(field.label, e.target.value)
                            }
                            className="font-mono text-sm"
                            placeholder={`Parts separated by "${field.segmentDelimiter ?? "/"}"`}
                            required={field.required}
                            minLength={
                              field.minLength != null && field.minLength > 0
                                ? field.minLength
                                : undefined
                            }
                            maxLength={field.maxLength}
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            Use the separator{" "}
                            <span className="font-mono">
                              {field.segmentDelimiter ?? "/"}
                            </span>{" "}
                            between segments.
                            {(field.minLength != null ||
                              field.maxLength != null) && (
                              <>
                                {" "}
                                {field.minLength != null && field.minLength > 0
                                  ? `Min ${field.minLength} characters. `
                                  : ""}
                                {field.maxLength != null
                                  ? `Max ${field.maxLength} characters.`
                                  : ""}
                              </>
                            )}
                          </p>
                        </div>
                      )}

                      {field.type === "number" && (
                        <Input
                          type="number"
                          value={
                            (responses.find((r) => r.fieldLabel === field.label)
                              ?.value as string | number) ?? ""
                          }
                          onChange={(e) => {
                            const v = e.target.value;
                            handleResponseChange(
                              field.label,
                              v === "" ? "" : Number(v)
                            );
                          }}
                          required={field.required}
                        />
                      )}

                      {field.type === "date" && (
                        <FormDateField
                          mode={field.dateMode ?? "date"}
                          value={
                            (responses.find((r) => r.fieldLabel === field.label)
                              ?.value as string) || ""
                          }
                          onChange={(v) =>
                            handleResponseChange(field.label, v)
                          }
                          required={field.required}
                        />
                      )}

                      {field.type === "checkbox" && (
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id={`fill-checkbox-${fi}`}
                            checked={
                              (responses.find(
                                (r) => r.fieldLabel === field.label
                              )?.value as boolean) || false
                            }
                            onCheckedChange={(c) =>
                              handleResponseChange(field.label, c === true)
                            }
                          />
                          <label
                            htmlFor={`fill-checkbox-${fi}`}
                            className="text-sm text-gray-700 cursor-pointer"
                          >
                            Yes
                          </label>
                        </div>
                      )}

                      {field.type === "dropdown" && (
                        <FormSelect
                          value={
                            (responses.find((r) => r.fieldLabel === field.label)
                              ?.value as string) || ""
                          }
                          onValueChange={(v) =>
                            handleResponseChange(field.label, v)
                          }
                          options={(field.options ?? []).map((o) => ({
                            value: o,
                            label: o,
                          }))}
                          allowNone
                          noneOptionLabel="Select an option"
                          required={field.required}
                        />
                      )}

                      {field.type === "multiple_choice" && (
                        <div className="space-y-2 rounded-md border border-gray-200 bg-white p-3">
                          {field.options?.map((option, optionIndex) => {
                            const selected = (
                              (responses.find(
                                (r) => r.fieldLabel === field.label)
                                ?.value as string[]) || []
                            ).includes(option);
                            const optId = `mc-${fi}-${optionIndex}`;
                            return (
                              <div
                                key={optionIndex}
                                className="flex items-center gap-2 text-sm"
                              >
                                <Checkbox
                                  id={optId}
                                  checked={selected}
                                  onCheckedChange={(c) =>
                                    handleMultipleChoiceToggle(
                                      field.label,
                                      option,
                                      c === true
                                    )
                                  }
                                />
                                <label
                                  htmlFor={optId}
                                  className="cursor-pointer text-gray-900"
                                >
                                  {option}
                                </label>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {field.type === "file_upload" && (
                        <div className="space-y-3 rounded-xl border border-gray-100 bg-gray-50/80 p-4">
                          <input
                            id={`form-file-upload-${fi}`}
                            ref={(el) => {
                              fileInputRefs.current[fi] = el;
                            }}
                            type="file"
                            accept={buildAcceptHtmlAttribute(
                              field.acceptedFileTypes
                            )}
                            className="sr-only"
                            tabIndex={-1}
                            onChange={(e) => {
                              const f = e.target.files?.[0] ?? null;
                              e.target.value = "";
                              if (!f) {
                                setPendingFiles((p) => ({
                                  ...p,
                                  [field.label]: null,
                                }));
                                handleResponseChange(field.label, "");
                                return;
                              }
                              if (!isFileAccepted(f, field.acceptedFileTypes)) {
                                setError(
                                  `Allowed types for this question: ${acceptedTypesSummary(field.acceptedFileTypes)}.`
                                );
                                return;
                              }
                              if (f.size > FORM_FILE_MAX_SOURCE_BYTES) {
                                setError("File must be 3 MB or smaller.");
                                return;
                              }
                              if (isPdfFile(f)) {
                                setPendingFiles((p) => ({
                                  ...p,
                                  [field.label]: f,
                                }));
                                handleResponseChange(field.label, "");
                                setError(null);
                                return;
                              }
                              if (fileCropSrcRef.current) {
                                URL.revokeObjectURL(fileCropSrcRef.current);
                                fileCropSrcRef.current = null;
                              }
                              const url = URL.createObjectURL(f);
                              fileCropSrcRef.current = url;
                              setFileCropSrc(url);
                              setFileCropFieldLabel(field.label);
                              setFileCropOpen(true);
                              setError(null);
                            }}
                          />
                          <p className="text-xs text-gray-500 max-w-xl">
                            Allowed:{" "}
                            <span className="font-medium text-gray-700">
                              {acceptedTypesSummary(field.acceptedFileTypes)}
                            </span>
                            . Images open a crop step first. Up to 1 MB as-is;
                            images 1–3 MB are compressed to 1 MB; PDFs must be
                            ≤ 1 MB.
                          </p>
                          {!pendingFiles[field.label] ? (
                            <div>
                              <Button
                                type="button"
                                variant="blue"
                                outline
                                onClick={() =>
                                  fileInputRefs.current[fi]?.click()
                                }
                              >
                                Choose file
                              </Button>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <p className="text-sm text-gray-700">
                                <span className="font-medium">Selected:</span>{" "}
                                {pendingFiles[field.label]!.name} (
                                {(
                                  pendingFiles[field.label]!.size / 1024
                                ).toFixed(0)}{" "}
                                KB)
                              </p>
                              <FormFilePendingPreview
                                file={pendingFiles[field.label]!}
                              />
                              <div className="flex flex-wrap gap-2 pt-1">
                                <Button
                                  type="button"
                                  variant="blue"
                                  outline
                                  onClick={() =>
                                    fileInputRefs.current[fi]?.click()
                                  }
                                >
                                  {isPdfFile(pendingFiles[field.label]!)
                                    ? "Change PDF"
                                    : "Change image"}
                                </Button>
                                <Button
                                  type="button"
                                  variant="red"
                                  outline
                                  onClick={() => {
                                    setPendingFiles((p) => ({
                                      ...p,
                                      [field.label]: null,
                                    }));
                                    handleResponseChange(field.label, "");
                                    const el = fileInputRefs.current[fi];
                                    if (el) el.value = "";
                                  }}
                                >
                                  Delete
                                </Button>
                              </div>
                            </div>
                          )}
                          {typeof (responses.find((r) => r.fieldLabel === field.label)
                            ?.value as string) === "string" &&
                            String(
                              responses.find((r) => r.fieldLabel === field.label)
                                ?.value ?? ""
                            ).startsWith("https://") &&
                            !pendingFiles[field.label] && (
                              <div className="pt-1">
                                <FormAttachmentViewer
                                  url={String(
                                    responses.find(
                                      (r) => r.fieldLabel === field.label
                                    )?.value ?? ""
                                  )}
                                />
                              </div>
                            )}
                        </div>
                      )}
                    </>
                  )}
                </div>
                );
              })}

              <div className="flex flex-wrap gap-3 pt-4">
                {multiPageFill && fillStep > 0 && (
                  <Button
                    type="button"
                    variant="black"
                    outline
                    onClick={() => {
                      setFillStep((s) => Math.max(0, s - 1));
                      setError(null);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  >
                    Back
                  </Button>
                )}
                {multiPageFill && !atLastFillStep && (
                  <Button type="button" variant="blue" onClick={handleFillNext}>
                    Next
                  </Button>
                )}
                {atLastFillStep && (
                  <Button type="submit" variant="blue" disabled={submitting}>
                    {submitting ? "Submitting..." : "Submit"}
                  </Button>
                )}
              </div>
            </form>
            </div>
          </div>
        ) : !form.isActive ? (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
            This form is currently inactive and not accepting responses.
          </div>
        ) : !canFillForm && !form.userHasSubmitted ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            You don&apos;t have permission to fill this form, or it is not open
            for submissions yet.
          </div>
        ) : null}

        {/* Management Links */}
        {canEditForm && (
          <div className="mt-6 bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Form Management</h3>
            <div className="flex space-x-4">
              {form.userPermissions?.canViewResponses && (
                <Link
                  href={`/forms/${formId}/responses`}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  View Responses ({form.responseCount})
                </Link>
              )}
            </div>
          </div>
        )}
      </div>

      {shareModalOpen && form && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close share dialog"
            onClick={() => setShareModalOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="share-form-dialog-title"
            className="relative z-10 w-full max-w-lg rounded-xl border border-gray-200 bg-white p-6 shadow-xl"
          >
            <h2
              id="share-form-dialog-title"
              className="text-lg font-semibold text-gray-900"
            >
              Share this form
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Participants can use either link. The short link redirects to the
              same form.
            </p>

            <div className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-gray-500 mb-1.5">
                  Long link
                </label>
                <div className="flex gap-2">
                  <input
                    readOnly
                    className="flex-1 rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 font-mono"
                    value={
                      typeof window !== "undefined"
                        ? `${window.location.origin}/forms/${formId}`
                        : `/forms/${formId}`
                    }
                    onFocus={(e) => e.target.select()}
                  />
                  <Button
                    type="button"
                    variant="blue"
                    onClick={() => copyShareUrl("long")}
                  >
                    {shareCopiedKind === "long" ? "Copied!" : "Copy"}
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-gray-500 mb-1.5">
                  Short link
                </label>
                {form.slug ? (
                  <div className="flex gap-2">
                    <input
                      readOnly
                      className="flex-1 rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 font-mono"
                      value={
                        typeof window !== "undefined"
                          ? `${window.location.origin}/f/${form.slug}`
                          : `/f/${form.slug}`
                      }
                      onFocus={(e) => e.target.select()}
                    />
                    <Button
                      type="button"
                      variant="blue"
                      onClick={() => copyShareUrl("short")}
                    >
                      {shareCopiedKind === "short" ? "Copied!" : "Copy"}
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-gray-600 rounded-md border border-dashed border-gray-200 bg-gray-50 px-3 py-2">
                    No short link yet. Use{" "}
                    <span className="font-medium">Edit Form</span> to set an
                    optional short path (e.g.{" "}
                    <code className="rounded bg-gray-100 px-1">/f/my-form</code>
                    ).
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button
                type="button"
                variant="black"
                outline
                onClick={() => setShareModalOpen(false)}
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}

      <ImageCropModal
        imageSrc={headerCropSrc}
        open={headerCropOpen}
        aspect={FORM_HEADER_IMAGE_CROP_ASPECT}
        title="Adjust header banner"
        description="21∶9 banner. Drag to reposition and zoom. Stored file is kept within 1 MB after processing."
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
          if (!user?.id || !formId) return;
          let pendingBlobUrl: string | null = URL.createObjectURL(file);
          setHeaderBlobPreviewUrl(pendingBlobUrl);
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
              formId,
              user.id
            );
            setEditData((prev) => ({ ...prev, headerImageUrl: url }));
            if (pendingBlobUrl) {
              URL.revokeObjectURL(pendingBlobUrl);
              pendingBlobUrl = null;
            }
            setHeaderBlobPreviewUrl(null);
          } catch (err) {
            if (pendingBlobUrl) {
              URL.revokeObjectURL(pendingBlobUrl);
              pendingBlobUrl = null;
            }
            setHeaderBlobPreviewUrl(null);
            setError(
              err instanceof Error ? err.message : "Upload failed"
            );
          } finally {
            setHeaderUploading(false);
          }
        }}
      />

      <ImageCropModal
        imageSrc={fileCropSrc}
        open={fileCropOpen}
        aspect={4 / 3}
        title="Adjust your image"
        description="Drag to reposition and zoom. The cropped image is attached when you submit the form."
        outputFileName="form-upload.jpg"
        completeLabel="Use this image"
        onCancel={() => {
          setFileCropOpen(false);
          if (fileCropSrcRef.current) {
            URL.revokeObjectURL(fileCropSrcRef.current);
            fileCropSrcRef.current = null;
          }
          setFileCropSrc(null);
          setFileCropFieldLabel(null);
        }}
        onComplete={(file) => {
          const label = fileCropFieldLabel;
          if (label) {
            setPendingFiles((p) => ({ ...p, [label]: file }));
            handleResponseChange(label, "");
          }
          setFileCropOpen(false);
          if (fileCropSrcRef.current) {
            URL.revokeObjectURL(fileCropSrcRef.current);
            fileCropSrcRef.current = null;
          }
          setFileCropSrc(null);
          setFileCropFieldLabel(null);
          setError(null);
        }}
      />
    </div>
  );
}
