// src/learning/NeuralNetworks.jsx
import React from "react";
import VideoCard from "../components/VideoCard";

const videoData = [
  { id: "BPOl4_vN3IM", title: "Perceptron & MLP Explained" },
  { id: "Y9qdKsOHRjA", title: "Activation Functions: ReLU, Sigmoid, Tanh" },
  { id: "odlgtjXduVg", title: "Backpropagation & Gradient Descent" },
  { id: "tPYj3fFJGjk", title: "Intro to TensorFlow/Keras & PyTorch" },
];

export default function NeuralNetworks() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-red-600 mb-6 border-b-4 border-red-400 pb-2">
        🤖 Neural Networks & Deep Learning
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {videoData.map((v) => (
          <VideoCard key={v.id} videoId={v.id} title={v.title} />
        ))}
      </div>
    </div>
  );
}
