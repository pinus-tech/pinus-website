'use client';

import React, { useState, useEffect } from "react";
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
import { validateFormFieldsArray } from "@/lib/forms/validate-form-fields";
import { format, parseISO } from "date-fns";

type FormField = FormFieldDefinition;

interface Form {
  id: string;
  title: string;
  description?: string;
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
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<{
    title?: string;
    description?: string;
    fields?: FormField[];
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

  const fetchForm = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/forms/${formId}`);
      
      if (response.ok) {
        const data = await response.json();
        setForm(data.form);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form) return;

    for (const field of form.fields) {
      if (!isDataField(field) || !field.required) continue;
      const response = responses.find((r) => r.fieldLabel === field.label);
      if (!response || isEmptyValue(field, response.value)) {
        setError(`Field "${field.label}" is required`);
        return;
      }
    }

    for (const field of form.fields) {
      if (!isDataField(field)) continue;
      const response = responses.find((r) => r.fieldLabel === field.label);
      const err = validateFieldValue(field, response?.value);
      if (err) {
        setError(`${field.label}: ${err}`);
        return;
      }
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/forms/${formId}/responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ responses }),
      });

      if (response.ok) {
        router.push(`/forms/${formId}/thank-you`);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to submit form');
      }
    } catch (error) {
      setError('Network error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const startEditing = () => {
    if (!form) return;
    setEditData({
      title: form.title,
      description: form.description ?? "",
      fields: JSON.parse(JSON.stringify(form.fields)) as FormField[],
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
          fields,
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

  const showOrganiserMeta =
    user &&
    form &&
    (user.isSuperAdmin ||
      user.isAdmin ||
      !!canEditForm ||
      !!form.userPermissions?.canViewResponses);

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

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{form.title}</h1>
            {form.description && (
              <p className="text-gray-600 mt-2">{form.description}</p>
            )}
            {form.slug && (
              <p className="text-gray-500 mt-2 text-sm">
                Short link:{" "}
                <code className="rounded bg-gray-100 px-1.5 py-0.5 text-gray-800">
                  /f/{form.slug}
                </code>
              </p>
            )}
            {isFormFiller && (
              <p className="text-blue-600 mt-1 text-sm">You can fill out this form</p>
            )}
            {form.userHasSubmitted && !form.userPermissions?.canFill && (
              <p className="text-green-700 mt-1 text-sm font-medium">
                You have already submitted this form.
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2 justify-end">
            <Button
              type="button"
              variant="black"
              outline
              onClick={() => router.push("/forms")}
            >
              ← Back to Forms
            </Button>
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

        {/* Form Info - creator / managers / response counts: organisers only */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
            {showOrganiserMeta && (
              <div>
                <span className="font-medium">Created by:</span>{" "}
                {form.createdBy.name}
              </div>
            )}
            {showOrganiserMeta && (
              <div>
                <span className="font-medium">Responses:</span>{" "}
                {form.responseCount}
              </div>
            )}
            {showOrganiserMeta && (
              <div>
                <span className="font-medium">Status:</span>{" "}
                {form.isActive ? "Active" : "Inactive"}
              </div>
            )}
            {!showOrganiserMeta && (
              <div className="md:col-span-3">
                <span className="font-medium">Status:</span>{" "}
                {form.isActive ? "Active" : "Inactive"}
              </div>
            )}
          </div>
          {showOrganiserMeta &&
            form.managers &&
            form.managers.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <span className="font-medium text-sm text-gray-600">Managers:</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {form.managers.map((manager, index) => (
                  <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                    {manager.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

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
          <div className="bg-white p-6 rounded-lg shadow mb-6 pb-28">
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
                  required
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

              <div className="border-t border-gray-200 pt-4">
                <FormFieldsEditor
                  fields={editData.fields ?? form.fields}
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
                          <p className="mt-1 text-sm text-gray-600 whitespace-pre-wrap">
                            {field.sectionDescription}
                          </p>
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
                      <p className="text-gray-900 border border-gray-100 rounded-md bg-gray-50 px-3 py-2 text-sm">
                        {formatSubmittedAnswer(
                          field,
                          responses.find((r) => r.fieldLabel === field.label)
                            ?.value
                        )}
                      </p>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {form.isActive && canFillForm && !isEditing ? (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              {isFormFiller ? "Fill form" : "Your responses"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              {form.fields.map((field, index) => (
                <div key={index} className="space-y-2">
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
                          <p className="mt-1 text-sm text-gray-600 whitespace-pre-wrap">
                            {field.sectionDescription}
                          </p>
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
                            id={`fill-checkbox-${index}`}
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
                            htmlFor={`fill-checkbox-${index}`}
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
                            const optId = `mc-${index}-${optionIndex}`;
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
                    </>
                  )}
                </div>
              ))}

              <div className="pt-4">
                <Button type="submit" variant="blue" disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit Form"}
                </Button>
              </div>
            </form>
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
    </div>
  );
}
