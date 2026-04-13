'use client';

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/contexts/AuthContext";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import type { FormFieldDefinition } from "@/lib/form-field-types";
import { isDataField } from "@/lib/form-field-types";
import { maxSegmentCount, splitSegments } from "@/lib/segmented-text";

type FormField = FormFieldDefinition;

function formatCellForCsv(
  value: string | number | boolean | string[] | null | undefined,
  field: FormField
): string {
  if (value === null || value === undefined) return "";
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
  respondent: {
    name: string;
    email: string;
  };
  responses: Array<{
    fieldLabel: string;
    value: string | number | boolean | string[];
  }>;
  submittedAt: string;
}

export default function FormResponsesPage() {
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Form | null>(null);
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [exportLoading, setExportLoading] = useState(false);

  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const formId = params.formId as string;

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    fetchFormAndResponses();
  }, [user, authLoading, router, formId]);

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

  const exportToCSV = () => {
    if (!form || responses.length === 0) return;

    setExportLoading(true);

    try {
      const escapeCell = (v: string) =>
        `"${String(v).replace(/"/g, '""')}"`;

      const headers: string[] = [
        "Respondent Name",
        "Respondent Email",
        "Submitted At",
      ];

      const dataFields = form.fields.filter((f) => isDataField(f));
      const segmentedMax = new Map<string, number>();
      for (const field of dataFields) {
        if (field.type !== "segmented_text") continue;
        const delim = field.segmentDelimiter ?? "/";
        const vals = responses.map((r) => {
          const fr = r.responses.find((x) => x.fieldLabel === field.label);
          return fr ? String(fr.value ?? "") : "";
        });
        segmentedMax.set(field.label, maxSegmentCount(vals, delim));
      }

      for (const field of dataFields) {
        if (field.type === "segmented_text") {
          const n = segmentedMax.get(field.label) ?? 0;
          const count = Math.max(1, n);
          for (let i = 0; i < count; i++) {
            headers.push(`${field.label} (${i + 1})`);
          }
        } else {
          headers.push(field.label);
        }
      }

      const csvRows: string[] = [headers.map(escapeCell).join(",")];

      for (const response of responses) {
        const row: string[] = [
          escapeCell(response.respondent.name),
          escapeCell(response.respondent.email),
          escapeCell(new Date(response.submittedAt).toLocaleString()),
        ];

        for (const field of dataFields) {
          const fr = response.responses.find(
            (r) => r.fieldLabel === field.label
          );
          const raw = fr?.value;

          if (field.type === "segmented_text") {
            const delim = field.segmentDelimiter ?? "/";
            const parts = splitSegments(
              fr ? String(raw ?? "") : "",
              delim
            );
            const count = segmentedMax.get(field.label) ?? parts.length;
            const target = Math.max(count, 1);
            for (let i = 0; i < target; i++) {
              row.push(escapeCell(parts[i] ?? ""));
            }
          } else if (field.type === "multiple_choice") {
            row.push(
              escapeCell(
                Array.isArray(raw) ? (raw as string[]).join("; ") : String(raw ?? "")
              )
            );
          } else {
            row.push(escapeCell(formatCellForCsv(raw, field)));
          }
        }

        csvRows.push(row.join(","));
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
    if (value === null || value === undefined) return "—";

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
      case "segmented_text": {
        const delim = field.segmentDelimiter ?? "/";
        const parts = splitSegments(String(value), delim);
        if (parts.length === 0) return "—";
        return (
          <table className="mt-1 min-w-[240px] border-collapse border border-gray-200 text-sm">
            <thead>
              <tr>
                {parts.map((_, i) => (
                  <th
                    key={i}
                    className="border border-gray-200 bg-gray-100 px-2 py-1 text-left font-medium text-gray-700"
                  >
                    Part {i + 1}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {parts.map((p, i) => (
                  <td
                    key={i}
                    className="border border-gray-200 px-2 py-1 text-gray-900"
                  >
                    {p || "—"}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
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
            <p className="text-gray-600 mt-2">{form.title}</p>
            {form.description && (
              <p className="text-gray-500 mt-1">{form.description}</p>
            )}
          </div>
          <div className="flex space-x-2">
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
            <div>
              <span className="font-medium">Created by:</span> {form.createdBy.name}
            </div>
            <div>
              <span className="font-medium">Total Responses:</span> {responses.length}
            </div>
            <div>
              <span className="font-medium">Status:</span> {form.isActive ? 'Active' : 'Inactive'}
            </div>
          </div>
          {form.managers && form.managers.length > 0 && (
            <div className="mt-4">
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

        {/* Responses */}
        {responses.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No responses yet</h3>
            <p className="text-gray-600">
              This form hasn&apos;t received any responses yet.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {responses.map((response, index) => (
              <div key={response.id} className="bg-white p-6 rounded-lg shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Response #{index + 1}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Submitted by {response.respondent.name} ({response.respondent.email})
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(response.submittedAt).toLocaleString()}
                    </p>
                  </div>
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
                              <p className="mt-1 text-sm text-gray-600 whitespace-pre-wrap">
                                {field.sectionDescription}
                              </p>
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