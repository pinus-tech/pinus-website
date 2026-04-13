"use client";

import React from "react";
import type { FormPageDefinition } from "@/lib/forms/form-pages";
import { newPageId } from "@/lib/forms/form-pages";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { Textarea } from "@/app/components/ui/textarea";

export function FormPagesManager({
  pages,
  onChange,
  onRemovePage,
}: {
  pages: FormPageDefinition[];
  onChange: (pages: FormPageDefinition[]) => void;
  /** Called when a page is removed; parent should reassign fields off this page. */
  onRemovePage: (pageId: string, remainingPages: FormPageDefinition[]) => void;
}) {
  const updatePage = (id: string, patch: Partial<FormPageDefinition>) => {
    onChange(
      pages.map((p) => (p.id === id ? { ...p, ...patch } : p))
    );
  };

  const addPage = () => {
    onChange([
      ...pages,
      {
        id: newPageId(),
        title: `Page ${pages.length + 1}`,
        description: "",
        order: pages.length,
      },
    ]);
  };

  const removePage = (id: string) => {
    if (pages.length <= 1) return;
    const next = pages
      .filter((p) => p.id !== id)
      .map((p, i) => ({ ...p, order: i }));
    onRemovePage(id, next);
    onChange(next);
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Pages</h3>
          <p className="text-sm text-gray-600 mt-0.5">
            Split questions across pages (like Google Forms). Use branching on
            drop-downs to jump to a page based on the answer.
          </p>
        </div>
        <Button type="button" variant="blue" outline onClick={addPage}>
          + Add page
        </Button>
      </div>

      <div className="space-y-3">
        {pages.map((p, idx) => (
          <div
            key={p.id}
            className="rounded-lg border border-white bg-white p-3 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Page {idx + 1}
              </span>
              <Button
                type="button"
                variant="red"
                outline
                size="sm"
                disabled={pages.length <= 1}
                onClick={() => removePage(p.id)}
              >
                Remove page
              </Button>
            </div>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Page title
                </label>
                <Input
                  value={p.title ?? ""}
                  onChange={(e) =>
                    updatePage(p.id, { title: e.target.value })
                  }
                  placeholder="e.g. Section A"
                />
              </div>
            </div>
            <div className="mt-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Page description (optional)
              </label>
              <Textarea
                value={p.description ?? ""}
                onChange={(e) =>
                  updatePage(p.id, { description: e.target.value })
                }
                rows={2}
                placeholder="Shown at the top of this page when filling the form"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
