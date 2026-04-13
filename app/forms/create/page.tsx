"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/AuthContext";
import type {
  FormFieldDefinition,
  FormFieldType,
} from "@/lib/form-field-types";

type FormField = FormFieldDefinition;

interface FormData {
  title: string;
  description: string;
  fields: FormField[];
  managers: string[];
}

export default function CreateFormPage() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    fields: [],
    managers: []
  });
  const [error, setError] = useState<string | null>(null);
  const [potentialManagers, setPotentialManagers] = useState<Array<{
    id: string;
    name: string;
    email: string;
  }>>([]);

  const { user, canCreateForms, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    // Redirect if not authenticated
    if (!user) {
      router.push("/login");
      return;
    }

    // Allow access if user is super admin OR has canCreateForms permission
    if (!user.isSuperAdmin && !canCreateForms()) {
      router.push("/forms");
      return;
    }

    // Fetch potential managers
    fetchPotentialManagers();
  }, [user, canCreateForms, router]);

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

  const addField = () => {
    setFormData((prev) => ({
      ...prev,
      fields: [
        ...prev.fields,
        {
          label: "",
          type: "text",
          required: false,
          options: [],
        },
      ],
    }));
  };

  const updateField = (index: number, field: Partial<FormField>) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.map((f, i) => 
        i === index ? { ...f, ...field } : f
      )
    }));
  };

  const removeField = (index: number) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== index)
    }));
  };

  const addOption = (fieldIndex: number) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.map((field, i) => 
        i === fieldIndex 
          ? { ...field, options: [...(field.options || []), ''] }
          : field
      )
    }));
  };

  const updateOption = (fieldIndex: number, optionIndex: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.map((field, i) => 
        i === fieldIndex 
          ? { 
              ...field, 
              options: field.options?.map((opt, j) => 
                j === optionIndex ? value : opt
              )
            }
          : field
      )
    }));
  };

  const removeOption = (fieldIndex: number, optionIndex: number) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.map((field, i) => 
        i === fieldIndex 
          ? { 
              ...field, 
              options: field.options?.filter((_, j) => j !== optionIndex)
            }
          : field
      )
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError('Form title is required');
      return;
    }

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
        body: JSON.stringify(formData),
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
                  Form Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter form title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Enter form description (optional)"
                />
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Form Fields</h2>
              <button
                type="button"
                onClick={addField}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Add Field
              </button>
            </div>

            {formData.fields.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No fields added yet. Click &quot;Add Field&quot; to get started.
              </p>
            ) : (
              <div className="space-y-4">
                {formData.fields.map((field, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        Field {index + 1}
                      </h3>
                      <button
                        type="button"
                        onClick={() => removeField(index)}
                        className="text-red-600 hover:text-red-800 font-medium"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Field Label *
                        </label>
                        <input
                          type="text"
                          value={field.label}
                          onChange={(e) => updateField(index, { label: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter field label"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Field Type *
                        </label>
                        <select
                          value={field.type}
                          onChange={(e) => {
                            const t = e.target.value as FormFieldType;
                            const patch: Partial<FormField> = { type: t };
                            if (t === "date") patch.dateMode = "date";
                            if (t === "dropdown" || t === "multiple_choice") {
                              patch.options =
                                field.options?.length ? field.options : [""];
                            }
                            if (t === "section") {
                              patch.required = false;
                              patch.sectionDisplay = field.sectionDisplay ?? "both";
                              patch.sectionTitle = field.sectionTitle ?? "";
                              patch.sectionDescription =
                                field.sectionDescription ?? "";
                            }
                            if (t === "segmented_text") {
                              patch.segmentDelimiter =
                                field.segmentDelimiter ?? "/";
                            }
                            updateField(index, patch);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="text">Text input</option>
                          <option value="number">Number</option>
                          <option value="date">Date / time</option>
                          <option value="checkbox">Checkbox (yes/no)</option>
                          <option value="dropdown">Dropdown (single choice)</option>
                          <option value="multiple_choice">
                            Multiple choice
                          </option>
                          <option value="segmented_text">
                            Path / structured text
                          </option>
                          <option value="section">
                            Section (title / description only)
                          </option>
                        </select>
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={field.required}
                          disabled={field.type === "section"}
                          onChange={(e) =>
                            updateField(index, { required: e.target.checked })
                          }
                          className="mr-2"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          Required field
                        </span>
                      </label>
                    </div>

                    {field.type === "date" && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Date field collects
                        </label>
                        <select
                          value={field.dateMode ?? "date"}
                          onChange={(e) =>
                            updateField(index, {
                              dateMode: e.target.value as FormField["dateMode"],
                            })
                          }
                          className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="date">Date only</option>
                          <option value="datetime">Date and time</option>
                          <option value="time">Time only</option>
                        </select>
                      </div>
                    )}

                    {field.type === "section" && (
                      <div className="mt-4 space-y-3 rounded-md border border-dashed border-gray-300 bg-gray-50 p-4">
                        <label className="block text-sm font-medium text-gray-700">
                          Show
                        </label>
                        <select
                          value={field.sectionDisplay ?? "both"}
                          onChange={(e) =>
                            updateField(index, {
                              sectionDisplay: e.target
                                .value as FormField["sectionDisplay"],
                            })
                          }
                          className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md bg-white"
                        >
                          <option value="both">Title and description</option>
                          <option value="title_only">Title only</option>
                          <option value="description_only">
                            Description only
                          </option>
                        </select>
                        {(field.sectionDisplay ?? "both") !==
                          "description_only" && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Section title
                            </label>
                            <input
                              type="text"
                              value={field.sectionTitle ?? ""}
                              onChange={(e) =>
                                updateField(index, {
                                  sectionTitle: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                              placeholder="Heading shown to respondents"
                            />
                          </div>
                        )}
                        {(field.sectionDisplay ?? "both") !== "title_only" && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Section description
                            </label>
                            <textarea
                              value={field.sectionDescription ?? ""}
                              onChange={(e) =>
                                updateField(index, {
                                  sectionDescription: e.target.value,
                                })
                              }
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                              placeholder="Supporting text (optional)"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {field.type === "segmented_text" && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Path separator (split on this character)
                        </label>
                        <input
                          type="text"
                          value={field.segmentDelimiter ?? "/"}
                          onChange={(e) =>
                            updateField(index, {
                              segmentDelimiter: e.target.value || "/",
                            })
                          }
                          className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md font-mono"
                          placeholder="/"
                          maxLength={8}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Example: <code>cilla/off-camp/1234/message</code> with
                          &quot;/&quot;
                        </p>
                      </div>
                    )}

                    {/* Dropdown / multiple choice options */}
                    {(field.type === "dropdown" ||
                      field.type === "multiple_choice") && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Options *
                        </label>
                        <div className="space-y-2">
                          {field.options?.map((option, optionIndex) => (
                            <div key={optionIndex} className="flex items-center space-x-2">
                              <input
                                type="text"
                                value={option}
                                onChange={(e) => updateOption(index, optionIndex, e.target.value)}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder={`Option ${optionIndex + 1}`}
                                required
                              />
                              <button
                                type="button"
                                onClick={() => removeOption(index, optionIndex)}
                                className="text-red-600 hover:text-red-800 px-2 py-2"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => addOption(index)}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            + Add Option
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Manager Selection */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Form Managers (Optional)</h2>
            <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-300 rounded-md p-3">
              {potentialManagers.map((manager) => (
                <label key={manager.id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.managers.includes(manager.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData(prev => ({
                          ...prev,
                          managers: [...prev.managers, manager.id]
                        }));
                      } else {
                        setFormData(prev => ({
                          ...prev,
                          managers: prev.managers.filter(id => id !== manager.id)
                        }));
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
                  No potential managers found. Only users with form creation permission can be managers.
                </p>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Managers can view responses and edit this form.
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.push('/forms')}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              {loading ? 'Creating...' : 'Create Form'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
