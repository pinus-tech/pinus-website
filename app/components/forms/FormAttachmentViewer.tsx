"use client";

import React, { useEffect, useState } from "react";
import { FileText } from "lucide-react";

function isLikelyImageUrl(url: string): boolean {
  return /\.(png|jpe?g|gif|webp)(\?|$)/i.test(url);
}

export function FormAttachmentViewer({
  url,
  compact = false,
  className = "",
}: {
  url: string;
  /** Smaller inline thumb (e.g. table cells). */
  compact?: boolean;
  className?: string;
}) {
  const trimmed = url?.trim();
  const [open, setOpen] = useState(false);
  const [thumbFailed, setThumbFailed] = useState(false);
  const [modalIframe, setModalIframe] = useState(false);

  useEffect(() => {
    setThumbFailed(false);
    setModalIframe(false);
  }, [trimmed]);

  useEffect(() => {
    if (!open) setModalIframe(false);
  }, [open]);

  if (!trimmed) {
    return <span className="text-gray-400">—</span>;
  }

  const tryImageThumb = isLikelyImageUrl(trimmed) && !thumbFailed;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`group inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white p-1 text-left shadow-sm transition hover:border-blue-300 hover:shadow ${className}`}
        aria-label="View attachment"
      >
        {tryImageThumb ? (
          <img
            src={trimmed}
            alt=""
            className={`${
              compact ? "h-12 w-12" : "h-16 w-16"
            } shrink-0 rounded object-cover`}
            onError={() => setThumbFailed(true)}
          />
        ) : (
          <div
            className={`${
              compact ? "h-12 w-12" : "h-16 w-16"
            } flex shrink-0 items-center justify-center rounded bg-gray-100 text-gray-600`}
          >
            <FileText className="h-6 w-6" aria-hidden />
          </div>
        )}
        {!compact && (
          <span className="max-w-[180px] truncate text-xs text-blue-700 underline decoration-blue-300 group-hover:text-blue-900">
            Open
          </span>
        )}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Attachment preview"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative max-h-[90vh] max-w-[min(96vw,900px)] overflow-auto rounded-lg bg-white p-2 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="absolute right-2 top-2 z-10 rounded-md bg-gray-900/80 px-3 py-1.5 text-sm text-white hover:bg-gray-900"
              onClick={() => setOpen(false)}
            >
              Close
            </button>
            {!modalIframe && isLikelyImageUrl(trimmed) ? (
              <img
                src={trimmed}
                alt="Response attachment"
                className="max-h-[85vh] w-auto max-w-full object-contain"
                onError={() => setModalIframe(true)}
              />
            ) : (
              <iframe
                title="Attachment preview"
                src={trimmed}
                className="h-[min(85vh,800px)] w-[min(92vw,860px)] max-w-full rounded border-0"
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}
