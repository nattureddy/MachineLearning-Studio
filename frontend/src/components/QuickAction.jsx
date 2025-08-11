// src/components/QuickAction.jsx
import React from "react";
import { LuUpload, LuFileText } from "react-icons/lu";
import { FaBrain } from "react-icons/fa";

const iconMap = {
  upload: <LuUpload className="w-10 h-10 text-indigo-500 mb-2" />,
  model: <FaBrain className="w-10 h-10 text-green-500 mb-2" />,
  learn: <LuFileText className="w-10 h-10 text-yellow-500 mb-2" />,
  report: <LuFileText className="w-10 h-10 text-purple-500 mb-2" />,
  analysis: <LuFileText className="w-10 h-10 text-sky-500 mb-2" />,
};

const QuickAction = ({ icon, label, onClick, className = "", type = "button", ...rest }) => {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-6 bg-white rounded-xl shadow-md hover:shadow-xl transition duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-400 ${className}`}
      aria-label={label}
      {...rest}
    >
      {iconMap[icon] ?? iconMap["report"]}
      <span className="text-lg font-semibold text-gray-800">{label}</span>
    </button>
  );
};

export default QuickAction;
