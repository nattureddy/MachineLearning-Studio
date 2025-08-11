// src/learning/DataPreparation.jsx
import React from "react";
import VideoCard from "../components/VideoCard";

/*
  We extract the YouTube ID portion from your embed URLs.
  The IDs below correspond to the placeholders you posted.
*/
const videoData = [
  { id: "DUcXZ08IdMo", title: "Understanding Data Types (Numerical, Categorical, Ordinal)" },
  { id: "P_iMSYQnqac", title: "Handling Missing Values" },
  { id: "7sJaRHF03K8", title: "Outlier Detection & Treatment" },
  { id: "KFuEAGR3HS4", title: "Outlier Detection & Treatment" },
  { id: "OTPz5plKb40", title: "Feature Encoding (OneHot, Label Encoding)" },
  { id: "mnKm3YP56PY", title: "Feature Scaling (Normalization, Standardization)" },
  { id: "SjOfbbfI2qY", title: "Train-Test Split" },
  { id: "fSytzGwwBVw", title: "Cross Validation" },
  { id: "LZzq1zSL1bs", title: "Data Summary Statistics" },
  { id: "UZDP9IPMqcs", title: "Data Visualization with Matplotlib / Seaborn / Plotly" },
  { id: "1fFVt4tQjRE", title: "Correlation Matrix" },
  { id: "J7cd1-g1O7A", title: "Heatmaps" },
  { id: "CfNQA5YV2U4", title: "Identifying Relationships and Patterns" },
];

const DataPreparation = () => {
  return (
    <div className="p-8">
      <h1 className="text-4xl font-extrabold text-gray-900 mb-6 pb-2 border-b-4 border-rose-600">
        📂 Data Preparation & 🔍 EDA
      </h1>
      <p className="text-gray-700 mb-8">
        In this chapter, we prepare our data — cleaning, encoding, scaling, splitting —
        and then dive deep into its hidden truths using visual tools and statistics.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {videoData.map((video) => (
          <VideoCard key={video.id} videoId={video.id} title={video.title} />
        ))}
      </div>
    </div>
  );
};

export default DataPreparation;
