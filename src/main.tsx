import { createRoot } from "react-dom/client";
import "./styles/index.css";
import App from "./App.tsx";
import { ToastProvider } from "./components/ui";
import "./styles/theme.css";
import "./styles/Home.css";
import "./styles/Conversation.css";
import "./styles/History.css";
import "./styles/Scan.css";

createRoot(document.getElementById("root")!).render(
  <ToastProvider>
    <App />
  </ToastProvider>,
);
