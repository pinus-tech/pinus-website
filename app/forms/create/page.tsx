"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/AuthContext";
import type { FormFieldDefinition } from "@/lib/form-field-types";
import { FormFieldsEditor } from "@/app/components/forms/FormFieldsEditor";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Button } from "@/app/components/ui/button";
import { Checkbox } from "@/app/components/ui/checkbox";

type FormField = FormFieldDefinition;

interface FormData {
  title: string;
  description: string;
  fields: FormField[];
  managers: string[];
  /** Optional short path segment for /f/{shortLink} */
  shortLink: string;
}

export default function CreateFormPage() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    fields: [],
    managers: [],
    shortLink: '',
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
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          fields: formData.fields,
          managers: formData.managers,
          ...(formData.shortLink.trim()
            ? { shortLink: formData.shortLink.trim() }
            : {}),
        }),
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
                <Input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Enter form title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={3}
                  placeholder="Enter form description (optional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Short link (optional)
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Share <code className="rounded bg-gray-100 px-1">/f/&lt;slug&gt;</code>{" "}
                  instead of the long form URL. Letters, numbers, and hyphens
                  only. If the slug is taken, a suffix like{" "}
                  <span className="font-mono">my-form-2</span> is added
                  automatically.
                </p>
                <Input
                  type="text"
                  value={formData.shortLink}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      shortLink: e.target.value,
                    }))
                  }
                  placeholder="e.g. form1"
                  className="font-mono"
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <FormFieldsEditor
              fields={formData.fields}
              onChange={(fields) =>
                setFormData((prev) => ({ ...prev, fields }))
              }
            />
          </div>

          {/* Manager Selection */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Form Managers (Optional)</h2>
            <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-300 rounded-md p-3">
              {potentialManagers.map((manager) => (
                <div key={manager.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`create-mgr-${manager.id}`}
                    checked={formData.managers.includes(manager.id)}
                    onCheckedChange={(checked) => {
                      if (checked === true) {
                        setFormData((prev) => ({
                          ...prev,
                          managers: [...prev.managers, manager.id],
                        }));
                      } else {
                        setFormData((prev) => ({
                          ...prev,
                          managers: prev.managers.filter(
                            (id) => id !== manager.id
                          ),
                        }));
                      }
                    }}
                  />
                  <label
                    htmlFor={`create-mgr-${manager.id}`}
                    className="text-sm cursor-pointer"
                  >
                    {manager.name} ({manager.email})
                  </label>
                </div>
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
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="black"
              outline
              onClick={() => router.push("/forms")}
            >
              Cancel
            </Button>
            <Button type="submit" variant="blue" disabled={loading}>
              {loading ? "Creating..." : "Create Form"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
