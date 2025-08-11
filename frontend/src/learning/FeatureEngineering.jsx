// src/learning/FeatureEngineering.jsx
import React from "react";
import VideoCard from "../components/VideoCard";

const videoData = [
  { id: "4w-S6Hi1mA4", title: "Creating New Features from Existing Data" },
  { id: "GJnSBhxWEEg", title: "Feature Selection Techniques (Filter, Wrapper, Embedded)" },
  { id: "gh5JzALBQvU", title: "Handling Multicollinearity" },
];

export default function FeatureEngineering() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-blue-700 mb-6 border-b-4 border-blue-500 pb-2">
        🧬 Feature Engineering
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {videoData.map((v) => (
          <VideoCard key={v.id} videoId={v.id} title={v.title} />
        ))}
      </div>
    </div>
  );
}
