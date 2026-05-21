import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Scan from "./pages/Scan";
import Conversation from "./pages/Conversation";
import History from "./pages/History";
import Settings from "./pages/Settings";
import HeaderControls from "./components/HeaderControls";
import BackButton from "./components/BackButton";
import { SettingsProvider } from "./hooks/useSettings";
import "./styles/index.css"; // Import global styles with theme

export default function App() {
  return (
    <SettingsProvider>
      <BrowserRouter>
        <BackButton />
        <HeaderControls />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/scan" element={<Scan />} />
          <Route path="/conversations/:id" element={<Conversation />} />
          <Route path="/history" element={<History />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </BrowserRouter>
    </SettingsProvider>
  );
}
