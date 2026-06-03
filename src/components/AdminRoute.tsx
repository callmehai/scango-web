import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import type { ReactNode } from "react";

/** Like ProtectedRoute but also requires the `admin` or `tester` role.
 *  Testers get a read-only view (mutation controls are hidden in the pages). */
export default function AdminRoute({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  const location = useLocation();

  if (!ready) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--color-text)",
        }}
      >
        <div className="loading-spinner" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (user.role !== "admin" && user.role !== "tester") {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
