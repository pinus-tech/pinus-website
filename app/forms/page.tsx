"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import Link from "next/link";

interface Form {
  id: string;
  title: string;
  description?: string;
  createdBy: {
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
  createdAt: string;
  updatedAt: string;
  managers?: Array<{
    name: string;
    email: string;
  }>;
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

  const { user, loading: authLoading, canCreateForms } = useAuth();

  useEffect(() => {
    // Wait for auth to complete before checking user
    if (authLoading) return;

    // Redirect to login if not authenticated
    if (!user) {
      window.location.href = "/login";
      return;
    }

    // Fetch forms
    fetchForms();
  }, [user, authLoading]);

  const fetchForms = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/forms');
      
      if (response.ok) {
        const data = await response.json();
        setForms(data.forms);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch forms');
      }
    } catch (error) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const deleteForm = async (formId: string) => {
    if (!confirm('Are you sure you want to delete this form? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/forms/${formId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove form from list
        setForms(forms.filter(form => form.id !== formId));
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to delete form');
      }
    } catch (error) {
      alert('Network error occurred');
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">No forms found</h3>
            <p className="text-gray-600 mb-4">
              {user.isSuperAdmin || canCreateForms() 
                ? "Create your first form to get started."
                : "You don't have any forms assigned to you yet."
              }
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
                      <p>Created by: {form.createdBy.name}</p>
                      {form.managers && form.managers.length > 0 && (
                        <p>Managers: {form.managers.map(m => m.name).join(', ')}</p>
                      )}
                      <p>Fields: {form.fields.length}</p>
                      <p>Responses: {form.responseCount}</p>
                      <p>Status: {form.isActive ? 'Active' : 'Inactive'}</p>
                      <p>Created: {new Date(form.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {form.userPermissions?.canFill && (
                      <Link
                        href={`/forms/${form.id}`}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                      >
                        Fill Form
                      </Link>
                    )}
                    {form.userPermissions?.canEdit && (
                      <Link
                        href={`/forms/${form.id}`}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                      >
                        Edit Form
                      </Link>
                    )}
                    {form.userPermissions?.canViewResponses && (
                      <Link
                        href={`/forms/${form.id}/responses`}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                      >
                        View Responses ({form.responseCount})
                      </Link>
                    )}
                    {(user.isSuperAdmin || form.createdBy.email === user.email) && (
                      <button
                        onClick={() => deleteForm(form.id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>

                {/* Field types preview */}
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Field Types:</h4>
                  <div className="flex flex-wrap gap-2">
                    {form.fields.map((field, index) => (
                      <span
                        key={index}
                        className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs"
                      >
                        {field.label} ({field.type})
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Permission info */}
        <div className="mt-8 bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Your Permissions</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p>• Current user: {user.name} ({user.email})</p>
            <p>• Is Admin: {user.isAdmin ? "Yes" : "No"}</p>
            <p>• Is Super Admin: {user.isSuperAdmin ? "Yes" : "No"}</p>
            <p>• Can Create Forms: {user.isSuperAdmin || canCreateForms() ? "Yes" : "No"}</p>
            <p>• Can Manage Forms: {user.isSuperAdmin || user.isAdmin ? "All forms" : "Your forms only"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
