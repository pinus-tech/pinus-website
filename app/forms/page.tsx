"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import Link from "next/link";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";

interface Form {
  id: string;
  title: string;
  description?: string;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  fields: Array<{
    label: string;
    type: string;
    required: boolean;
    options?: string[];
  }>;
  responseCount: number;
  isActive: boolean;
  isShared: boolean;
  createdAt: string;
  updatedAt: string;
  managers?: Array<{
    _id: string;
    name: string;
    email: string;
  }>;
  userHasSubmitted?: boolean;
  userPermissions?: {
    canEdit: boolean;
    canViewResponses: boolean;
    canFill: boolean;
  };
}

export default function FormsPage() {
  const [loading, setLoading] = useState(true);
  const [forms, setForms] = useState<Form[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [shareTarget, setShareTarget] = useState<Form | null>(null);
  const [shareBusy, setShareBusy] = useState(false);
  const [copyDone, setCopyDone] = useState(false);

  const { user, loading: authLoading, canCreateForms } = useAuth();

  const isSiteAdmin = !!(user?.isSuperAdmin || user?.isAdmin);
  const canManageFormsList =
    isSiteAdmin ||
    (user?.permissions?.canCreateForms === true);

  const canShareForm = (form: Form) =>
    !!(user && (isSiteAdmin || form.userPermissions?.canEdit));

  const showOrganiserMeta = (form: Form) =>
    !!(
      user &&
      (user.isSuperAdmin ||
        user.isAdmin ||
        form.userPermissions?.canEdit ||
        form.userPermissions?.canViewResponses)
    );

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      window.location.href = "/login";
      return;
    }

    fetchForms();
  }, [user, authLoading]);

  const fetchForms = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/forms");

      if (response.ok) {
        const data = await response.json();
        setForms(data.forms);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to fetch forms");
      }
    } catch {
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const deleteForm = async (formId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this form? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/forms/${formId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setForms((prev) => prev.filter((form) => form.id !== formId));
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Failed to delete form");
      }
    } catch {
      alert("Network error occurred");
    }
  };

  const openShareModal = (form: Form) => {
    setShareTarget(form);
    setCopyDone(false);
  };

  const closeShareModal = () => {
    setShareTarget(null);
    setShareBusy(false);
    setCopyDone(false);
  };

  const shareUrl =
    typeof window !== "undefined" && shareTarget
      ? `${window.location.origin}/forms/${shareTarget.id}`
      : "";

  const handleCopyShareLink = useCallback(async () => {
    if (!shareTarget) return;
    setShareBusy(true);
    setCopyDone(false);
    try {
      const patch = await fetch(`/api/forms/${shareTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isShared: true }),
      });
      if (!patch.ok) {
        const err = await patch.json();
        alert(err.error || "Could not enable sharing");
        return;
      }
      const data = await patch.json();
      const updated = data.form as Form;
      setForms((prev) =>
        prev.map((f) =>
          f.id === updated.id ? { ...f, isShared: updated.isShared ?? true } : f
        )
      );
      setShareTarget((t) =>
        t && t.id === updated.id
          ? { ...t, isShared: updated.isShared ?? true }
          : t
      );
      await navigator.clipboard.writeText(
        `${window.location.origin}/forms/${shareTarget.id}`
      );
      setCopyDone(true);
    } catch {
      alert("Could not copy link");
    } finally {
      setShareBusy(false);
    }
  }, [shareTarget]);

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
          <h1 className="text-3xl font-bold text-gray-900">Forms Management</h1>
          {(user.isSuperAdmin || canCreateForms()) && (
            <Link
              href="/forms/create"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Create New Form
            </Link>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-main"></div>
          </div>
        ) : forms.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {canManageFormsList
                ? "No forms found"
                : "No forms filled yet"}
            </h3>
            <p className="text-gray-600 mb-4">
              {canManageFormsList
                ? "Create your first form to get started."
                : "When you submit a form using a link shared by the organisers, it will appear here."}
            </p>
            {(user.isSuperAdmin || canCreateForms()) && (
              <Link
                href="/forms/create"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Create Your First Form
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-6">
            {forms.map((form) => (
              <div key={form.id} className="bg-white p-6 rounded-lg shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {form.title}
                    </h3>
                    {form.description && (
                      <p className="text-gray-600 mb-2">{form.description}</p>
                    )}
                    <div className="text-sm text-gray-500 space-y-1">
                      {showOrganiserMeta(form) && (
                        <p>
                          Created by: {form.createdBy?.name ?? "Unknown"}
                        </p>
                      )}
                      {showOrganiserMeta(form) &&
                        form.managers &&
                        form.managers.length > 0 && (
                          <p>
                            Managers:{" "}
                            {form.managers
                              .map((m) => m?.name ?? "Unknown")
                              .join(", ")}
                          </p>
                        )}
                      {showOrganiserMeta(form) && (
                        <p>Fields: {form.fields.length}</p>
                      )}
                      {showOrganiserMeta(form) && (
                        <p>Responses: {form.responseCount}</p>
                      )}
                      {showOrganiserMeta(form) && (
                        <p>
                          Status: {form.isActive ? "Active" : "Inactive"}
                        </p>
                      )}
                      {showOrganiserMeta(form) && (
                        <p>
                          Participant link:{" "}
                          {form.isShared ? "Open" : "Not shared yet"}
                        </p>
                      )}
                      {showOrganiserMeta(form) && (
                        <p>
                          Created:{" "}
                          {new Date(form.createdAt).toLocaleDateString()}
                        </p>
                      )}
                      {!canManageFormsList && form.userHasSubmitted && (
                        <p className="text-green-700 font-medium">
                          You have submitted this form
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-end">
                    {canShareForm(form) && (
                      <button
                        type="button"
                        onClick={() => openShareModal(form)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                      >
                        Share form
                      </button>
                    )}
                    {form.userPermissions?.canFill && (
                      <Link
                        href={`/forms/${form.id}`}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                      >
                        Fill form
                      </Link>
                    )}
                    {form.userHasSubmitted && !form.userPermissions?.canFill && (
                      <Link
                        href={`/forms/${form.id}`}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                      >
                        View
                      </Link>
                    )}
                    {form.userPermissions?.canEdit && (
                      <Link
                        href={`/forms/${form.id}`}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                      >
                        Edit form
                      </Link>
                    )}
                    {form.userPermissions?.canViewResponses && (
                      <Link
                        href={`/forms/${form.id}/responses`}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                      >
                        View responses ({form.responseCount})
                      </Link>
                    )}
                    {(user.isSuperAdmin ||
                      form.createdBy?.email === user.email) && (
                      <button
                        onClick={() => deleteForm(form.id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>

                {showOrganiserMeta(form) && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">
                      Field types:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {form.fields.map((field, index) => (
                        <span
                          key={index}
                          className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs"
                        >
                          {field.label} ({field.type})
                          {field.required && (
                            <span className="text-red-500 ml-1">*</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {shareTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="share-form-title"
        >
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
            <h2
              id="share-form-title"
              className="text-lg font-semibold text-gray-900 mb-2"
            >
              Share form with participants
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Copy the link below and send it to participants. The form will be
              opened for submissions when you copy (if it was not open yet).
            </p>
            <div className="flex gap-2 mb-4">
              <Input
                readOnly
                className="flex-1 bg-gray-50"
                value={shareUrl}
                aria-label="Shareable form URL"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="black"
                outline
                size="sm"
                onClick={closeShareModal}
              >
                Close
              </Button>
              <Button
                type="button"
                variant="blue"
                size="sm"
                disabled={shareBusy}
                onClick={handleCopyShareLink}
              >
                {shareBusy ? "Working…" : copyDone ? "Copied!" : "Copy link"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
