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
  managers?: Array<{
    name: string;
    email: string;
  }>;
  fields: FormField[];
  responseCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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

export default function FormDetailPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<Form | null>(null);
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Form>>({});
  const [isEditingManagers, setIsEditingManagers] = useState(false);
  const [potentialManagers, setPotentialManagers] = useState<Array<{
    id: string;
    name: string;
    email: string;
  }>>([]);
  const [selectedManagers, setSelectedManagers] = useState<string[]>([]);

  const { user, loading: authLoading, canCreateForms } = useAuth();
  const router = useRouter();
  const params = useParams();
  const formId = params.formId as string;

  useEffect(() => {
    // Wait for auth to complete before checking user
    if (authLoading) return;

    // Redirect to login if not authenticated
    if (!user) {
      router.push("/login");
      return;
    }

    // Fetch form details and potential managers
    fetchForm();
    fetchPotentialManagers();
  }, [user, authLoading, router, formId]);

  const fetchForm = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/forms/${formId}`);
      
      if (response.ok) {
        const data = await response.json();
        setForm(data.form);
        
        // Initialize responses array
        const initialResponses: FormResponse[] = data.form.fields.map((field: FormField) => ({
          fieldLabel: field.label,
          value: field.type === 'checkbox' ? false : field.type === 'dropdown' ? '' : ''
        }));
        setResponses(initialResponses);
        
        // Initialize selected managers
        if (data.form.managers) {
          setSelectedManagers(data.form.managers.map((m: { id?: string; _id?: string }) => m.id || m._id));
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch form');
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

  const handleResponseChange = (fieldLabel: string, value: string | number | boolean) => {
    setResponses(prev => 
      prev.map(response => 
        response.fieldLabel === fieldLabel 
          ? { ...response, value } 
          : response
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form) return;

    // Validate required fields
    for (const field of form.fields) {
      if (field.required) {
        const response = responses.find(r => r.fieldLabel === field.label);
        if (!response || 
            (typeof response.value === 'string' && !response.value.trim()) ||
            (typeof response.value === 'boolean' && !response.value)) {
          setError(`Field "${field.label}" is required`);
          return;
        }
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
        setSuccess('Form submitted successfully!');
        // Reset form
        const initialResponses: FormResponse[] = form.fields.map(field => ({
          fieldLabel: field.label,
          value: field.type === 'checkbox' ? false : field.type === 'dropdown' ? '' : ''
        }));
        setResponses(initialResponses);
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

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/forms/${formId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editData),
      });

      if (response.ok) {
        const data = await response.json();
        setForm(data.form);
        setIsEditing(false);
        setEditData({});
        setSuccess('Form updated successfully!');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update form');
      }
    } catch (error) {
      setError('Network error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleManagerUpdate = async () => {
    try {
      const response = await fetch(`/api/forms/${formId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ managers: selectedManagers }),
      });

      if (response.ok) {
        const data = await response.json();
        setForm(data.form);
        setIsEditingManagers(false);
        setSuccess('Form managers updated successfully!');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update form managers');
      }
    } catch (error) {
      setError('Network error occurred');
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
            {isFormFiller && (
              <p className="text-blue-600 mt-1 text-sm">You can fill out this form</p>
            )}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => router.push('/forms')}
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              ← Back to Forms
            </button>
            {canEditForm && (
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                {isEditing ? 'Cancel Edit' : 'Edit Form'}
              </button>
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

        {/* Form Info */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
            <div>
              <span className="font-medium">Created by:</span> {form.createdBy.name}
            </div>
            {!isFormFiller && (
              <div>
                <span className="font-medium">Responses:</span> {form.responseCount}
              </div>
            )}
            <div>
              <span className="font-medium">Status:</span> {form.isActive ? 'Active' : 'Inactive'}
            </div>
          </div>
          {!isFormFiller && form.managers && form.managers.length > 0 && (
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

        {/* Manager Management */}
        {canEditForm && (
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Form Managers</h2>
              <button
                onClick={() => setIsEditingManagers(!isEditingManagers)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
              >
                {isEditingManagers ? 'Cancel' : 'Edit Managers'}
              </button>
            </div>
            
            {isEditingManagers ? (
              <div className="space-y-4">
                <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-3">
                  {potentialManagers.map((manager) => (
                    <label key={manager.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedManagers.includes(manager.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedManagers(prev => [...prev, manager.id]);
                          } else {
                            setSelectedManagers(prev => prev.filter(id => id !== manager.id));
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm">
                        {manager.name} ({manager.email})
                      </span>
                    </label>
                  ))}
                  {potentialManagers.length === 0 && (
                    <p className="text-sm text-gray-500 italic">
                      No potential managers found.
                    </p>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={handleManagerUpdate}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => setIsEditingManagers(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-600">
                {form.managers && form.managers.length > 0 ? (
                  <p>Current managers: {form.managers.map(m => m.name).join(', ')}</p>
                ) : (
                  <p>No managers assigned. Click &quot;Edit Managers&quot; to add managers.</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Edit Form */}
        {isEditing && canEditForm && (
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Edit Form</h2>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Form Title
                </label>
                <input
                  type="text"
                  value={editData.title || form.title}
                  onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={editData.description || form.description || ''}
                  onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Form Fields */}
        {form.isActive && canFillForm ? (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              {isFormFiller ? 'Fill Form' : 'Edit Form'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              {form.fields.map((field, index) => (
                <div key={index} className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  
                  {field.type === 'text' && (
                    <input
                      type="text"
                      value={responses.find(r => r.fieldLabel === field.label)?.value as string || ''}
                      onChange={(e) => handleResponseChange(field.label, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required={field.required}
                    />
                  )}

                  {field.type === 'number' && (
                    <input
                      type="number"
                      value={responses.find(r => r.fieldLabel === field.label)?.value as string || ''}
                      onChange={(e) => handleResponseChange(field.label, Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required={field.required}
                    />
                  )}

                  {field.type === 'date' && (
                    <input
                      type="date"
                      value={responses.find(r => r.fieldLabel === field.label)?.value as string || ''}
                      onChange={(e) => handleResponseChange(field.label, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required={field.required}
                    />
                  )}

                  {field.type === 'checkbox' && (
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={responses.find(r => r.fieldLabel === field.label)?.value as boolean || false}
                        onChange={(e) => handleResponseChange(field.label, e.target.checked)}
                        className="mr-2"
                        required={field.required}
                      />
                      <span className="text-sm text-gray-700">Yes</span>
                    </label>
                  )}

                  {field.type === 'dropdown' && (
                    <select
                      value={responses.find(r => r.fieldLabel === field.label)?.value as string || ''}
                      onChange={(e) => handleResponseChange(field.label, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required={field.required}
                    >
                      <option value="">Select an option</option>
                      {field.options?.map((option, optionIndex) => (
                        <option key={optionIndex} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              ))}

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  {submitting ? 'Submitting...' : 'Submit Form'}
                </button>
              </div>
            </form>
          </div>
        ) : !form.isActive ? (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
            This form is currently inactive and not accepting responses.
          </div>
        ) : !canFillForm ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            You don&apos;t have permission to fill this form.
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
    </div>
  );
}
