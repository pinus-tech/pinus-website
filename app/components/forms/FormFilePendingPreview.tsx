"use client";

import React, { useEffect, useState } from "react";
import { FileText } from "lucide-react";

function isPdfFile(file: File): boolean {
  return file.type === "application/pdf" || /\.pdf$/i.test(file.name);
}

export function FormFilePendingPreview({ file }: { file: File | null }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setUrl(null);
      return;
    }
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);

  if (!file || !url) return null;

  if (isPdfFile(file)) {
    return (
      <div className="mt-3 space-y-2">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <FileText className="h-5 w-5 shrink-0" aria-hidden />
          <span>PDF preview</span>
        </div>
        <iframe
          title="PDF preview"
          src={`${url}#toolbar=0`}
          className="h-52 w-full max-w-md rounded-lg border border-gray-200 bg-gray-50"
        />
      </div>
    );
  }

  return (
    <div className="mt-3">
      <img
        src={url}
        alt="Selected file preview"
        className="max-h-52 max-w-full rounded-lg border border-gray-200 object-contain shadow-sm"
      />
    </div>
  );
}
