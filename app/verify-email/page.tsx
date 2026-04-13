"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Form } from "@/app/components/ui/form";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";

// Force dynamic rendering to prevent static generation
export const dynamic = 'force-dynamic';

function VerifyEmailContent() {
  const [verificationCode, setVerificationCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [email, setEmail] = useState("");

  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId");
  const userEmail = searchParams.get("email");

  useEffect(() => {
    if (!userId) {
      router.push("/register");
      return;
    }
    if (userEmail) {
      setEmail(userEmail);
    }
  }, [userId, userEmail, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!verificationCode || verificationCode.length !== 6) {
      setError("Please enter a valid 6-digit verification code");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          verificationCode,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
      } else {
        setError(data.error || "Verification failed");
      }
    } catch (error) {
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError("");
    setResendLoading(true);

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (response.ok) {
        setError(""); // Clear any previous errors
        // Show success message temporarily
        setError("New verification code sent to your email!");
        setTimeout(() => setError(""), 3000);
      } else {
        setError(data.error || "Failed to resend code");
      }
    } catch (error) {
      setError("Network error occurred");
    } finally {
      setResendLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-gray-50 flex flex-col justify-center py-48 sm:px-6 lg:px-8">
        <div className="mt-8 mx-auto w-96 flex justify-center">
          <Card className="w-full pb-4">
            <CardContent className="text-center py-8">
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-green-100 p-3">
                  <svg
                    className="h-6 w-6 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Email Verified Successfully!
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Your email has been verified. You can now log in to your account.
              </p>
              <Link href="/login">
                <Button variant="blue">Go to Login</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          Verify Your Email
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          We&apos;ve sent a 6-digit verification code to{" "}
          {email && (
            <span className="font-medium text-blue-main">{email}</span>
          )}
        </p>
        <p className="mt-4 max-w-md mx-auto text-center text-sm text-gray-600 leading-relaxed px-2">
          Can&apos;t see the message? Check your{" "}
          <span className="font-medium text-[#232E6E]">spam</span> or{" "}
          <span className="font-medium text-[#232E6E]">junk</span> folder -
          automated emails are sometimes filtered there.
        </p>
      </div>

      <div className="mt-8 mx-auto w-96 flex justify-center">
        <Card className="w-full pb-4">
          <CardHeader>
            <CardTitle>Enter Verification Code</CardTitle>
          </CardHeader>
          <CardContent>
            <Form onSubmit={handleSubmit}>
              {error && (
                <div className={`rounded-md p-4 ${
                  error.includes("sent to your email") 
                    ? "bg-green-50" 
                    : "bg-red-50"
                }`}>
                  <div className={`text-sm ${
                    error.includes("sent to your email") 
                      ? "text-green-700" 
                      : "text-red-700"
                  }`}>
                    {error}
                  </div>
                </div>
              )}

              <Input
                label="Verification Code"
                name="verificationCode"
                value={verificationCode}
                onChange={(e) => {
                  // Only allow numbers and limit to 6 digits
                  const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setVerificationCode(value);
                }}
                required
                placeholder="Enter 6-digit code"
                maxLength={6}
                className="text-center text-2xl tracking-wider"
              />

              <div className="text-center text-sm text-gray-600 mb-4">
                Code expires in 10 minutes
              </div>

              <Button
                type="submit"
                disabled={loading || verificationCode.length !== 6}
                className="w-full mb-4"
                variant="blue"
                size="lg"
              >
                {loading ? "Verifying..." : "Verify Email"}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={resendLoading}
                  className="text-sm text-blue-main hover:text-blue-main/90 disabled:opacity-50"
                >
                  {resendLoading ? "Sending..." : "Didn't receive the code? Resend"}
                </button>
              </div>
            </Form>

            <div className="mt-6 text-center">
              <Link
                href="/register"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                ← Back to Registration
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="bg-gray-50 flex flex-col justify-center py-48 sm:px-6 lg:px-8">
      <div className="mt-8 mx-auto w-96 flex justify-center">
        <Card className="w-full pb-4">
          <CardContent className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-main mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <VerifyEmailContent />
    </Suspense>
  );
} 