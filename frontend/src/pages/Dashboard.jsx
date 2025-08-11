import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import QuickAction from "../components/QuickAction";
import UploadBox from "../components/UploadBox";
import DataTable from "../components/DataTable";
import ProgressBar from "../components/ProgressBar";
import { auth } from "../firebase";
import axios from "axios";

const Dashboard = () => {
  const navigate = useNavigate();
  const [showUploadBox, setShowUploadBox] = useState(false);

  const [datasets, setDatasets] = useState([]);
  const [loadingDatasets, setLoadingDatasets] = useState(true);
  const [errorDatasets, setErrorDatasets] = useState("");

  const [models, setModels] = useState([]);
  const [loadingModels, setLoadingModels] = useState(true);
  const [errorModels, setErrorModels] = useState("");

  const [successMessage, setSuccessMessage] = useState(""); // NEW success banner

  const progressItems = [
    { name: "ML Basics", progress: 75 },
    { name: "EDA Techniques", progress: 40 },
    { name: "Model Building", progress: 20 },
  ];

  const getAuthHeaders = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("User not authenticated");
    const uid = currentUser.uid;
    const token = await currentUser.getIdToken(false);
    return {
      Authorization: `Bearer ${token}`,
      "X-User-Uid": uid,
    };
  };

  const fetchDatasets = async () => {
    try {
      setLoadingDatasets(true);
      setErrorDatasets("");
      const headers = await getAuthHeaders();
      const resp = await axios.get("http://localhost:8000/datasets", { headers });
      setDatasets(resp.data.datasets || []);
    } catch (err) {
      setErrorDatasets("Failed to load datasets.");
    } finally {
      setLoadingDatasets(false);
    }
  };

  const fetchModels = async () => {
    try {
      setLoadingModels(true);
      setErrorModels("");
      const headers = await getAuthHeaders();
      const resp = await axios.get("http://localhost:8000/model/saved", { headers });
      const modelsWithMetrics = (resp.data.models || []).map((m) => ({
        id: m.id,
        name: m.name,
        algorithm: m.algorithm,
        accuracy:
          m.metrics && m.metrics.accuracy
            ? (typeof m.metrics.accuracy === "number"
                ? (m.metrics.accuracy * 100).toFixed(2) + "%"
                : m.metrics.accuracy)
            : "N/A",
        date: m.created_at ? new Date(m.created_at).toLocaleString() : "—",
      }));
      setModels(modelsWithMetrics);
    } catch (err) {
      setErrorModels("Failed to load saved models.");
    } finally {
      setLoadingModels(false);
    }
  };

  useEffect(() => {
    fetchDatasets();
    fetchModels();
  }, []);

  const handleDatasetUploaded = () => {
    fetchDatasets();
    setSuccessMessage("✅ Dataset uploaded successfully.");
    setShowUploadBox(false); // hide upload box
    setTimeout(() => setSuccessMessage(""), 4000); // hide banner after 4s
  };

  const Card = ({ title, children, icon }) => (
    <div className="bg-white p-6 mb-6 rounded-xl shadow-lg border border-gray-200 flex flex-col">
      <div className="flex items-center mb-4">
        {icon && <span className="mr-2 text-blue-500">{icon}</span>}
        <h2 className="text-xl font-bold text-gray-800">{title}</h2>
      </div>
      <div>{children}</div>
    </div>
  );

  const loadingSpinner = (
    <div className="flex justify-center items-center py-8">
      <svg
        className="animate-spin h-8 w-8 text-blue-500"
        xmlns="http://www.w3.org/2000/svg"
        fill="none" viewBox="0 0 24 24"
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" 
          stroke="currentColor" strokeWidth="4">
        </circle>
        <path className="opacity-75" fill="currentColor" 
          d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4zm2 
             5.29A7.96 7.96 0 014 12H0c0 3.04 1.14 5.82 3 7.94l3-2.65z">
        </path>
      </svg>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 p-8 font-sans text-gray-800">
      <div className="max-w-5xl mx-auto">
        
        {/* Global Success Banner */}
        {successMessage && (
          <div className="mb-6 p-3 rounded bg-green-100 border border-green-400 text-green-800 text-center">
            {successMessage}
          </div>
        )}

        {/* Page Header */}
        <header className="mb-8 flex flex-col">
          <h1 className="text-4xl font-extrabold text-blue-800 mb-2">
            Welcome to Your ML Studio ✨
          </h1>
          <p className="text-lg text-gray-600">
            Your hub for all things data science and machine learning.
          </p>
        </header>

        {/* Quick Actions */}
        <div className="mb-8">
          <Card title="Quick Actions">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <QuickAction
                icon="upload"
                label="Upload Dataset"
                onClick={() => setShowUploadBox((prev) => !prev)}
                className="bg-blue-600 text-white hover:bg-blue-700"
              />
              <QuickAction
                icon="model"
                label="Train Model"
                onClick={() => navigate("/app/model-builder")}
                className="bg-purple-600 text-white hover:bg-purple-700"
              />
              <QuickAction
                icon="learn"
                label="Explore Models"
                onClick={() => navigate("/app/prediction-studio")}
                className="bg-green-600 text-white hover:bg-green-700"
              />
              <QuickAction
                icon="analysis"
                label="Data Analysis"
                onClick={() => navigate("/app/eda-studio")}
                className="bg-yellow-500 text-white hover:bg-yellow-600"
              />
            </div>
          </Card>
        </div>

        {/* Upload Box */}
        {showUploadBox && (
          <div className="mb-8">
            <Card title="Upload a New Dataset">
              <UploadBox onUploaded={handleDatasetUploaded} />
            </Card>
          </div>
        )}

        {/* Models */}
        <div className="mb-8">
          <Card title="Recent Saved Models">
            {loadingModels && loadingSpinner}
            {errorModels && <p className="text-red-500 text-center">{errorModels}</p>}
            {!loadingModels && models.length > 0 ? (
              <DataTable
                data={models}
                columns={["name", "algorithm", "accuracy", "date"]}
              />
            ) : (
              !loadingModels && <p className="text-gray-500 text-center">No models saved yet.</p>
            )}
          </Card>
        </div>

        {/* Datasets */}
        <div className="mb-8">
          <Card title="Uploaded Datasets">
            {loadingDatasets && loadingSpinner}
            {errorDatasets && <p className="text-red-500 text-center">{errorDatasets}</p>}
            {!loadingDatasets && datasets.length > 0 ? (
              <DataTable
                data={datasets.map((ds) => ({
                  name: ds.filename,
                  size: (ds.size_bytes / 1024).toFixed(2) + " KB",
                  date: ds.uploaded_at 
                    ? new Date(ds.uploaded_at).toLocaleString()
                    : "—",
                }))}
                columns={["name", "size", "date"]}
              />
            ) : (
              !loadingDatasets && <p className="text-gray-500 text-center">No datasets uploaded yet.</p>
            )}
          </Card>
        </div>

        {/* Learning Progress */}
        <div className="mb-8">
          <Card title="Learning Progress">
            <div className="space-y-4">
              {progressItems.map((item, index) => (
                <ProgressBar key={index} name={item.name} progress={item.progress} />
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
