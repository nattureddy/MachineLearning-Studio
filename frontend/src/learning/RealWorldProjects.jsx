// src/learning/RealWorldProjects.jsx
import React from "react";
import VideoCard from "../components/VideoCard"; // make sure path is correct

const videoData = [
  { id: "XckM1pFgZmg", title: "Loan Status Prediction" },
  { id: "fATVVQfFyU0", title: "Titanic Survival Prediction" },
  { id: "Wqmtf9SA_kk", title: "House Price Prediction" },
  { id: "qNglJgNOb7A", title: "Customer Churn Prediction" },
  { id: "1O_BenficgE", title: "Stock Market Trend Classification" },
  { id: "U6ieiJAhXQ4", title: "Fake News Detection" },
  { id: "20fbgWm5M2o", title: "Sales Forecasting" },
  { id: "jCoF1rMs_0s", title: "Credit Card Fraud Detection" },
];

export default function RealWorldProjects() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-orange-700 mb-6 border-b-4 border-orange-500 pb-2">
        📈 Real-World Projects (Apply Everything)
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {videoData.map((v) => (
          <VideoCard key={v.id} videoId={v.id} title={v.title} />
        ))}
      </div>
    </div>
  );
}
