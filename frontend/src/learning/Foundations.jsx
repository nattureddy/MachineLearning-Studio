// src/learning/Foundations.jsx
import React from "react";
import VideoCard from "../components/VideoCard";

const videoData = [
  { id: "ukzFI9rgwfU", title: "What is Machine Learning?" },
  { id: "vNc2z2u_nh0", title: "AI vs ML vs DL vs Data Science" },
  { id: "CczL0lb670I", title: "Real-world Applications of ML" },
  { id: "82P5N2m41jE", title: "Setting up your ML Environment" },
];

const Foundations = () => {
  return (
    <div className="p-8">
      <h1 className="text-4xl font-extrabold text-gray-900 mb-6 pb-2 border-b-4 border-indigo-600">
        Foundations of Machine Learning
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {videoData.map((v) => (
          <VideoCard key={v.id} videoId={v.id} title={v.title} />
        ))}
      </div>
    </div>
  );
};

export default Foundations;
