import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import DonatePage from "./pages/DonatePage";
import OBSOverlayPage from "./pages/OBSOverlayPage";
import AdminPage from "./pages/AdminPage";
import { Toaster } from "@/components/ui/sonner";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Simple and Clean Path-based Routing */}
        <Route path="/" element={<DonatePage />} />
        <Route path="/donate" element={<DonatePage />} />
        <Route path="/overlay" element={<OBSOverlayPage />} />
        <Route path="/admin" element={<AdminPage />} />
        
        {/* Fallback routing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster position="top-right" />
    </BrowserRouter>
  );
}

export default App;
