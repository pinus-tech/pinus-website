"use client";

import React from "react";
import type {
  FormFieldDefinition,
  FormFieldType,
} from "@/lib/form-field-types";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Button } from "@/app/components/ui/button";
import { Checkbox } from "@/app/components/ui/checkbox";
import { FormSelect } from "@/app/components/forms/FormSelect";

type FormField = FormFieldDefinition;

const FIELD_TYPE_OPTIONS: { value: FormFieldType; label: string }[] = [
  { value: "text", label: "Text input" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date / time" },
  { value: "checkbox", label: "Checkbox (yes/no)" },
  { value: "dropdown", label: "Dropdown (single choice)" },
  { value: "multiple_choice", label: "Multiple choice" },
  { value: "segmented_text", label: "Path / structured text" },
  { value: "section", label: "Section (title / description only)" },
];

const DATE_MODE_OPTIONS = [
  { value: "date", label: "Date only" },
  { value: "datetime", label: "Date and time" },
  { value: "time", label: "Time only" },
];

const SECTION_DISPLAY_OPTIONS = [
  { value: "both", label: "Title and description" },
  { value: "title_only", label: "Title only" },
  { value: "description_only", label: "Description only" },
];

export function FormFieldsEditor({
  fields,
  onChange,
}: {
  fields: FormField[];
  onChange: (fields: FormField[]) => void;
}) {
  const updateField = (index: number, patch: Partial<FormField>) => {
    onChange(
      fields.map((f, i) => (i === index ? { ...f, ...patch } : f))
    );
  };

  const addField = () => {
    onChange([
      ...fields,
      {
        label: "",
        type: "text",
        required: false,
        options: [],
      },
    ]);
  };

  const removeField = (index: number) => {
    onChange(fields.filter((_, i) => i !== index));
  };

  const addOption = (fieldIndex: number) => {
    onChange(
      fields.map((field, i) =>
        i === fieldIndex
          ? { ...field, options: [...(field.options || []), ""] }
          : field
      )
    );
  };

  const updateOption = (
    fieldIndex: number,
    optionIndex: number,
    value: string
  ) => {
    onChange(
      fields.map((field, i) =>
        i === fieldIndex
          ? {
              ...field,
              options: field.options?.map((opt, j) =>
                j === optionIndex ? value : opt
              ),
            }
          : field
      )
    );
  };

  const removeOption = (fieldIndex: number, optionIndex: number) => {
    onChange(
      fields.map((field, i) =>
        i === fieldIndex
          ? {
              ...field,
              options: field.options?.filter((_, j) => j !== optionIndex),
            }
          : field
      )
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Form Fields</h2>
        <Button type="button" variant="blue" onClick={addField}>
          Add Field
        </Button>
      </div>

      {fields.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          No fields yet. Click &quot;Add Field&quot; to get started.
        </p>
      ) : (
        <div className="space-y-4">
          {fields.map((field, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Field {index + 1}
                </h3>
                <Button
                  type="button"
                  variant="red"
                  outline
                  size="sm"
                  onClick={() => removeField(index)}
                >
                  Remove
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Field Label *
                  </label>
                  <Input
                    type="text"
                    value={field.label}
                    onChange={(e) =>
                      updateField(index, { label: e.target.value })
                    }
                    placeholder="Enter field label"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Field Type *
                  </label>
                  <FormSelect
                    value={field.type}
                    onValueChange={(v) => {
                      const t = v as FormFieldType;
                      const patch: Partial<FormField> = { type: t };
                      if (t === "date") patch.dateMode = "date";
                      if (t === "dropdown" || t === "multiple_choice") {
                        patch.options = field.options?.length
                          ? field.options
                          : [""];
                      }
                      if (t === "section") {
                        patch.required = false;
                        patch.sectionDisplay = field.sectionDisplay ?? "both";
                        patch.sectionTitle = field.sectionTitle ?? "";
                        patch.sectionDescription =
                          field.sectionDescription ?? "";
                      }
                      if (t === "segmented_text") {
                        patch.segmentDelimiter = field.segmentDelimiter ?? "/";
                      }
                      updateField(index, patch);
                    }}
                    options={FIELD_TYPE_OPTIONS}
                    placeholder="Choose field type"
                  />
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <Checkbox
                  id={`required-${index}`}
                  checked={field.required}
                  disabled={field.type === "section"}
                  onCheckedChange={(c) =>
                    updateField(index, { required: c === true })
                  }
                />
                <label
                  htmlFor={`required-${index}`}
                  className="text-sm font-medium text-gray-700 cursor-pointer"
                >
                  Required field
                </label>
              </div>

              {field.type === "date" && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date field collects
                  </label>
                  <FormSelect
                    value={field.dateMode ?? "date"}
                    onValueChange={(v) =>
                      updateField(index, {
                        dateMode: v as FormField["dateMode"],
                      })
                    }
                    options={DATE_MODE_OPTIONS}
                    placeholder="Mode"
                    className="max-w-md"
                  />
                </div>
              )}

              {field.type === "section" && (
                <div className="mt-4 space-y-3 rounded-md border border-dashed border-gray-300 bg-gray-50 p-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Show
                  </label>
                  <FormSelect
                    value={field.sectionDisplay ?? "both"}
                    onValueChange={(v) =>
                      updateField(index, {
                        sectionDisplay: v as FormField["sectionDisplay"],
                      })
                    }
                    options={SECTION_DISPLAY_OPTIONS}
                    placeholder="Layout"
                    className="max-w-md"
                  />
                  {(field.sectionDisplay ?? "both") !== "description_only" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Section title
                      </label>
                      <Input
                        type="text"
                        value={field.sectionTitle ?? ""}
                        onChange={(e) =>
                          updateField(index, { sectionTitle: e.target.value })
                        }
                        placeholder="Heading shown to respondents"
                      />
                    </div>
                  )}
                  {(field.sectionDisplay ?? "both") !== "title_only" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Section description
                      </label>
                      <Textarea
                        value={field.sectionDescription ?? ""}
                        onChange={(e) =>
                          updateField(index, {
                            sectionDescription: e.target.value,
                          })
                        }
                        rows={3}
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
                  <Input
                    type="text"
                    value={field.segmentDelimiter ?? "/"}
                    onChange={(e) =>
                      updateField(index, {
                        segmentDelimiter: e.target.value || "/",
                      })
                    }
                    className="max-w-xs font-mono"
                    placeholder="/"
                    maxLength={8}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Example: <code>cilla/off-camp/1234/message</code> with
                    &quot;/&quot;
                  </p>
                </div>
              )}

              {(field.type === "dropdown" ||
                field.type === "multiple_choice") && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Options *
                  </label>
                  <div className="space-y-2">
                    {field.options?.map((option, optionIndex) => (
                      <div
                        key={optionIndex}
                        className="flex items-center gap-2"
                      >
                        <Input
                          type="text"
                          value={option}
                          onChange={(e) =>
                            updateOption(index, optionIndex, e.target.value)
                          }
                          className="flex-1"
                          placeholder={`Option ${optionIndex + 1}`}
                          required
                        />
                        <Button
                          type="button"
                          variant="red"
                          outline
                          size="sm"
                          onClick={() => removeOption(index, optionIndex)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="blue"
                      outline
                      size="sm"
                      onClick={() => addOption(index)}
                    >
                      + Add Option
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
