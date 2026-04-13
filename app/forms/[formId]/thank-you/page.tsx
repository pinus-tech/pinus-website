"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/AuthContext";
import { Button } from "@/app/components/ui/button";

export default function FormThankYouPage() {
  const params = useParams();
  const router = useRouter();
  const formId = params.formId as string;
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    if (!user) router.push("/login");
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-main" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
          <svg
            className="h-8 w-8 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Thanks for your response
        </h1>
        <p className="text-gray-600 mb-8">
          Your answers have been recorded. You can close this page or return to
          the forms list anytime.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href={`/forms/${formId}`}>
            <Button variant="blue" className="w-full sm:w-auto">
              View form
            </Button>
          </Link>
          <Link href="/forms">
            <Button variant="black" outline className="w-full sm:w-auto">
              Back to forms
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
