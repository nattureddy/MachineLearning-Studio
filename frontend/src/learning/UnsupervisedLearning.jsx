import React from 'react';
import VideoCard from '../components/VideoCard'; // Reuse your video component

const videos = [
  {
    id: "5shTLzwAdEc",
    title: "Clustering: K-Means Explained",
  },
  {
    id: "Ka5i9TVUT-E",
    title: "Hierarchical Clustering",
  },
  {
    id: "1_bLnsNmhCI",
    title: "DBSCAN Clustering",
  },
  {
    id: "8klqIM9UvAc",
    title: "Dimensionality Reduction with PCA",
  },
  {
    id: "NEaUSP4YerM",
    title: "t-SNE Intuition and Use Case",
  },
  {
    id: "guVvtZ7ZClw",
    title: "Association Rules (Apriori Algorithm)",
  },
  {
    id: "kN--TRv1UDY",
    title: "Anomaly Detection with Isolation Forest",
  },
];

const UnsupervisedLearning = () => {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4 text-indigo-700">📊 Unsupervised Learning</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {videos.map((video) => (
          <VideoCard key={video.id} title={video.title} videoId={video.id} />
        ))}
      </div>
    </div>
  );
};

export default UnsupervisedLearning;
