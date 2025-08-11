// src/learning/SupervisedLearning.jsx
import React from "react";
import VideoCard from "../components/VideoCard";

/*
  Use the YouTube IDs (not the full embed URL). 
  I extracted IDs from your placeholder URLs.
*/
const videoData = [
  { id: "8jazNUpO3lQ", title: "Linear Regression with Gradient Descent" },
  { id: "BNWLf3cKdbQ", title: "Polynomial Regression Explained" },
  { id: "aEow1QoTLo0", title: "Ridge Regression Part 1(L2 Regularization)" },
  { id: "oDlZBQjk_3A", title: "Ridge Regression Part 2(L2 Regularization)" },
  { id: "HLF4bFbBgwk", title: "Lasso Regression (L1 Regularization)" },
];

const SupervisedLearning = () => {
  return (
    <div className="p-8">
      <h1 className="text-4xl font-extrabold text-gray-900 mb-6 pb-2 border-b-4 border-blue-600">
        📘 Supervised Learning — Regression Techniques
      </h1>
      <p className="text-gray-700 mb-8">
        Learn how to fit models to data using linear lines, curves, and regularized strength — where algorithms strive to minimize loss and maximize understanding.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {videoData.map((v) => (
          <VideoCard key={v.id} videoId={v.id} title={v.title} />
        ))}
      </div>
    </div>
  );
};

export default SupervisedLearning;
