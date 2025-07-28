"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/AuthContext";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { PhoneInput } from "@/app/components/ui/phone-input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";

export default function ProfilePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    telegram: "",
    phoneNumber: "",
    city: "",
    major: "",
  });

  const { user, refreshUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    // Initialize form data with user data
    setFormData({
      name: user.name || "",
      telegram: user.telegram || "",
      phoneNumber: user.phoneNumber || "",
      city: user.city || "",
      major: user.major || "",
    });
  }, [user, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Remove @ symbols from telegram input
    if (name === "telegram") {
      setFormData((prev) => ({
        ...prev,
        [name]: value.replace(/^@+/, ""),
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSuccess("Profile updated successfully!");
        setIsEditing(false);
        // Refresh user data in context
        await refreshUser();
      } else {
        const data = await response.json();
        setError(data.error || "Failed to update profile");
      }
    } catch (error) {
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form data to original user data
    setFormData({
      name: user?.name || "",
      telegram: user?.telegram || "",
      phoneNumber: user?.phoneNumber || "",
      city: user?.city || "",
      major: user?.major || "",
    });
    setIsEditing(false);
    setError("");
    setSuccess("");
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-main"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="mt-2 text-gray-600">
            View and edit your personal information
          </p>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-md bg-green-50 p-4">
            <div className="text-sm text-green-700">{success}</div>
          </div>
        )}

        {/* Profile Information */}
        <Card className="mb-8 max-w-7xl mx-auto">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Personal Information</CardTitle>
              {!isEditing && (
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="blue"
                  size="sm"
                >
                  Edit Profile
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="mb-4">
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Editable Fields */}
                <Input
                  label="Full Name *"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  disabled={!isEditing}
                  placeholder="Enter your full name"
                />

                <Input
                  label="Telegram Username"
                  name="telegram"
                  value={formData.telegram}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="Your telegram username (without @)"
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <PhoneInput
                    value={formData.phoneNumber}
                    onChange={handlePhoneChange}
                    disabled={!isEditing}
                    required
                  />
                </div>

                <Input
                  label="City From (in Indonesia) *"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  required
                  disabled={!isEditing}
                  placeholder="Surabaya"
                />

                <Input
                  label="Major"
                  name="major"
                  value={formData.major}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="Your major/field of study"
                />

                {/* Read-only Fields */}
                <Input
                  label="Email (Cannot be changed)"
                  value={user.email}
                  disabled
                  className="bg-gray-100"
                />

                <Input
                  label="High School (Cannot be changed)"
                  value={user.highSchool || "Not provided"}
                  disabled
                  className="bg-gray-100"
                />

                <Input
                  label="Intake Year (Cannot be changed)"
                  value={user.intakeYear?.toString() || "Not provided"}
                  disabled
                  className="bg-gray-100"
                />

                <Input
                  label="Year of Study (Cannot be changed)"
                  value={user.yearOfStudy?.toString() || "Not provided"}
                  disabled
                  className="bg-gray-100"
                />
              </div>

              {/* Action Buttons */}
              {isEditing && (
                <div className="flex justify-end mt-6">
                  <Button
                    type="button"
                    onClick={handleCancel}
                    variant="black"
                    outline
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="blue" disabled={loading}>
                    {loading ? "Updating..." : "Save Changes"}
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Account Status */}
        <Card className="mb-8 max-w-7xl mx-auto">
          <CardHeader>
            <CardTitle>Account Status</CardTitle>
          </CardHeader>
          <CardContent className="mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Status
                </label>
                <span
                  className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                    user.isSuperAdmin
                      ? "bg-red-100 text-red-800"
                      : user.isAdmin
                      ? "bg-purple-100 text-purple-800"
                      : user.isApproved
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {user.isSuperAdmin
                    ? "Super Admin"
                    : user.isAdmin
                    ? "Admin"
                    : user.isApproved
                    ? "Approved"
                    : "Pending Approval"}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Member Since
                </label>
                <p className="text-sm text-gray-900">
                  {new Date(user.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>

              {user.isAdmin && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Permissions
                  </label>
                  {user.isSuperAdmin ? (
                    <span className="text-sm text-green-600 font-semibold">
                      All Permissions (Super Admin)
                    </span>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(user.permissions || {}).map(
                        ([key, value]) => (
                          <span
                            key={key}
                            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              value
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            {key
                              .replace("can", "")
                              .replace(/([A-Z])/g, " $1")
                              .trim()}
                          </span>
                        )
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <Card className="mb-8 max-w-7xl mx-auto">
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
          </CardHeader>
          <CardContent className="mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Button
                onClick={() => router.push("/forms")}
                variant="blue"
                outline
                className="w-full"
              >
                📝 Forms
              </Button>
              <Button
                onClick={() => router.push("/marketplace")}
                variant="blue"
                outline
                className="w-full"
              >
                🛒 Marketplace
              </Button>
              {user.isAdmin && (
                <Button
                  onClick={() => router.push("/admin/dashboard")}
                  variant="blue"
                  outline
                  className="w-full"
                >
                  👑 Admin Dashboard
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
