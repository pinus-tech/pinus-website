'use client';

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/contexts/AuthContext";
import Link from "next/link";

interface FormField {
  label: string;
  type: 'text' | 'number' | 'date' | 'checkbox' | 'dropdown';
  required: boolean;
  options?: string[];
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
    value: string | number | boolean;
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
      // Create CSV header
      const headers = ['Respondent Name', 'Respondent Email', 'Submitted At'];
      form.fields.forEach(field => {
        headers.push(field.label);
      });

      // Create CSV rows
      const csvRows = [headers.join(',')];
      
      responses.forEach(response => {
        const row = [
          `"${response.respondent.name}"`,
          `"${response.respondent.email}"`,
          `"${new Date(response.submittedAt).toLocaleString()}"`
        ];

        form.fields.forEach(field => {
          const fieldResponse = response.responses.find(r => r.fieldLabel === field.label);
          const value = fieldResponse ? String(fieldResponse.value) : '';
          row.push(`"${value}"`);
        });

        csvRows.push(row.join(','));
      });

      // Create and download CSV file
      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${form.title}_responses.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      setError('Failed to export CSV');
    } finally {
      setExportLoading(false);
    }
  };

  const formatResponseValue = (value: string | number | boolean | null | undefined, fieldType: string) => {
    if (value === null || value === undefined) return 'N/A';
    
    switch (fieldType) {
      case 'checkbox':
        return value ? 'Yes' : 'No';
      case 'date':
        return new Date(String(value)).toLocaleDateString();
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
                    const fieldResponse = response.responses.find(r => r.fieldLabel === field.label);
                    const value = fieldResponse ? fieldResponse.value : null;

                    return (
                      <div key={fieldIndex} className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          {field.label}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded border">
                          {formatResponseValue(value, field.type)}
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