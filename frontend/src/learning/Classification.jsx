// src/learning/Classification.jsx
import React from "react";
import VideoCard from "../components/VideoCard";

/*
  YouTube IDs extracted from your provided embed URLs:
  yIYKR4sgzI8, HVXime0nQeI, _L39rN6gz7Y, J4Wdy0Wc_xQ, efR1C6CvhmE, DOJoZDyy_CQ, 3CC4N4z3GJc
*/
const videoData = [
  { id: "zM4VZR0px8E", title: "Logistic Regression" },
  { id: "CQveSaMyEwM", title: "k-Nearest Neighbors (kNN)" },
  { id: "PHxYNGo8NcI", title: "Decision Trees" },
  { id: "ok2s1vV9XW0", title: "Random Forests" },
  { id: "H9yACitf-KM", title: "Support Vector Machines (SVM part 1)" },
  { id: "Js3GLb1xPhc", title: "Support Vector Machines (SVM part 2)" },
  { id: "8bFKyb77vp0", title: "Support Vector Machines (SVM part 3)" },
  { id: "dl_ZsuHSIFE", title: "Support Vector Machines (SVM part 4)" },
  { id: "GBMMtXRiQX0", title: "Naive Bayes" },
  { id: "Nol1hVtLOSg", title: "Gradient Boosting Part 1" },
  { id: "Oo9q6YtGzvc", title: "Gradient Boosting Part 2" },
  { id: "gPciUPwWJQQ", title: "XGboost Part 1" },
  { id: "w-_vmVfpssg", title: "XGboost Part 1" },
];

const Classification = () => {
  return (
    <div className="p-8">
      <h1 className="text-4xl font-extrabold text-gray-900 mb-6 pb-2 border-b-4 border-green-600">
        🧠 Classification Algorithms
      </h1>
      <p className="text-gray-700 mb-8">
        Learn to classify the world — emails into spam, images into animals, or patients into health groups — using powerful classification algorithms.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {videoData.map((v) => (
          <VideoCard key={v.id} videoId={v.id} title={v.title} />
        ))}
      </div>
    </div>
  );
};

export default Classification;
