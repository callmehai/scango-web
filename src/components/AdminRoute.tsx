import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import type { ReactNode } from "react";

/** Like ProtectedRoute but also requires the `admin` role.
 *  Testers no longer have access to the admin panel (they only keep their
 *  quota bypass elsewhere). */
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

  if (user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
