import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import Home from "./pages/Home";
import Scan from "./pages/Scan";
import Conversation from "./pages/Conversation";
import History from "./pages/History";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyEmail from "./pages/VerifyEmail";
import AdminSettings from "./pages/AdminSettings";
import AdminUsers from "./pages/AdminUsers";
import AppLayout from "./components/layout/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import { SettingsProvider, useSettings } from "./hooks/useSettings";
import { AuthProvider } from "./hooks/useAuth";
import { UI_TEXT } from "./constants/uiText";
import "./styles/index.css"; // Import global styles with theme

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";

/**
 * Routes that need the authenticated app shell. Split out so it can call
 * useSettings() (must be inside <SettingsProvider>) to localise page titles.
 * Auth pages (login / register / verify-email) intentionally render WITHOUT
 * the shell.
 */
function AppRoutes() {
  const { systemLang } = useSettings();
  const t = UI_TEXT[systemLang];

  return (
    <Routes>
      {/* Public auth pages — no app shell */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-email" element={<VerifyEmail />} />

      {/* Authenticated pages — wrapped in the consistent <AppLayout> shell */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout title={t.homeTitle}>
              <Home />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/scan"
        element={
          <ProtectedRoute>
            <AppLayout title={t.scanTitle} showBack>
              <Scan />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/conversations/:id"
        element={
          <ProtectedRoute>
            <AppLayout title={t.conversationTitle} showBack>
              <Conversation />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/history"
        element={
          <ProtectedRoute>
            <AppLayout title={t.historyTitle} showBack>
              <History />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <AppLayout title={t.settingsTitle} showBack>
              <Settings />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <AppLayout title={t.profileTitle} showBack narrow>
              <Profile />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AppLayout title={t.adminTitle} showBack>
              <AdminSettings />
            </AppLayout>
          </AdminRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <AdminRoute>
            <AppLayout title={t.adminUsersTitle} showBack>
              <AdminUsers />
            </AppLayout>
          </AdminRoute>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <SettingsProvider>
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </SettingsProvider>
    </GoogleOAuthProvider>
  );
}
