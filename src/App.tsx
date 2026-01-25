import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useTheme } from "./hooks/useTheme";
import Home from "./pages/Home";
import Scan from "./pages/Scan";
import Conversation from "./pages/Conversation";
import History from "./pages/History";
import Settings from "./pages/Settings";
import "./styles/index.css"; // Import global styles with theme

export default function App() {
  // Initialize theme system globally (applies data-theme to document)
  // This runs once on app load and persists theme across pages
  useTheme();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/scan" element={<Scan />} />
        <Route path="/conversations/:id" element={<Conversation />} />
        <Route path="/history" element={<History />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </BrowserRouter>
  );
}
