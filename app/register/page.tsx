"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/contexts/AuthContext";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { PhoneInput } from "@/app/components/ui/phone-input";
import { Form } from "@/app/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    telegram: "",
    phoneNumber: "+65",
    city: "",
    major: "",
    intakeYear: "",
    yearOfStudy: "",
    highSchool: "",
    career: "undergrad",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      if (user.isAdmin) {
        router.push("/admin/dashboard");
      } else {
        router.push("/");
      }
    }
  }, [user, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Special handling for telegram field to remove @ symbol
    if (name === "telegram") {
      const cleanedValue = value.replace(/^@+/, ""); // Remove @ symbols at the beginning
      setFormData((prev) => ({
        ...prev,
        [name]: cleanedValue,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handlePhoneChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      phoneNumber: value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateNUSEmail = (email: string): boolean => {
    const nusEmailRegex = /^[a-zA-Z0-9]+@u\.nus\.edu$/i;
    return nusEmailRegex.test(email.trim());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validate NUS email format
    if (!validateNUSEmail(formData.email)) {
      setError(
        "Please enter a valid NUS email address (format: xxxxxxxx@u.nus.edu)"
      );
      setLoading(false);
      return;
    }

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    // Validate required fields (now includes major, intakeYear, yearOfStudy, highSchool)
    const requiredFields = [
      "name",
      "email",
      "password",
      "telegram",
      "phoneNumber",
      "city",
      "major",
      "intakeYear",
      "yearOfStudy",
      "highSchool",
    ];
    const missingFields = requiredFields.filter((field) => {
      const value = formData[field as keyof typeof formData];
      return (
        !value ||
        (field === "phoneNumber" && (value === "+65" || value === "+62"))
      );
    });

    if (missingFields.length > 0) {
      setError(
        `Please fill in all required fields: ${missingFields.join(", ")}`
      );
      setLoading(false);
      return;
    }

    const registerData = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      telegram: formData.telegram,
      phoneNumber: formData.phoneNumber,
      city: formData.city,
      major: formData.major,
      intakeYear: parseInt(formData.intakeYear, 10),
      yearOfStudy: parseInt(formData.yearOfStudy, 10),
      highSchool: formData.highSchool,
      career: formData.career,
    };

    const result = await register(registerData);

    if (result.success) {
      router.push("/");
    } else {
      setError(result.error || "Registration failed");
    }

    setLoading(false);
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
                Registration Successful!
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Your account has been created and is pending admin approval. You
                will receive an email notification once your account is
                approved.
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
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{" "}
          <Link
            href="/login"
            className="font-medium text-blue-main hover:text-blue-main/90"
          >
            sign in to your existing account
          </Link>
        </p>
      </div>

      <div className="mt-8 mx-auto w-96 flex justify-center">
        <Card className="w-full pb-4">
          <CardHeader>
            <CardTitle>Register</CardTitle>
          </CardHeader>
          <CardContent>
            <Form onSubmit={handleSubmit}>
              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="text-sm text-red-700">{error}</div>
                </div>
              )}

              {/* Required Fields */}
              <Input
                label="Full Name *"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Enter your full name"
              />

              <Input
                label="NUS Email Address *"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="e1234567@u.nus.edu"
              />

              <Input
                label="Password *"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Enter your password"
              />

              <Input
                label="Confirm Password *"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                placeholder="Confirm your password"
              />

              <Input
                label="Telegram Username *"
                name="telegram"
                value={formData.telegram}
                onChange={handleChange}
                required
                placeholder="yourusername (without @)"
              />

              <PhoneInput
                label="Phone Number *"
                value={formData.phoneNumber}
                onChange={handlePhoneChange}
                required
                placeholder="12345678"
              />

              <Input
                label="City From (in Indonesia) *"
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
                placeholder="Surabaya"
              />

              <Input
                label="Major *"
                name="major"
                value={formData.major}
                onChange={handleChange}
                required
                placeholder="Electrical Engineering"
              />

              <Input
                label="Intake Year *"
                type="number"
                name="intakeYear"
                value={formData.intakeYear}
                onChange={handleChange}
                required
                placeholder="2024"
              />

              <Input
                label="Year of Study *"
                type="number"
                name="yearOfStudy"
                value={formData.yearOfStudy}
                onChange={handleChange}
                required
                placeholder="1"
              />

              <Input
                label="High School *"
                name="highSchool"
                value={formData.highSchool}
                onChange={handleChange}
                required
                placeholder="Your high school name"
              />

              <div className="w-full flex flex-col gap-2">
                <label className="block text-sm font-medium text-gray-700">
                  Career Level *
                </label>
                <Select
                  onValueChange={(value) => handleSelectChange("career", value)}
                  defaultValue={formData.career}
                >
                  <SelectTrigger
                    className="w-full"
                    variant="blue"
                    size="md"
                    rounding="lg"
                    outline
                  >
                    <SelectValue placeholder="Select a career level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="undergrad">Undergraduate</SelectItem>
                    <SelectItem value="master">Master&apos;s</SelectItem>
                    <SelectItem value="phd">PhD</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full"
                variant="blue"
                size="lg"
              >
                {loading ? "Creating account..." : "Create account"}
              </Button>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
