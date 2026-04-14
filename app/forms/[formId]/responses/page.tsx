'use client';

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useParams, useSearchParams, usePathname } from "next/navigation";
import { loginUrlFromPathnameAndSearch } from "@/lib/login-callback";
import { useAuth } from "@/lib/contexts/AuthContext";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import type { FormFieldDefinition } from "@/lib/form-field-types";
import { isDataField } from "@/lib/form-field-types";
import {
  maxSegmentCount,
  parseSegmentPathTemplate,
  segmentPartAtLine,
  splitSegments,
  splitSegmentInputLines,
  subRowsForResponse,
} from "@/lib/segmented-text";
import { FormAttachmentViewer } from "@/app/components/forms/FormAttachmentViewer";
import { DescriptionContent } from "@/app/components/DescriptionContent";

type FormField = FormFieldDefinition;

function formatCellForCsv(
  value: string | number | boolean | string[] | null | undefined,
  field: FormField
): string {
  if (value === null || value === undefined) return "";
  if (field.type === "file_upload") {
    return String(value ?? "").trim();
  }
  if (field.type === "multiple_choice" && Array.isArray(value)) {
    return (value as string[]).join("; ");
  }
  if (field.type === "checkbox") return value ? "Yes" : "No";
  if (field.type === "date") {
    const mode = field.dateMode ?? "date";
    const s = String(value);
    if (mode === "time") return s;
    if (mode === "date") return s;
    try {
      return format(parseISO(s), "yyyy-MM-dd HH:mm");
    } catch {
      return s;
    }
  }
  return String(value);
}

interface Form {
  id: string;
  title: string;
  description?: string;
  createdBy: {
    name: string;
    email: string;
  };
  managers: Array<{
    name: string;
    email: string;
  }>;
  fields: FormField[];
  responseCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface FormResponse {
  id: string;
  /** Present for normal submissions; may be missing in edge cases. */
  respondent?: {
    name: string;
    email: string;
    telegram?: string;
    phoneNumber?: string;
  } | null;
  responses: Array<{
    fieldLabel: string;
    value: string | number | boolean | string[];
  }>;
  submittedAt: string;
}

function formatPlainCell(
  value: string | number | boolean | string[] | null | undefined,
  field: FormField
): string {
  if (value === null || value === undefined) return "";
  if (field.type === "file_upload") {
    return String(value ?? "").trim();
  }
  if (field.type === "multiple_choice" && Array.isArray(value)) {
    return (value as string[]).join("; ");
  }
  if (field.type === "checkbox") return value ? "Yes" : "No";
  if (field.type === "date") {
    const mode = field.dateMode ?? "date";
    const s = String(value);
    if (mode === "time") return s;
    if (mode === "date") return s;
    try {
      return format(parseISO(s), "yyyy-MM-dd HH:mm");
    } catch {
      return s;
    }
  }
  return String(value);
}

function FormResponsesPageContent() {
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Form | null>(null);
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { user, loading: authLoading } = useAuth();
  const isSiteAdmin = !!(user?.isSuperAdmin || user?.isAdmin);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = useParams();
  const formId = params.formId as string;

  const viewMode: "cards" | "table" =
    searchParams.get("showAs") === "card" ? "cards" : "table";

  const setShowAs = (next: "card" | "table") => {
    const paramsNext = new URLSearchParams(searchParams.toString());
    paramsNext.set("showAs", next);
    const q = paramsNext.toString();
    router.replace(q ? `${pathname}?${q}` : pathname);
  };

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push(loginUrlFromPathnameAndSearch(pathname, searchParams));
      return;
    }

    fetchFormAndResponses();
  }, [user, authLoading, router, formId, pathname, searchParams]);

  useEffect(() => {
    const msg = error?.trim().toLowerCase() ?? "";
    if (!msg.includes("internal server error")) return;
    if (typeof window === "undefined") return;
    const key = `pinus-fr-ise-retry-${formId}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    window.location.reload();
  }, [error, formId]);

  const dataFields = useMemo(
    () => (form ? form.fields.filter((f) => isDataField(f)) : []),
    [form]
  );

  const segmentedMaxByLabel = useMemo(() => {
    const m = new Map<string, number>();
    if (!form) return m;
    for (const field of dataFields) {
      if (field.type !== "segmented_text") continue;
      const delim = field.segmentDelimiter ?? "/";
      const tpl = parseSegmentPathTemplate(field.segmentPathTemplate, delim);
      if (tpl.length > 0) {
        m.set(field.label, tpl.length);
        continue;
      }
      const vals = responses.map((r) => {
        const fr = r.responses.find((x) => x.fieldLabel === field.label);
        return fr ? String(fr.value ?? "") : "";
      });
      m.set(field.label, maxSegmentCount(vals, delim));
    }
    return m;
  }, [form, responses, dataFields]);

  const tableColumns = useMemo(() => {
    const cols: { key: string; label: string; field: FormField; partIndex?: number }[] =
      [];
    for (const field of dataFields) {
      if (field.type === "segmented_text") {
        const delim = field.segmentDelimiter ?? "/";
        const tpl = parseSegmentPathTemplate(field.segmentPathTemplate, delim);
        const n = Math.max(
          1,
          tpl.length > 0
            ? tpl.length
            : segmentedMaxByLabel.get(field.label) ?? 1
        );
        for (let i = 0; i < n; i++) {
          const partLabel =
            tpl[i] != null ? `${field.label}-${tpl[i]}` : `${field.label} (${i + 1})`;
          cols.push({
            key: `${field.label}::${i}`,
            label: partLabel,
            field,
            partIndex: i,
          });
        }
      } else {
        cols.push({ key: field.label, label: field.label, field });
      }
    }
    return cols;
  }, [dataFields, segmentedMaxByLabel]);

  const tableRowEntries = useMemo(() => {
    const rows: {
      response: FormResponse;
      responseIndex: number;
      subRow: number;
    }[] = [];
    responses.forEach((response, responseIndex) => {
      const k = subRowsForResponse(response, dataFields);
      for (let sub = 0; sub < k; sub++) {
        rows.push({ response, responseIndex, subRow: sub });
      }
    });
    return rows;
  }, [responses, dataFields]);

  const fetchFormAndResponses = async () => {
    try {
      setLoading(true);
      
      // Fetch form details
      const formResponse = await fetch(`/api/forms/${formId}`);
      if (!formResponse.ok) {
        const errorData = await formResponse.json();
        setError(errorData.error || 'Failed to fetch form');
        return;
      }
      const formData = await formResponse.json();
      setForm(formData.form);

      // Fetch responses
      const responsesResponse = await fetch(`/api/forms/${formId}/responses`);
      if (!responsesResponse.ok) {
        const errorData = await responsesResponse.json();
        setError(errorData.error || 'Failed to fetch responses');
        return;
      }
      const responsesData = await responsesResponse.json();
      setResponses(responsesData.responses);
      if (typeof window !== "undefined") {
        sessionStorage.removeItem(`pinus-fr-ise-retry-${formId}`);
      }
    } catch (error) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const canViewResponses = user && form && (
    user.isSuperAdmin || 
    user.isAdmin || 
    form.createdBy.email === user.email ||
    form.managers?.some(manager => manager.email === user.email)
  );

  const deleteResponse = async (responseId: string) => {
    if (!canViewResponses) return;
    if (!window.confirm("Delete this response permanently?")) return;
    setDeletingId(responseId);
    setError(null);
    try {
      const res = await fetch(
        `/api/forms/${formId}/responses/${responseId}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "Failed to delete");
        return;
      }
      setResponses((prev) => prev.filter((r) => r.id !== responseId));
      setForm((prev) =>
        prev
          ? {
              ...prev,
              responseCount: Math.max(0, prev.responseCount - 1),
            }
          : prev
      );
    } catch {
      setError("Failed to delete response");
    } finally {
      setDeletingId(null);
    }
  };

  const exportToCSV = () => {
    if (!form || responses.length === 0) return;

    setExportLoading(true);

    try {
      const escapeCell = (v: string) =>
        `"${String(v).replace(/"/g, '""')}"`;

      const headers: string[] = [
        "Respondent Name",
        "Respondent Email",
        "Phone",
        "Telegram",
        "Submitted At",
      ];

      const dataFields = form.fields.filter((f) => isDataField(f));
      const segmentedMax = new Map<string, number>();
      for (const field of dataFields) {
        if (field.type !== "segmented_text") continue;
        const delim = field.segmentDelimiter ?? "/";
        const tpl = parseSegmentPathTemplate(field.segmentPathTemplate, delim);
        if (tpl.length > 0) {
          segmentedMax.set(field.label, tpl.length);
          continue;
        }
        const vals = responses.map((r) => {
          const fr = r.responses.find((x) => x.fieldLabel === field.label);
          return fr ? String(fr.value ?? "") : "";
        });
        segmentedMax.set(field.label, maxSegmentCount(vals, delim));
      }

      for (const field of dataFields) {
        if (field.type === "segmented_text") {
          const delim = field.segmentDelimiter ?? "/";
          const tpl = parseSegmentPathTemplate(field.segmentPathTemplate, delim);
          const n = Math.max(
            1,
            tpl.length > 0
              ? tpl.length
              : segmentedMax.get(field.label) ?? 1
          );
          for (let i = 0; i < n; i++) {
            const partLabel =
              tpl[i] != null
                ? `${field.label}-${tpl[i]}`
                : `${field.label} (${i + 1})`;
            headers.push(partLabel);
          }
        } else {
          headers.push(field.label);
        }
      }

      const csvRows: string[] = [headers.map(escapeCell).join(",")];

      for (const response of responses) {
        const subCount = subRowsForResponse(response, dataFields);
        for (let subRow = 0; subRow < subCount; subRow++) {
          const row: string[] = [
            subRow === 0 ? escapeCell(response.respondent?.name ?? "") : '""',
            subRow === 0 ? escapeCell(response.respondent?.email ?? "") : '""',
            subRow === 0 ? escapeCell(response.respondent?.phoneNumber ?? "") : '""',
            subRow === 0 ? escapeCell(response.respondent?.telegram ?? "") : '""',
            subRow === 0
              ? escapeCell(new Date(response.submittedAt).toLocaleString())
              : '""',
          ];

          for (const field of dataFields) {
            const fr = response.responses.find(
              (r) => r.fieldLabel === field.label
            );
            const raw = fr?.value;

            if (field.type === "segmented_text") {
              const delim = field.segmentDelimiter ?? "/";
              const target =
                segmentedMax.get(field.label) ?? 1;
              for (let i = 0; i < target; i++) {
                const cell = segmentPartAtLine(
                  fr ? String(raw ?? "") : "",
                  delim,
                  i,
                  subRow
                );
                row.push(escapeCell(cell));
              }
            } else if (subRow === 0) {
              if (field.type === "multiple_choice") {
                row.push(
                  escapeCell(
                    Array.isArray(raw)
                      ? (raw as string[]).join("; ")
                      : String(raw ?? "")
                  )
                );
              } else {
                row.push(escapeCell(formatCellForCsv(raw, field)));
              }
            } else {
              row.push('""');
            }
          }

          csvRows.push(row.join(","));
        }
      }

      const csvContent = csvRows.join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `${form.title}_responses.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      setError("Failed to export CSV");
    } finally {
      setExportLoading(false);
    }
  };

  const formatResponseValue = (
    value: string | number | boolean | string[] | null | undefined,
    field: FormField
  ) => {
    if (value === null || value === undefined) return "-";

    switch (field.type) {
      case "checkbox":
        return value ? "Yes" : "No";
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
      case "multiple_choice":
        return Array.isArray(value) ? (value as string[]).join(", ") : String(value);
      case "file_upload": {
        const u = String(value ?? "").trim();
        if (!u) return "-";
        return <FormAttachmentViewer url={u} />;
      }
      case "segmented_text": {
        const delim = field.segmentDelimiter ?? "/";
        const tpl = parseSegmentPathTemplate(field.segmentPathTemplate, delim);
        const lines = splitSegmentInputLines(String(value));
        if (lines.length === 0) return "-";
        return (
          <div className="space-y-3">
            {lines.map((line, lineIdx) => {
              const parts = splitSegments(line, delim);
              const heads =
                tpl.length > 0
                  ? tpl.map((t) => `${field.label}-${t}`)
                  : parts.map((_, i) => `Part ${i + 1}`);
              const n = Math.max(heads.length, parts.length);
              return (
                <table
                  key={lineIdx}
                  className="min-w-[240px] border-collapse border border-gray-200 text-sm"
                >
                  <thead>
                    <tr>
                      {Array.from({ length: n }, (_, i) => (
                        <th
                          key={i}
                          className="border border-gray-200 bg-gray-100 px-2 py-1 text-left font-medium text-gray-700"
                        >
                          {heads[i] ?? `Part ${i + 1}`}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      {Array.from({ length: n }, (_, i) => (
                        <td
                          key={i}
                          className="border border-gray-200 px-2 py-1 text-gray-900"
                        >
                          {(parts[i] ?? "") || "-"}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              );
            })}
          </div>
        );
      }
      default:
        return String(value);
    }
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
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error || 'Form not found'}
          </div>
        </div>
      </div>
    );
  }

  if (!canViewResponses) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            You don&apos;t have permission to view responses for this form.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Form Responses</h1>
            <p className="text-gray-500 mt-1 text-sm">
              {responses.length} response{responses.length === 1 ? "" : "s"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 items-center justify-end">
            <div className="flex rounded-lg border border-gray-200 bg-white p-0.5 text-sm">
              <button
                type="button"
                onClick={() => setShowAs("card")}
                className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
                  viewMode === "cards"
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                Cards
              </button>
              <button
                type="button"
                onClick={() => setShowAs("table")}
                className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
                  viewMode === "table"
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                Table
              </button>
            </div>
            <button
              onClick={exportToCSV}
              disabled={exportLoading || responses.length === 0}
              className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              {exportLoading ? 'Exporting...' : 'Export CSV'}
            </button>
            <Link
              href={`/forms/${formId}`}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Back to Form
            </Link>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Form Info */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
            {isSiteAdmin && (
              <div>
                <span className="font-medium">Created by:</span>{" "}
                {form.createdBy?.name ?? "-"}
              </div>
            )}
            <div>
              <span className="font-medium">Total Responses:</span> {responses.length}
            </div>
            <div>
              <span className="font-medium">Status:</span> {form.isActive ? 'Active' : 'Inactive'}
            </div>
          </div>
          {isSiteAdmin && form.managers && form.managers.length > 0 && (
            <div className="mt-4">
              <span className="font-medium text-sm text-gray-600">Managers:</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {form.managers.map((manager, index) => (
                  <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                    {manager?.name ?? "-"}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Responses */}
        {responses.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No responses yet</h3>
            <p className="text-gray-600">
              This form hasn&apos;t received any responses yet.
            </p>
          </div>
        ) : viewMode === "table" ? (
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="sticky left-0 z-10 bg-gray-50 px-3 py-2 text-left font-semibold text-gray-900">
                    #
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-900 whitespace-nowrap">
                    Respondent
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-900 whitespace-nowrap">
                    Email
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-900 whitespace-nowrap">
                    Phone
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-900 whitespace-nowrap">
                    Telegram
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-900 whitespace-nowrap">
                    Submitted
                  </th>
                  {tableColumns.map((col) => (
                    <th
                      key={col.key}
                      className="px-3 py-2 text-left font-semibold text-gray-900 whitespace-nowrap min-w-[120px]"
                    >
                      {col.label}
                    </th>
                  ))}
                  <th className="px-3 py-2 text-left font-semibold text-gray-900 whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tableRowEntries.map(
                  ({ response, responseIndex, subRow }) => (
                  <tr
                    key={`${response.id}-${subRow}`}
                    className="hover:bg-gray-50/80"
                  >
                    <td className="sticky left-0 z-10 bg-white px-3 py-2 text-gray-600">
                      {subRow === 0 ? responseIndex + 1 : ""}
                    </td>
                    <td className="px-3 py-2 text-gray-900 whitespace-nowrap">
                      {subRow === 0 ? response.respondent?.name ?? "-" : ""}
                    </td>
                    <td className="px-3 py-2 text-gray-700 whitespace-nowrap">
                      {subRow === 0 ? response.respondent?.email ?? "-" : ""}
                    </td>
                    <td className="px-3 py-2 text-gray-700 whitespace-nowrap">
                      {subRow === 0
                        ? response.respondent?.phoneNumber?.trim() || "-"
                        : ""}
                    </td>
                    <td className="px-3 py-2 text-gray-700 whitespace-nowrap">
                      {subRow === 0
                        ? response.respondent?.telegram?.trim() || "-"
                        : ""}
                    </td>
                    <td className="px-3 py-2 text-gray-600 whitespace-nowrap">
                      {subRow === 0
                        ? new Date(response.submittedAt).toLocaleString()
                        : ""}
                    </td>
                    {tableColumns.map((col) => {
                      const fr = response.responses.find(
                        (r) => r.fieldLabel === col.field.label
                      );
                      const raw = fr?.value;
                      if (col.field.type === "file_upload") {
                        const u =
                          subRow === 0 && raw != null
                            ? String(raw).trim()
                            : "";
                        return (
                          <td
                            key={col.key}
                            className="px-3 py-2 text-gray-900 align-top"
                          >
                            {u ? (
                              <FormAttachmentViewer url={u} compact />
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                        );
                      }
                      let cell = "";
                      if (
                        col.partIndex !== undefined &&
                        col.field.type === "segmented_text"
                      ) {
                        const delim = col.field.segmentDelimiter ?? "/";
                        cell = segmentPartAtLine(
                          raw != null ? String(raw) : "",
                          delim,
                          col.partIndex,
                          subRow
                        );
                      } else if (subRow === 0) {
                        cell = formatPlainCell(raw, col.field);
                      }
                      return (
                        <td key={col.key} className="px-3 py-2 text-gray-900 max-w-[280px]">
                          <span className="line-clamp-4 break-words">
                            {cell || "-"}
                          </span>
                        </td>
                      );
                    })}
                    <td className="px-3 py-2 whitespace-nowrap">
                      {subRow === 0 ? (
                        <button
                          type="button"
                          onClick={() => deleteResponse(response.id)}
                          disabled={deletingId === response.id}
                          className="text-red-600 hover:text-red-800 hover:underline disabled:opacity-50 text-sm font-medium"
                        >
                          {deletingId === response.id ? "…" : "Delete"}
                        </button>
                      ) : null}
                    </td>
                  </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="space-y-6">
            {responses.map((response, index) => (
              <div key={response.id} className="bg-white p-6 rounded-lg shadow">
                <div className="flex justify-between items-start mb-4 gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Response #{index + 1}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Submitted by {response.respondent?.name ?? "-"} (
                      {response.respondent?.email ?? "-"})
                    </p>
                    <p className="text-sm text-gray-600">
                      Phone: {response.respondent?.phoneNumber?.trim() || "-"}
                    </p>
                    <p className="text-sm text-gray-600">
                      Telegram: {response.respondent?.telegram?.trim() || "-"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(response.submittedAt).toLocaleString()}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteResponse(response.id)}
                    disabled={deletingId === response.id}
                    className="shrink-0 text-red-600 hover:text-red-800 border border-red-200 rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-red-50 disabled:opacity-50"
                  >
                    {deletingId === response.id ? "Deleting…" : "Delete response"}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {form.fields.map((field, fieldIndex) => {
                    if (field.type === "section") {
                      return (
                        <div
                          key={fieldIndex}
                          className="md:col-span-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3"
                        >
                          {(field.sectionDisplay ?? "both") !==
                            "description_only" &&
                            (field.sectionTitle?.trim() || field.label) && (
                              <h4 className="text-base font-semibold text-gray-900">
                                {field.sectionTitle?.trim() || field.label}
                              </h4>
                            )}
                          {(field.sectionDisplay ?? "both") !== "title_only" &&
                            field.sectionDescription?.trim() && (
                              <div className="mt-1 text-sm text-gray-600">
                                <DescriptionContent
                                  text={field.sectionDescription}
                                  asMarkdown={
                                    !!field.sectionDescriptionMarkdown
                                  }
                                  className="text-sm text-gray-600"
                                />
                              </div>
                            )}
                        </div>
                      );
                    }

                    const fieldResponse = response.responses.find(
                      (r) => r.fieldLabel === field.label
                    );
                    const value = fieldResponse ? fieldResponse.value : null;

                    return (
                      <div
                        key={fieldIndex}
                        className={
                          field.type === "segmented_text"
                            ? "space-y-2 md:col-span-2"
                            : "space-y-2"
                        }
                      >
                        <label className="block text-sm font-medium text-gray-700">
                          {field.label}
                          {field.required && (
                            <span className="text-red-500 ml-1">*</span>
                          )}
                        </label>
                        <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded border overflow-x-auto">
                          {formatResponseValue(value, field)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function FormResponsesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-main" />
        </div>
      }
    >
      <FormResponsesPageContent />
    </Suspense>
  );
} 