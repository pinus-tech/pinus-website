"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";

export interface AdminShortLink {
  id: string;
  slug: string;
  targetUrl: string;
  createdAt: string;
  updatedAt: string;
  createdBy: { name: string; email: string } | null;
}

export default function AdminShortLinksPanel() {
  const [shortLinks, setShortLinks] = useState<AdminShortLink[]>([]);
  const [shortLinksLoading, setShortLinksLoading] = useState(false);
  const [newSlug, setNewSlug] = useState("");
  const [newTargetUrl, setNewTargetUrl] = useState("");
  const [shortLinkSaving, setShortLinkSaving] = useState(false);
  const [shortLinkBanner, setShortLinkBanner] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [editTargetDraft, setEditTargetDraft] = useState("");
  const [deletingLinkId, setDeletingLinkId] = useState<string | null>(null);
  const [slugSuggestions, setSlugSuggestions] = useState<string[]>([]);

  const fetchShortLinks = async () => {
    try {
      setShortLinksLoading(true);
      const response = await fetch("/api/admin/short-links");
      if (response.ok) {
        const data = await response.json();
        setShortLinks(data.links ?? []);
      }
    } catch {
      /* non-fatal */
    } finally {
      setShortLinksLoading(false);
    }
  };

  useEffect(() => {
    fetchShortLinks();
  }, []);

  const siteOrigin =
    typeof window !== "undefined"
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");

  const createShortLink = async () => {
    setShortLinkBanner(null);
    setSlugSuggestions([]);
    setShortLinkSaving(true);
    try {
      const response = await fetch("/api/admin/short-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: newSlug, targetUrl: newTargetUrl }),
      });
      const data = (await response.json()) as {
        error?: string;
        suggestedSlugs?: string[];
      };
      if (!response.ok) {
        setShortLinkBanner({
          type: "err",
          text: data.error || "Could not create link",
        });
        if (response.status === 409 && Array.isArray(data.suggestedSlugs)) {
          setSlugSuggestions(data.suggestedSlugs);
        }
        return;
      }
      setShortLinkBanner({ type: "ok", text: "Short link created." });
      setSlugSuggestions([]);
      setNewSlug("");
      setNewTargetUrl("");
      await fetchShortLinks();
    } catch {
      setShortLinkBanner({ type: "err", text: "Network error" });
    } finally {
      setShortLinkSaving(false);
    }
  };

  const saveEditedTarget = async (linkId: string) => {
    setShortLinkBanner(null);
    setShortLinkSaving(true);
    try {
      const response = await fetch(`/api/admin/short-links/${linkId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUrl: editTargetDraft }),
      });
      const data = await response.json();
      if (!response.ok) {
        setShortLinkBanner({
          type: "err",
          text: data.error || "Could not update",
        });
        return;
      }
      setShortLinkBanner({ type: "ok", text: "Target URL updated." });
      setEditingLinkId(null);
      await fetchShortLinks();
    } catch {
      setShortLinkBanner({ type: "err", text: "Network error" });
    } finally {
      setShortLinkSaving(false);
    }
  };

  const deleteShortLink = async (linkId: string) => {
    if (
      !window.confirm(
        "Delete this short link? It will stop working immediately."
      )
    ) {
      return;
    }
    setDeletingLinkId(linkId);
    setShortLinkBanner(null);
    try {
      const response = await fetch(`/api/admin/short-links/${linkId}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) {
        setShortLinkBanner({
          type: "err",
          text: data.error || "Could not delete",
        });
        return;
      }
      setShortLinkBanner({ type: "ok", text: "Link deleted." });
      await fetchShortLinks();
    } catch {
      setShortLinkBanner({ type: "err", text: "Network error" });
    } finally {
      setDeletingLinkId(null);
    }
  };

  const copyShortUrl = async (slug: string) => {
    const full = `${siteOrigin}/u/${slug}`;
    try {
      await navigator.clipboard.writeText(full);
      setShortLinkBanner({ type: "ok", text: "Copied to clipboard." });
    } catch {
      setShortLinkBanner({ type: "err", text: "Could not copy." });
    }
  };

  return (
    <div className="w-full max-w-none space-y-6">
        {shortLinkBanner && (
          <div
            className={`rounded-xl border px-3 py-2.5 text-sm ${
              shortLinkBanner.type === "ok"
                ? "border-emerald-200/80 bg-emerald-50/90 text-emerald-900"
                : "border-red-200/80 bg-red-50/90 text-red-900"
            }`}
          >
            {shortLinkBanner.text}
          </div>
        )}

        {slugSuggestions.length > 0 && (
          <div className="rounded-xl border border-amber-200/90 bg-amber-50/90 px-4 py-3 ring-1 ring-amber-100">
            <p className="text-sm font-medium text-amber-950">
              That slug is already taken. Use a free suggestion (we&apos;ll fill
              the slug field), or type a different slug yourself and click Create
              again.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {slugSuggestions.map((s) => (
                <Button
                  key={s}
                  type="button"
                  variant="black"
                  outline
                  size="sm"
                  onClick={() => {
                    setNewSlug(s);
                    setSlugSuggestions([]);
                    setShortLinkBanner(null);
                  }}
                >
                  Use <span className="font-mono">{s}</span>
                </Button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input
            label="Slug"
            placeholder="e.g. signup-2026"
            value={newSlug}
            onChange={(e) => {
              setNewSlug(e.target.value);
              setSlugSuggestions([]);
            }}
            className="rounded-none border-blue-main"
          />
          <Input
            label="Target URL"
            placeholder="https://…"
            value={newTargetUrl}
            onChange={(e) => setNewTargetUrl(e.target.value)}
            className="rounded-none border-blue-main"
          />
        </div>
        {newSlug.trim() && (
          <div>
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
              Live preview
            </p>
            <div className="rounded-lg border border-slate-800/80 bg-slate-950 px-4 py-3 font-mono text-sm text-emerald-400 shadow-inner">
              <span className="select-none text-slate-500">→ </span>
              <span className="break-all">
                {siteOrigin || "…"}/u/
                {newSlug
                  .trim()
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, "-")}
              </span>
            </div>
          </div>
        )}
        <Button
          type="button"
          variant="blue"
          size="sm"
          onClick={createShortLink}
          disabled={
            shortLinkSaving || !newSlug.trim() || !newTargetUrl.trim()
          }
        >
          {shortLinkSaving ? "Saving…" : "Create short link"}
        </Button>

        <div className="border-t border-slate-200/80 pt-6">
          <h3 className="mb-1 text-sm font-semibold text-slate-900">
            All short links ({shortLinks.length})
          </h3>
          <p className="mb-3 text-xs text-slate-600">
            Any admin can remove any link and or edit the target URL.
          </p>
          {shortLinksLoading ? (
            <p className="text-sm text-slate-500">Loading links…</p>
          ) : shortLinks.length === 0 ? (
            <p className="text-sm text-slate-500">No short links yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200/90 bg-white/60 ring-1 ring-slate-200/50">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50/90">
                  <tr>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Short URL
                    </th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Target
                    </th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Created by
                    </th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Created
                    </th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white/80">
                  {shortLinks.map((link) => (
                    <tr key={link.id}>
                      <td className="px-3 py-2 align-top">
                        <code className="rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-900 break-all ring-1 ring-indigo-100">
                          /u/{link.slug}
                        </code>
                      </td>
                      <td className="max-w-[280px] px-3 py-2 align-top">
                        {editingLinkId === link.id ? (
                          <Input
                            value={editTargetDraft}
                            onChange={(e) =>
                              setEditTargetDraft(e.target.value)
                            }
                            className="py-1 text-xs"
                          />
                        ) : (
                          <a
                            href={link.targetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="line-clamp-2 break-all text-blue-600 hover:underline"
                          >
                            {link.targetUrl}
                          </a>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 align-top text-gray-700">
                        {link.createdBy?.name ?? "-"}
                        <div className="max-w-[140px] truncate text-xs text-gray-500">
                          {link.createdBy?.email}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 align-top text-xs text-gray-600">
                        {new Date(link.createdAt).toLocaleString()}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 align-top">
                        <div className="flex flex-wrap gap-1">
                          <Button
                            type="button"
                            variant="black"
                            outline
                            size="sm"
                            onClick={() => copyShortUrl(link.slug)}
                          >
                            Copy
                          </Button>
                          {editingLinkId === link.id ? (
                            <>
                              <Button
                                type="button"
                                variant="blue"
                                size="sm"
                                disabled={shortLinkSaving}
                                onClick={() => saveEditedTarget(link.id)}
                              >
                                Save
                              </Button>
                              <Button
                                type="button"
                                variant="black"
                                outline
                                size="sm"
                                onClick={() => setEditingLinkId(null)}
                              >
                                Cancel
                              </Button>
                            </>
                          ) : (
                            <Button
                              type="button"
                              variant="yellow"
                              size="sm"
                              onClick={() => {
                                setEditingLinkId(link.id);
                                setEditTargetDraft(link.targetUrl);
                              }}
                            >
                              Edit target
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="red"
                            size="sm"
                            disabled={deletingLinkId === link.id}
                            onClick={() => deleteShortLink(link.id)}
                          >
                            {deletingLinkId === link.id ? "…" : "Delete"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
    </div>
  );
}
