import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import ChatbotWidget from "./components/ChatbotWidget";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Upload from "./pages/Upload";
import Results from "./pages/Results";
import Dashboard from "./pages/Dashboard";
import Doctors from "./pages/Doctors";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <AuthProvider>
      <Navbar />
      <main className="min-h-[calc(100vh-72px)] pb-16">
        <Routes>
          <Route path="/" element={<Navigate to="/upload" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/upload"
            element={
              <ProtectedRoute>
                <Upload />
              </ProtectedRoute>
            }
          />
          <Route
            path="/results/:prediction_id"
            element={
              <ProtectedRoute>
                <Results />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Admin />
              </ProtectedRoute>
            }
          />
          <Route path="/doctors" element={<Doctors />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <ChatbotWidget />
    </AuthProvider>
  );
}
