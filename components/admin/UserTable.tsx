"use client";

import { useOptimistic, useTransition, useState } from "react";
import Image from "next/image";
import { updateUserRole, deleteUser } from "@/app/actions/admin";

type User = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phone: string | null;
  role: string;
  createdAt: string;
  _count: { orders: number };
};

export default function UserTable({
  users,
  currentUserId,
}: {
  users: User[];
  currentUserId: string;
}) {
  const [optimisticUsers, setOptimisticUsers] = useOptimistic(
    users,
    (state, updatedUser: User) =>
      state.map((u) => (u.id === updatedUser.id ? updatedUser : u)),
  );
  const [, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleRoleChange = (user: User, newRole: string) => {
    if (user.id === currentUserId && newRole === "USER") {
      alert("You cannot demote yourself!");
      return;
    }
    const updated = { ...user, role: newRole };
    startTransition(async () => {
      setOptimisticUsers(updated);
      await updateUserRole(user.id, newRole);
    });
  };

  const handleDelete = (user: User) => {
    if (user.id === currentUserId) {
      alert("You cannot delete your own account!");
      return;
    }
    if (
      !confirm(
        `Are you sure you want to delete ${user.firstName || ""} ${user.lastName || ""}?\n\nThis will also delete all their orders and reviews. This action cannot be undone.`,
      )
    ) {
      return;
    }
    setDeletingId(user.id);
    startTransition(async () => {
      await deleteUser(user.id);
      setDeletingId(null);
    });
  };

  const getInitials = (user: User) => {
    const first = user.firstName?.[0] || "";
    const last = user.lastName?.[0] || "";
    return (first + last).toUpperCase() || user.email[0].toUpperCase();
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-blue-500",
      "bg-emerald-500",
      "bg-violet-500",
      "bg-amber-500",
      "bg-rose-500",
      "bg-cyan-500",
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++)
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            <th className="px-6 py-4 font-semibold text-gray-700">User</th>
            <th className="px-6 py-4 font-semibold text-gray-700">Contact</th>
            <th className="px-6 py-4 font-semibold text-gray-700">Role</th>
            <th className="px-6 py-4 font-semibold text-gray-700">Orders</th>
            <th className="px-6 py-4 font-semibold text-gray-700">Joined</th>
            <th className="px-6 py-4 font-semibold text-gray-700 text-right">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {optimisticUsers.length === 0 && (
            <tr>
              <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                No users found matching your search.
              </td>
            </tr>
          )}
          {optimisticUsers.map((user) => (
            <tr
              key={user.id}
              className={`hover:bg-gray-50/50 transition-colors group ${
                deletingId === user.id ? "opacity-50" : ""
              }`}
            >
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full ${getAvatarColor(
                      user.email,
                    )} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}
                  >
                    {getInitials(user)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {user.firstName} {user.lastName}
                      {user.id === currentUserId && (
                        <span className="ml-2 text-[10px] bg-primary-blue text-white px-1.5 py-0.5 rounded-full">
                          You
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500 font-mono mt-0.5">
                      {user.id.slice(0, 8)}...
                    </p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <p className="text-gray-900 text-sm">{user.email}</p>
                {user.phone && (
                  <p className="text-xs text-gray-500 mt-0.5">{user.phone}</p>
                )}
              </td>
              <td className="px-6 py-4">
                <select
                  value={user.role}
                  onChange={(e) => handleRoleChange(user, e.target.value)}
                  disabled={user.id === currentUserId}
                  className={`text-xs font-bold px-3 py-1.5 rounded-full border cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                    user.role === "ADMIN"
                      ? "bg-purple-50 text-purple-700 border-purple-200 focus:ring-purple-500"
                      : "bg-blue-50 text-blue-700 border-blue-200 focus:ring-blue-500"
                  } ${user.id === currentUserId ? "opacity-60 cursor-not-allowed" : "hover:shadow-sm"}`}
                >
                  <option value="USER">USER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </td>
              <td className="px-6 py-4">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-700 text-sm font-bold">
                  {user._count.orders}
                </span>
              </td>
              <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                {new Date(user.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </td>
              <td className="px-6 py-4 text-right">
                <button
                  onClick={() => handleDelete(user)}
                  disabled={user.id === currentUserId || deletingId === user.id}
                  className={`text-sm font-medium transition-colors ${
                    user.id === currentUserId
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-red-600 hover:text-red-700 hover:underline"
                  }`}
                >
                  {deletingId === user.id ? "Deleting..." : "Delete"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
