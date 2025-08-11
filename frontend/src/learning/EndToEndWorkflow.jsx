// src/learning/EndToEndWorkflow.jsx
import React from "react";
import VideoCard from "../components/VideoCard";

/*
  YouTube IDs extracted from your embed URLs:
  QIUxPv5PJOY, kCc8FmEb1nY, TklRyz7ZK6M, Ctg8JzBz8-A, B2iAodr0fOo
*/
const videoData = [
  { id: "bDhvCp3_lYw", title: "Data Cleaning, & Analysis" },
  { id: "NQifPki6tGE", title: "Train-Test Split" },
  { id: "iUUSamG4P80", title: "Model Selection" },
  { id: "qS78U0ErvN8", title: "Model Evaluation & Retraining" },
  { id: "_exn_pMJwzM", title: "Saving Model with Pickle/Joblib" },
  { id: "5XnHlluw-Eo", title: "Deploying Model with UI (Streamlit)" },
  { id: "UbCWoMf80PY", title: "Deploying Model with UI (Flask)" },
];

export default function EndToEndWorkflow() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-green-700 mb-6 border-b-4 border-green-500 pb-2">
        🗃️ End-to-End ML Project Workflow
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {videoData.map((v) => (
          <VideoCard key={v.id} videoId={v.id} title={v.title} />
        ))}
      </div>
    </div>
  );
}
