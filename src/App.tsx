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
import InAppBrowserGate from "./components/InAppBrowserGate";
import { SettingsProvider, useSettings } from "./hooks/useSettings";
import { AuthProvider } from "./hooks/useAuth";
import "./styles/index.css"; // Import global styles with theme

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";

/**
 * Route table. IMPORTANT: this component must NOT read `systemLang` — if it
 * re-renders on a language switch, every <Route element={...}> is recreated and
 * React Router remounts the whole page (feels like a full reload). Page titles
 * are passed as stable i18n KEYS (titleKey) and translated inside AppLayout.
 */
function AppRoutes() {
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
            <AppLayout titleKey="homeTitle">
              <Home />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/scan"
        element={
          <ProtectedRoute>
            <AppLayout titleKey="scanTitle" showBack>
              <Scan />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/conversations/:id"
        element={
          <ProtectedRoute>
            <AppLayout titleKey="conversationTitle" showBack>
              <Conversation />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/history"
        element={
          <ProtectedRoute>
            <AppLayout titleKey="historyTitle" showBack>
              <History />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <AppLayout titleKey="settingsTitle" showBack>
              <Settings />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <AppLayout titleKey="profileTitle" showBack narrow>
              <Profile />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AppLayout titleKey="adminTitle" showBack>
              <AdminSettings />
            </AppLayout>
          </AdminRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <AdminRoute>
            <AppLayout titleKey="adminUsersTitle" showBack>
              <AdminUsers />
            </AppLayout>
          </AdminRoute>
        }
      />
    </Routes>
  );
}

/**
 * Wraps the app in <GoogleOAuthProvider> with the current language as the GSI
 * locale. CRITICAL: do NOT key this on systemLang — that would remount the
 * ENTIRE app (router + auth + current page) on every language switch, which
 * feels exactly like a full page reload. The Login page already remounts just
 * its <GoogleLogin> button (key={systemLang}) to pick up the new locale, so the
 * provider can stay mounted. Must live inside <SettingsProvider> to read it.
 */
function GoogleAuthShell({ children }: { children: React.ReactNode }) {
  const { systemLang } = useSettings();
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID} locale={systemLang}>
      {children}
    </GoogleOAuthProvider>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      {/* Blocks the app inside Messenger/Zalo WebViews → push to a real browser */}
      <InAppBrowserGate />
      <GoogleAuthShell>
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </GoogleAuthShell>
    </SettingsProvider>
  );
}
