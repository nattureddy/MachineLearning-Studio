// src/components/Sidebar.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

import {
  LuLayoutDashboard,
  LuBook,
  LuDatabase,
  LuChartBar,
  LuHammer,
  LuGraduationCap,
  LuLaptop,
  LuMessageSquare,
  LuProjector,
  LuChevronRight,
  LuChevronLeft,
  LuLogOut,
  LuMail, // Using LuMail for the Feedback icon
} from "react-icons/lu";

const navItems = [
  { name: "Dashboard", icon: <LuLayoutDashboard className="w-5 h-5" />, to: "/app" },
  { name: "Learning Hub", icon: <LuBook className="w-5 h-5" />, to: "/app/learning-hub" },
  { name: "Resource Manager", icon: <LuDatabase className="w-5 h-5" />, to: "/app/dataset-manager" },
  { name: "EDA Studio", icon: <LuChartBar className="w-5 h-5" />, to: "/app/eda-studio" },
  { name: "Model Builder", icon: <LuHammer className="w-5 h-5" />, to: "/app/model-builder" },
  { name: "Prediction Studio", icon: <LuGraduationCap className="w-5 h-5" />, to: "/app/prediction-studio" },
  { name: "Practice Lab", icon: <LuLaptop className="w-5 h-5" />, to: "/app/practice-lab" },
  { name: "AI Chatbot", icon: <LuMessageSquare className="w-5 h-5" />, to: "/app/ai-chatbot" },
  { name: "Career Roadmaps", icon: <LuProjector className="w-5 h-5" />, to: "/app/career-roadmaps" },
  { name: "Feedback", icon: <LuMail className="w-5 h-5" />, to: "/app/feedback" },
];

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem("ml_studio_sidebar_collapsed") === "true";
    } catch {
      return false;
    }
  });

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    try {
      localStorage.setItem("ml_studio_sidebar_collapsed", collapsed ? "true" : "false");
    } catch {}
  }, [collapsed]);

  const handleNav = (item) => {
    if (location.pathname !== item.to) {
      navigate(item.to);
    }
  };

  const handleLogout = async () => {
    try {
      if (!auth) {
        console.error("Firebase `auth` is undefined. Check src/firebase.js export.");
        return;
      }
      await signOut(auth);
      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Logout failed:", err);
      alert("Logout failed — see console for details.");
    }
  };

  const isActive = (item) => location.pathname === item.to;

  return (
    <>
      <aside
        aria-label="Primary navigation"
        className={`fixed top-0 left-0 h-screen overflow-y-auto z-40 ${collapsed ? "w-20" : "w-64"} bg-gray-900 text-white p-4 flex flex-col transition-all duration-300`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          {!collapsed && <h2 className="text-2xl font-bold tracking-wide text-indigo-400">ML Studio</h2>}
          <button
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
            className="p-1 rounded-full text-gray-400 hover:bg-gray-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-200"
          >
            {collapsed ? <LuChevronRight className="w-6 h-6" /> : <LuChevronLeft className="w-6 h-6" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1" role="navigation" aria-label="Main">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const active = isActive(item);
              return (
                <li key={item.name}>
                  <button
                    onClick={() => handleNav(item)}
                    title={collapsed ? item.name : undefined}
                    className={`w-full flex items-center ${
                      collapsed ? "justify-center" : "justify-start gap-4"
                    } p-3 rounded-lg text-sm font-medium transition-all duration-200 ease-in-out ${
                      active
                        ? "bg-indigo-600 text-white shadow-md border-l-4 border-indigo-300"
                        : "text-gray-300 hover:bg-gray-800"
                    }`}
                  >
                    {item.icon}
                    {!collapsed && <span className="truncate">{item.name}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="mt-auto p-2 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center ${
              collapsed ? "justify-center" : "justify-start gap-4"
            } p-3 text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500`}
          >
            <LuLogOut className="w-5 h-5" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Spacer div to push the main content */}
      <div className={`transition-all duration-300 ease-in-out ${collapsed ? "ml-20" : "ml-64"}`} />
    </>
  );
};

export default Sidebar;