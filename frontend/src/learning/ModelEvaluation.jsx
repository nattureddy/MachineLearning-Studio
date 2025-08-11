// src/learning/ModelEvaluation.jsx
import React from "react";
import VideoCard from "../components/VideoCard";

/*
  YouTube IDs extracted from your provided embed URLs:
  Kdsp6soqA7o, 4jRBRDbJemM, 1g-pXg6Yhgo, 6dbrR-WymjI, LKDyFlxJsmA, EuBBz3bI-aA
*/
const videoData = [
  { id: "Kdsp6soqA7o", title: "Confusion Matrix" },
  { id: "2osIZ-dSPGE", title: "Precision, Recall, F1-Score" },
  { id: "Ti7c-Hz7GSM", title: "Regression Metrics: MAE, MSE, RMSE, R²" },
  { id: "7062skdX05Y", title: "Cross Validation Techniques (k-Fold, Stratified)" },
  { id: "82fPl5l0vXY", title: "Hyperparameter Tuning (GridSearchCV, RandomizedSearchCV)" },
  { id: "74DU02Fyrhk", title: "Bias-Variance Tradeoff" },
];

const ModelEvaluation = () => {
  return (
    <div className="p-8">
      <h1 className="text-4xl font-extrabold text-gray-900 mb-6 pb-2 border-b-4 border-purple-600">
        🔍 Model Evaluation & Tuning
      </h1>
      <p className="text-gray-700 mb-8">
        In this chapter, we learn how to evaluate and refine our machine learning models — balancing accuracy with generalization, and precision with robustness.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {videoData.map((v) => (
          <VideoCard key={v.id} videoId={v.id} title={v.title} />
        ))}
      </div>
    </div>
  );
};

export default ModelEvaluation;
