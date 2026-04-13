"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { buildLoginUrl } from "@/lib/login-callback";
import { useAuth } from "@/lib/contexts/AuthContext";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
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

interface UserPermissions {
  canCreateForms: boolean;
  canManageUsers: boolean;
  canViewAnalytics: boolean;
}
interface User {
  _id: string;
  name: string;
  email: string;
  telegram: string;
  phoneNumber: string;
  city: string;
  major?: string;
  intakeYear?: number;
  yearOfStudy?: number;
  highSchool?: string;
  career?: string;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isEmailVerified: boolean;
  permissions: {
    canCreateForms: boolean;
    canManageUsers: boolean;
    canViewAnalytics: boolean;
  };
  isApproved: boolean;
  createdAt: string;
}

function telegramProfileUrl(telegram: string): string | null {
  const h = telegram?.replace(/^@+/, "").trim();
  if (!h) return null;
  return `https://t.me/${encodeURIComponent(h)}`;
}

function whatsappUrl(phone: string): string | null {
  const d = phone?.replace(/\D/g, "");
  if (!d) return null;
  return `https://wa.me/${d}`;
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<User>>({});
  const [viewMode, setViewMode] = useState<"cards" | "table">("table");
  const [detailModalUser, setDetailModalUser] = useState<User | null>(null);

  // Search and Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // all, pending, approved, admin
  const [filterRole, setFilterRole] = useState("all"); // all, user, admin, superadmin
  const [sortBy, setSortBy] = useState("createdAt"); // name, email, createdAt
  const [sortOrder, setSortOrder] = useState("desc"); // asc, desc

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const { user, logout, canManageUsers } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (user === null) {
      router.push(buildLoginUrl(pathname));
      return;
    }

    if (user && !user.isAdmin) {
      router.push("/");
      return;
    }

    if (user && user.isAdmin) {
      fetchUsers();
    }
  }, [user, router, pathname]);

  useEffect(() => {
    filterAndSortUsers();
  }, [users, searchTerm, filterStatus, filterRole, sortBy, sortOrder]);

  useEffect(() => {
    if (!detailModalUser) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDetailModalUser(null);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [detailModalUser]);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users");
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      } else {
        setError("Failed to fetch users");
      }
    } catch (error) {
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortUsers = () => {
    let filtered = [...users];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (u) =>
          u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.telegram.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (u.major && u.major.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply status filter
    if (filterStatus !== "all") {
      switch (filterStatus) {
        case "unverified":
          filtered = filtered.filter((u) => !u.isEmailVerified && !u.isAdmin);
          break;
        case "verified":
          filtered = filtered.filter((u) => u.isEmailVerified && !u.isAdmin);
          break;
        case "admin":
          filtered = filtered.filter((u) => u.isAdmin);
          break;
      }
    }

    // Apply role filter
    if (filterRole !== "all") {
      switch (filterRole) {
        case "user":
          filtered = filtered.filter((u) => !u.isAdmin);
          break;
        case "admin":
          filtered = filtered.filter((u) => u.isAdmin && !u.isSuperAdmin);
          break;
        case "superadmin":
          filtered = filtered.filter((u) => u.isSuperAdmin);
          break;
      }
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortBy as keyof User];
      let bValue = b[sortBy as keyof User];

      // Handle undefined values
      if (aValue === undefined) aValue = "";
      if (bValue === undefined) bValue = "";

      if (typeof aValue === "string") aValue = aValue.toLowerCase();
      if (typeof bValue === "string") bValue = bValue.toLowerCase();

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredUsers(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handlePermissionUpdate = async (
    userId: string,
    permissions: UserPermissions,
    isAdmin?: boolean
  ) => {
    if (!user?.isSuperAdmin) {
      setError("Only super admins can manage permissions");
      return;
    }

    setActionLoading(userId);
    try {
      const response = await fetch("/api/admin/permissions", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, permissions, isAdmin }),
      });

      if (response.ok) {
        await fetchUsers();
        setShowPermissionModal(false);
        setSelectedUser(null);
      } else {
        const data = await response.json();
        setError(data.error || "Permission update failed");
      }
    } catch (error) {
      setError("Network error occurred");
    } finally {
      setActionLoading(null);
    }
  };

  const handleEditUser = async () => {
    if (!user?.isSuperAdmin && !canManageUsers()) {
      setError("You do not have permission to edit users");
      return;
    }

    if (!selectedUser) return;

    setActionLoading(selectedUser._id);
    try {
      const response = await fetch(`/api/admin/users/${selectedUser._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editFormData),
      });

      if (response.ok) {
        await fetchUsers();
        setShowEditModal(false);
        setSelectedUser(null);
        setEditFormData({});
      } else {
        const data = await response.json();
        setError(data.error || "User update failed");
      }
    } catch (error) {
      setError("Network error occurred");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (userToDelete: User) => {
    if (!user?.isSuperAdmin) {
      setError("Only super admins can delete accounts");
      return;
    }

    if (userToDelete.isSuperAdmin) {
      setError("Cannot delete super admin accounts");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete ${userToDelete.name}'s account? This action cannot be undone.`
    );

    if (!confirmed) return;

    setActionLoading(userToDelete._id);
    try {
      const response = await fetch(`/api/admin/users/${userToDelete._id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchUsers();
      } else {
        const data = await response.json();
        setError(data.error || "Failed to delete user");
      }
    } catch (error) {
      setError("Network error occurred");
    } finally {
      setActionLoading(null);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const openPermissionModal = (userToEdit: User) => {
    if (!user?.isSuperAdmin) {
      setError("Only super admins can manage permissions");
      return;
    }
    setDetailModalUser(null);
    setSelectedUser(userToEdit);
    setShowPermissionModal(true);
  };

  const openEditModal = (userToEdit: User) => {
    if (!user?.isSuperAdmin && !canManageUsers()) {
      setError("You do not have permission to edit users");
      return;
    }
    setDetailModalUser(null);
    setSelectedUser(userToEdit);
    setEditFormData({
      name: userToEdit.name,
      email: userToEdit.email,
      telegram: userToEdit.telegram,
      phoneNumber: userToEdit.phoneNumber,
      city: userToEdit.city,
      major: userToEdit.major,
      intakeYear: userToEdit.intakeYear,
      yearOfStudy: userToEdit.yearOfStudy,
      highSchool: userToEdit.highSchool,
      career: userToEdit.career,
    });
    setShowEditModal(true);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilterStatus("all");
    setFilterRole("all");
    setSortBy("createdAt");
    setSortOrder("desc");
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-main mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Pagination calculations
  const totalItems = filteredUsers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  const unverifiedUsers = users.filter((u) => !u.isEmailVerified && !u.isAdmin);
  const verifiedUsers = users.filter((u) => u.isEmailVerified && !u.isAdmin);
  const adminUsers = users.filter((u) => u.isAdmin);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <img
                src="/logo-icon-pinus.svg"
                alt="PINUS Logo"
                className="h-8 w-8 animate-[spin_4500ms_linear_infinite]"
              />
              <h1 className="ml-3 text-2xl font-bold text-gray-900">
                {user?.isSuperAdmin
                  ? "Super Admin Dashboard"
                  : "Admin Dashboard"}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <span className="text-sm text-gray-600">
                  Welcome, {user?.name}
                </span>
                <div className="text-xs text-gray-500">
                  {user?.isSuperAdmin ? "Super Admin" : "Admin"}
                  {user?.permissions && (
                    <span className="ml-1">
                      (
                      {Object.entries(user.permissions)
                        .filter(([_, value]) => value)
                        .map(([key, _]) =>
                          key
                            .replace("can", "")
                            .replace(/([A-Z])/g, " $1")
                            .trim()
                        )
                        .join(", ")}
                      )
                    </span>
                  )}
                </div>
              </div>
              <Button onClick={handleLogout} variant="red" size="sm">
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-yellow-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Unverified Users
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {unverifiedUsers.length}
                    </dd>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
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
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Verified Users
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {verifiedUsers.length}
                    </dd>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-purple-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Admin Users
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {adminUsers.length}
                    </dd>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg
                      className="h-5 w-5 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Users
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {users.length}
                    </dd>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter Controls */}
        <Card className="mb-8 max-w-7xl mx-auto ">
          <CardHeader>
            <CardTitle>Search & Filter Users</CardTitle>
          </CardHeader>
          <CardContent className="mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {/* Search */}
              <div>
                <Input
                  label="Search Users"
                  placeholder="Name, email, telegram, city..."
                  className="w-full py-5 rounded-none border-blue-main"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Status
                </label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger variant="blue" outline>
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent variant="blue" outline>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="unverified">Unverified</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="admin">Admin Users</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Role Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Role
                </label>
                <Select value={filterRole} onValueChange={setFilterRole}>
                  <SelectTrigger variant="blue" outline>
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent variant="blue" outline>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="user">Regular User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="superadmin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Items Per Page */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Items Per Page
                </label>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(value) => setItemsPerPage(Number(value))}
                >
                  <SelectTrigger variant="blue" outline>
                    <SelectValue placeholder="10" />
                  </SelectTrigger>
                  <SelectContent variant="blue" outline>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Sort By
                </label>
                <div className="flex space-x-2">
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger variant="blue" outline className="flex-1">
                      <SelectValue placeholder="Sort by..." />
                    </SelectTrigger>
                    <SelectContent variant="blue" outline>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="createdAt">
                        Registration Date
                      </SelectItem>
                      <SelectItem value="city">City</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={sortOrder} onValueChange={setSortOrder}>
                    <SelectTrigger variant="blue" outline>
                      <SelectValue placeholder="Order" />
                    </SelectTrigger>
                    <SelectContent variant="blue" outline>
                      <SelectItem value="asc">Ascending</SelectItem>
                      <SelectItem value="desc">Descending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Clear Filters */}
              <div className="flex items-end">
                <Button
                  onClick={clearFilters}
                  variant="black"
                  outline
                  className="w-full"
                >
                  Clear All Filters
                </Button>
              </div>
            </div>

            {/* Results Summary */}
            <div className="mt-4 text-sm text-gray-600">
              Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of{" "}
              {totalItems} users
              {searchTerm && ` matching "${searchTerm}"`}
            </div>
          </CardContent>
        </Card>

        {/* Users: cards or table */}
        <Card className="mb-8 max-w-7xl mx-auto">
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>
                All Users ({totalItems})
                {searchTerm && ` - Search: "${searchTerm}"`}
              </CardTitle>
              <div className="flex rounded-lg border border-gray-200 bg-white p-0.5 text-sm shrink-0">
                <button
                  type="button"
                  onClick={() => setViewMode("cards")}
                  className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
                    viewMode === "cards"
                      ? "bg-blue-600 text-white"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  Cards
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("table")}
                  className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
                    viewMode === "table"
                      ? "bg-blue-600 text-white"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  Table
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="mb-4">
            {viewMode === "cards" ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {currentUsers.map((currentUser) => (
                  <div
                    key={currentUser._id}
                    className="flex flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-base font-semibold text-gray-900 truncate">
                        {currentUser.name}
                      </div>
                      <div className="text-sm text-gray-500 truncate">
                        {currentUser.email}
                      </div>
                      <span
                        className={`mt-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          currentUser.isSuperAdmin
                            ? "bg-red-100 text-red-800"
                            : currentUser.isAdmin
                              ? "bg-purple-100 text-purple-800"
                              : currentUser.isEmailVerified
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {currentUser.isSuperAdmin
                          ? "Super Admin"
                          : currentUser.isAdmin
                            ? "Admin"
                            : currentUser.isEmailVerified
                              ? "Verified"
                              : "Unverified"}
                      </span>
                      <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                        {currentUser.city}
                        {currentUser.major ? ` · ${currentUser.major}` : ""}
                      </p>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-100 pt-3">
                      <Button
                        type="button"
                        variant="blue"
                        outline
                        size="sm"
                        onClick={() => setDetailModalUser(currentUser)}
                      >
                        See more
                      </Button>
                      {(user?.isSuperAdmin || canManageUsers()) && (
                        <Button
                          onClick={() => openEditModal(currentUser)}
                          disabled={actionLoading === currentUser._id}
                          variant="yellow"
                          size="sm"
                        >
                          Edit
                        </Button>
                      )}
                      {user?.isSuperAdmin &&
                        currentUser.isAdmin &&
                        !currentUser.isSuperAdmin && (
                          <Button
                            onClick={() => openPermissionModal(currentUser)}
                            disabled={actionLoading === currentUser._id}
                            variant="blue"
                            size="sm"
                          >
                            Permissions
                          </Button>
                        )}
                      {user?.isSuperAdmin &&
                        !currentUser.isAdmin &&
                        currentUser.isEmailVerified && (
                          <Button
                            onClick={() =>
                              handlePermissionUpdate(
                                currentUser._id,
                                {
                                  canCreateForms: false,
                                  canManageUsers: false,
                                  canViewAnalytics: false,
                                },
                                true
                              )
                            }
                            disabled={actionLoading === currentUser._id}
                            variant="blue"
                            size="sm"
                          >
                            Make Admin
                          </Button>
                        )}
                      {user?.isSuperAdmin && (
                        <Button
                          onClick={() => handleDeleteUser(currentUser)}
                          disabled={actionLoading === currentUser._id}
                          variant="red"
                          size="sm"
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Education
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Registered
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentUsers.map((currentUser) => (
                    <tr key={currentUser._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {currentUser.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {currentUser.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <div className="max-w-[200px]">
                          <div className="text-sm text-gray-900 line-clamp-1">
                            @{currentUser.telegram}
                          </div>
                          <div className="text-sm text-gray-500 line-clamp-1">
                            {currentUser.phoneNumber}
                          </div>
                          <div className="text-sm text-gray-500 line-clamp-1">
                            {currentUser.city}
                          </div>
                          <Button
                            type="button"
                            variant="blue"
                            outline
                            size="sm"
                            className="mt-2"
                            onClick={() => setDetailModalUser(currentUser)}
                          >
                            See more
                          </Button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          {currentUser.major && (
                            <div className="text-sm text-gray-900">
                              {currentUser.major}
                            </div>
                          )}
                          {currentUser.intakeYear && (
                            <div className="text-sm text-gray-500">
                              Intake: {currentUser.intakeYear}
                            </div>
                          )}
                          {currentUser.yearOfStudy && (
                            <div className="text-sm text-gray-500">
                              Year {currentUser.yearOfStudy}
                            </div>
                          )}
                          {currentUser.highSchool && (
                            <div className="text-sm text-gray-500 truncate max-w-32">
                              {currentUser.highSchool}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            currentUser.isSuperAdmin
                              ? "bg-red-100 text-red-800"
                              : currentUser.isAdmin
                              ? "bg-purple-100 text-purple-800"
                              : currentUser.isEmailVerified
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {currentUser.isSuperAdmin
                            ? "Super Admin"
                            : currentUser.isAdmin
                            ? "Admin"
                            : currentUser.isEmailVerified
                            ? "Verified"
                            : "Unverified"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(currentUser.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {/* Edit User */}
                          {(user?.isSuperAdmin || canManageUsers()) && (
                            <Button
                              onClick={() => openEditModal(currentUser)}
                              disabled={actionLoading === currentUser._id}
                              variant="yellow"
                              size="sm"
                            >
                              Edit
                            </Button>
                          )}

                          {/* Manage Permissions for admins */}
                          {user?.isSuperAdmin &&
                            currentUser.isAdmin &&
                            !currentUser.isSuperAdmin && (
                              <Button
                                onClick={() => openPermissionModal(currentUser)}
                                disabled={actionLoading === currentUser._id}
                                variant="blue"
                                size="sm"
                              >
                                Permissions
                              </Button>
                            )}

                          {/* Make Admin */}
                          {user?.isSuperAdmin &&
                            !currentUser.isAdmin &&
                            currentUser.isEmailVerified && (
                              <Button
                                onClick={() =>
                                  handlePermissionUpdate(
                                    currentUser._id,
                                    {
                                      canCreateForms: false,
                                      canManageUsers: false,
                                      canViewAnalytics: false,
                                    },
                                    true
                                  )
                                }
                                disabled={actionLoading === currentUser._id}
                                variant="blue"
                                size="sm"
                              >
                                Make Admin
                              </Button>
                            )}

                          {/* Delete User */}
                          {user?.isSuperAdmin && (
                            <Button
                              onClick={() => handleDeleteUser(currentUser)}
                              disabled={actionLoading === currentUser._id}
                              variant="red"
                              size="sm"
                            >
                              Delete
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    variant="black"
                    outline
                    size="sm"
                  >
                    Previous
                  </Button>

                  {/* Page numbers */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum =
                      Math.max(1, Math.min(totalPages - 4, currentPage - 2)) +
                      i;
                    if (pageNum > totalPages) return null;

                    return (
                      <Button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        variant={currentPage === pageNum ? "blue" : "black"}
                        outline={currentPage !== pageNum}
                        size="sm"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}

                  <Button
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                    variant="black"
                    outline
                    size="sm"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* User contact & full profile (See more) */}
      {detailModalUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close user details"
            onClick={() => setDetailModalUser(null)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-user-detail-title"
            className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-gray-200 bg-white p-6 shadow-xl"
          >
            <h2
              id="admin-user-detail-title"
              className="text-lg font-semibold text-gray-900"
            >
              {detailModalUser.name}
            </h2>
            <p className="mt-1 text-sm text-gray-500 break-all">
              {detailModalUser.email}
            </p>
            <span
              className={`mt-3 inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${
                detailModalUser.isSuperAdmin
                  ? "bg-red-100 text-red-800"
                  : detailModalUser.isAdmin
                    ? "bg-purple-100 text-purple-800"
                    : detailModalUser.isEmailVerified
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
              }`}
            >
              {detailModalUser.isSuperAdmin
                ? "Super Admin"
                : detailModalUser.isAdmin
                  ? "Admin"
                  : detailModalUser.isEmailVerified
                    ? "Verified"
                    : "Unverified"}
            </span>

            <div className="mt-5 flex flex-wrap gap-2">
              <a
                href={`mailto:${encodeURIComponent(detailModalUser.email)}`}
                className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-800 hover:bg-gray-50"
              >
                Email
              </a>
              {telegramProfileUrl(detailModalUser.telegram) && (
                <a
                  href={telegramProfileUrl(detailModalUser.telegram)!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-sm font-medium text-sky-900 hover:bg-sky-100"
                >
                  Open Telegram
                </a>
              )}
              {whatsappUrl(detailModalUser.phoneNumber) && (
                <a
                  href={whatsappUrl(detailModalUser.phoneNumber)!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-sm font-medium text-green-900 hover:bg-green-100"
                >
                  WhatsApp
                </a>
              )}
              {detailModalUser.phoneNumber?.trim() && (
                <a
                  href={`tel:${detailModalUser.phoneNumber.replace(/\s/g, "")}`}
                  className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-800 hover:bg-gray-50"
                >
                  Call
                </a>
              )}
            </div>

            <dl className="mt-6 space-y-3 text-sm border-t border-gray-100 pt-5">
              <div>
                <dt className="font-medium text-gray-500">Telegram</dt>
                <dd className="mt-0.5 text-gray-900">
                  {detailModalUser.telegram ? (
                    <>
                      @
                      {detailModalUser.telegram.replace(/^@+/, "")}
                    </>
                  ) : (
                    "-"
                  )}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">Phone</dt>
                <dd className="mt-0.5 text-gray-900">
                  {detailModalUser.phoneNumber || "-"}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">City</dt>
                <dd className="mt-0.5 text-gray-900">
                  {detailModalUser.city || "-"}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">Major</dt>
                <dd className="mt-0.5 text-gray-900">
                  {detailModalUser.major || "-"}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">Career</dt>
                <dd className="mt-0.5 text-gray-900 capitalize">
                  {detailModalUser.career || "-"}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">Intake year</dt>
                <dd className="mt-0.5 text-gray-900">
                  {detailModalUser.intakeYear ?? "-"}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">Year of study</dt>
                <dd className="mt-0.5 text-gray-900">
                  {detailModalUser.yearOfStudy ?? "-"}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">High school</dt>
                <dd className="mt-0.5 text-gray-900 whitespace-pre-wrap">
                  {detailModalUser.highSchool || "-"}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">Registered</dt>
                <dd className="mt-0.5 text-gray-900">
                  {new Date(detailModalUser.createdAt).toLocaleString()}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">User ID</dt>
                <dd className="mt-0.5 font-mono text-xs text-gray-700 break-all">
                  {detailModalUser._id}
                </dd>
              </div>
            </dl>

            <div className="mt-6 flex flex-wrap justify-end gap-2">
              {(user?.isSuperAdmin || canManageUsers()) && (
                <Button
                  type="button"
                  variant="yellow"
                  size="sm"
                  onClick={() => openEditModal(detailModalUser)}
                >
                  Edit user
                </Button>
              )}
              <Button
                type="button"
                variant="black"
                outline
                size="sm"
                onClick={() => setDetailModalUser(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Edit User: {selectedUser.name}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Name *"
                value={editFormData.name || ""}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, name: e.target.value })
                }
              />
              <Input
                label="Email *"
                type="email"
                value={editFormData.email || ""}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, email: e.target.value })
                }
              />
              <Input
                label="Telegram"
                value={editFormData.telegram || ""}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    telegram: e.target.value.replace(/^@+/, ""),
                  })
                }
              />
              <Input
                label="Phone Number"
                value={editFormData.phoneNumber || ""}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    phoneNumber: e.target.value,
                  })
                }
              />
              <Input
                label="City"
                value={editFormData.city || ""}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, city: e.target.value })
                }
              />
              <Input
                label="Major"
                value={editFormData.major || ""}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, major: e.target.value })
                }
              />
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Career Level
                </label>
                <Select 
                  onValueChange={(value) => setEditFormData({ ...editFormData, career: value })}
                  value={editFormData.career || "undergrad"}
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
                  <SelectContent variant="blue" outline rounding="lg">
                    <SelectItem value="undergrad">Undergraduate</SelectItem>
                    <SelectItem value="master">Master&apos;s</SelectItem>
                    <SelectItem value="phd">PhD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Input
                label="Intake Year"
                type="number"
                value={editFormData.intakeYear || ""}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    intakeYear: Number(e.target.value),
                  })
                }
              />
              <Input
                label="Year of Study"
                type="number"
                value={editFormData.yearOfStudy || ""}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    yearOfStudy: Number(e.target.value),
                  })
                }
              />
              <div className="md:col-span-2">
                <Input
                  label="High School"
                  value={editFormData.highSchool || ""}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      highSchool: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <Button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedUser(null);
                  setEditFormData({});
                }}
                variant="black"
                outline
                size="sm"
              >
                Cancel
              </Button>
              <Button
                onClick={handleEditUser}
                disabled={actionLoading === selectedUser._id}
                variant="blue"
                size="sm"
              >
                {actionLoading === selectedUser._id
                  ? "Updating..."
                  : "Update User"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Permission Management Modal */}
      {showPermissionModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Manage Permissions for {selectedUser.name}
            </h3>

            <div className="space-y-4">
              {Object.entries(selectedUser.permissions).map(([key, value]) => {
                const permissionLabels = {
                  canCreateForms: "Create Forms",
                  canManageUsers: "Delete User Accounts", 
                  canViewAnalytics: "View Analytics"
                };
                
                return (
                  <label key={key} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => {
                        setSelectedUser({
                          ...selectedUser,
                          permissions: {
                            ...selectedUser.permissions,
                            [key]: e.target.checked,
                          },
                        });
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm">
                      {permissionLabels[key as keyof typeof permissionLabels] || key
                        .replace("can", "")
                        .replace(/([A-Z])/g, " $1")
                        .trim()}
                    </span>
                  </label>
                );
              })}

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedUser.isAdmin}
                  onChange={(e) => {
                    setSelectedUser({
                      ...selectedUser,
                      isAdmin: e.target.checked,
                    });
                  }}
                  className="mr-2"
                />
                <span className="text-sm font-semibold">Admin Status</span>
              </label>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <Button
                onClick={() => {
                  setShowPermissionModal(false);
                  setSelectedUser(null);
                }}
                variant="black"
                outline
                size="sm"
              >
                Cancel
              </Button>
              <Button
                onClick={() =>
                  handlePermissionUpdate(
                    selectedUser._id,
                    selectedUser.permissions,
                    selectedUser.isAdmin
                  )
                }
                disabled={actionLoading === selectedUser._id}
                variant="blue"
                size="sm"
              >
                {actionLoading === selectedUser._id
                  ? "Updating..."
                  : "Update Permissions"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
