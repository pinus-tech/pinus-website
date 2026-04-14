"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/AuthContext";
import Link from "next/link";
import { Button } from "@/app/components/ui/button";
import { buildLoginUrl, pathAndQueryFromWindow } from "@/lib/login-callback";
import { DescriptionContent } from "@/app/components/DescriptionContent";

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
  descriptionMarkdown?: boolean;
  createdAt: string;
  updatedAt: string;
  managers?: Array<{
    _id: string;
    name: string;
    email: string;
  }>;
  userHasSubmitted?: boolean;
  slug?: string | null;
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
  const [shareCopiedKind, setShareCopiedKind] = useState<
    "long" | "short" | null
  >(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

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
      window.location.href = buildLoginUrl(pathAndQueryFromWindow());
      return;
    }

    fetchForms();
  }, [user, authLoading]);

  useEffect(() => {
    const msg = error?.trim().toLowerCase() ?? "";
    if (!msg.includes("internal server error")) return;
    if (typeof window === "undefined") return;
    const key = "pinus-forms-ise-retry";
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    window.location.reload();
  }, [error]);

  const fetchForms = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/forms");

      if (response.ok) {
        const data = await response.json();
        setForms(data.forms);
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("pinus-forms-ise-retry");
        }
      } else {
        if (
          typeof window !== "undefined" &&
          response.status >= 500 &&
          response.status < 600
        ) {
          const key = "pinus-forms-ise-retry";
          if (!sessionStorage.getItem(key)) {
            sessionStorage.setItem(key, "1");
            window.location.reload();
            return;
          }
        }
        const errorData = await response.json().catch(() => ({}));
        setError(
          (errorData as { error?: string }).error || "Failed to fetch forms"
        );
      }
    } catch {
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const duplicateForm = async (formId: string) => {
    setDuplicatingId(formId);
    setError(null);
    try {
      const response = await fetch(`/api/forms/${formId}/duplicate`, {
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Failed to duplicate form");
        return;
      }
      router.push(`/forms/${String(data.form.id)}`);
    } catch {
      setError("Network error occurred");
    } finally {
      setDuplicatingId(null);
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

  const openShareModal = async (form: Form) => {
    setShareBusy(true);
    setShareCopiedKind(null);
    try {
      const patch = await fetch(`/api/forms/${form.id}`, {
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
        prev.map((f) => (f.id === updated.id ? { ...f, ...updated } : f))
      );
      setShareTarget(updated);
    } catch {
      alert("Could not enable sharing");
    } finally {
      setShareBusy(false);
    }
  };

  const closeShareModal = () => {
    setShareTarget(null);
    setShareBusy(false);
    setShareCopiedKind(null);
  };

  const copyShareUrl = useCallback(
    async (kind: "long" | "short") => {
      if (!shareTarget) return;
      const origin = window.location.origin;
      const longUrl = `${origin}/forms/${shareTarget.id}`;
      const shortUrl = shareTarget.slug
        ? `${origin}/f/${shareTarget.slug}`
        : null;
      const text = kind === "long" ? longUrl : shortUrl;
      if (!text) return;
      try {
        await navigator.clipboard.writeText(text);
        setShareCopiedKind(kind);
        window.setTimeout(() => setShareCopiedKind(null), 2500);
      } catch {
        alert("Could not copy to clipboard");
      }
    },
    [shareTarget]
  );

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
          {canManageFormsList && (
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
            {canManageFormsList && (
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
                      {form.title?.trim() || "Untitled form"}
                    </h3>
                    {form.description && (
                      <div className="text-gray-600 mb-2 max-w-prose">
                        <DescriptionContent
                          text={form.description}
                          asMarkdown={!!form.descriptionMarkdown}
                        />
                      </div>
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
                      <>
                        <button
                          type="button"
                          onClick={() => duplicateForm(form.id)}
                          disabled={duplicatingId === form.id}
                          className="bg-slate-600 hover:bg-slate-700 disabled:opacity-60 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                        >
                          {duplicatingId === form.id
                            ? "Duplicating…"
                            : "Duplicate"}
                        </button>
                        <Link
                          href={`/forms/${form.id}`}
                          className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                        >
                          Edit form
                        </Link>
                      </>
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close share dialog"
            onClick={closeShareModal}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="share-form-title"
            className="relative z-10 w-full max-w-lg rounded-xl border border-gray-200 bg-white p-6 shadow-xl"
          >
            <h2
              id="share-form-title"
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
                        ? `${window.location.origin}/forms/${shareTarget.id}`
                        : `/forms/${shareTarget.id}`
                    }
                    onFocus={(e) => e.target.select()}
                    aria-label="Long form URL"
                  />
                  <Button
                    type="button"
                    variant="blue"
                    size="sm"
                    disabled={shareBusy}
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
                {shareTarget.slug ? (
                  <div className="flex gap-2">
                    <input
                      readOnly
                      className="flex-1 rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 font-mono"
                      value={
                        typeof window !== "undefined"
                          ? `${window.location.origin}/f/${shareTarget.slug}`
                          : `/f/${shareTarget.slug}`
                      }
                      onFocus={(e) => e.target.select()}
                      aria-label="Short form URL"
                    />
                    <Button
                      type="button"
                      variant="blue"
                      size="sm"
                      disabled={shareBusy}
                      onClick={() => copyShareUrl("short")}
                    >
                      {shareCopiedKind === "short" ? "Copied!" : "Copy"}
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-gray-600 rounded-md border border-dashed border-gray-200 bg-gray-50 px-3 py-2">
                    No short link yet. Use{" "}
                    <Link
                      href={`/forms/${shareTarget.id}`}
                      className="font-medium text-blue-700 underline"
                      onClick={closeShareModal}
                    >
                      Edit Form
                    </Link>{" "}
                    to set an optional short path (e.g.{" "}
                    <code className="rounded bg-gray-100 px-1">/f/my-form</code>
                    ).
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button
                type="button"
                variant="black"
                outline
                size="sm"
                onClick={closeShareModal}
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
