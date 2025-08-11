// src/App.js
import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";

import Sidebar from "./components/Sidebar";

// Pages (for inside app)
import Dashboard from "./pages/Dashboard";
import LearningHub from "./pages/LearningHub";
import DatasetManager from "./pages/DatasetManager";
import EDAStudio from "./pages/EDAStudio";
import ModelBuilder from "./pages/ModelBuilder";
import PredictionStudio from "./pages/PredictionStudio";
import PracticeLab from "./pages/PracticalLab";
import CareerRoadmaps from "./pages/CarrerRoadmaps";
import Reports from "./pages/Reports";
import AIChatbot from "./pages/AIChatbot";

// Auth pages
import Login from "./pages/Login";
import Signup from "./pages/Signup";

function AppLayout({ children, currentPage, setCurrentPage }) {
  return (
    <div className="flex bg-gray-100 min-h-screen">
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <main className="flex-1 p-6 overflow-y-auto">{children}</main>
    </div>
  );
}

function ProtectedRoute({ user, children }) {
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const [user, setUser] = useState(null);

  // NEW: page tracking state
  const [currentPage, setCurrentPage] = useState("Dashboard");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* App shell with nested routes under /app/* */}
      <Route
        path="/app/*"
        element={
          <ProtectedRoute user={user}>
            <AppLayout currentPage={currentPage} setCurrentPage={setCurrentPage}>
              <Routes>
                {/* nested (relative) routes under /app */}
                <Route index element={<Dashboard />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="learning-hub" element={<LearningHub />} />
                <Route path="dataset-manager" element={<DatasetManager />} />
                <Route path="eda-studio" element={<EDAStudio />} />
                <Route path="model-builder" element={<ModelBuilder />} />
                <Route path="prediction-studio" element={<PredictionStudio />} />
                <Route path="practice-lab" element={<PracticeLab />} />
                <Route path="career-roadmaps" element={<CareerRoadmaps />} />
                <Route path="reports" element={<Reports />} />
                <Route path="ai-chatbot" element={<AIChatbot />} />
                <Route path="*" element={<Navigate to="/app" replace />} />
              </Routes>
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* root: go to /app if logged in else /login */}
      <Route path="/" element={<Navigate to={user ? "/app" : "/login"} replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
