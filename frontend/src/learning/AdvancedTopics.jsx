// src/learning/AdvancedTopics.jsx
import React from "react";
import VideoCard from "../components/VideoCard";

/*
  YouTube IDs extracted from your embed URLs:
  jxuNLH5dXCs, 0sOvCWFmrtA, oGpLdDk6r2U, fSytzGwwBVw
*/
const videoData = [
  { id: "RtrBtAKwcxQ", title: "Ensemble Learning: Bagging" },
  { id: "NLRO1-jp5F8", title: "Ensemble Learning: Boosting" },
  { id: "sN5ZcJLDMaE", title: "Ensemble Learning: Boosting,Bagging and Stacking" },
  { id: "Wr1JjhTt1Xg", title: " Flask vs FastAPI" },
  { id: "b5F667g1yCk", title: "Deploying ML Models with FastAPI" },
  { id: "xOccYkgRV4Q", title: "ML Pipelines using Scikit-learn" },
  { id: "yh2AKoJCV3k", title: "Handling Imbalanced Data (SMOTE, UNDERSAMPLING, OVERSAMPLING)" },
];

const AdvancedTopics = () => {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-purple-700 mb-6 border-b-4 border-purple-500 pb-2">
        🧑‍🎓 Advanced Topics
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {videoData.map((v) => (
          <VideoCard key={v.id} videoId={v.id} title={v.title} />
        ))}
      </div>
    </div>
  );
};

export default AdvancedTopics;
