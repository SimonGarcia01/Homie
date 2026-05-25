"use client";

import UsersPage from "@/components/pages/app/Users";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function UsersRoute() {
  return (
    <ProtectedRoute roles={["admin"]}>
      <UsersPage />
    </ProtectedRoute>
  );
}
