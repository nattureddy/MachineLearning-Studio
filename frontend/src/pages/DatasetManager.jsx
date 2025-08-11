import React, { useEffect, useState } from "react";
import axios from "axios";
import { auth } from "../firebase";
import { motion } from "framer-motion";

const API_BASE = "http://localhost:8000";

const Card = ({ title, children, icon }) => (
  <motion.div
    className="bg-white p-6 rounded-xl shadow-lg border border-gray-200"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
      {icon && <span className="mr-2 text-blue-500">{icon}</span>}
      {title}
    </h2>
    {children}
  </motion.div>
);

const loadingSpinner = (
  <div className="flex justify-center items-center py-8">
    <motion.svg
      className="h-8 w-8 text-blue-500"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </motion.svg>
  </div>
);

const ConfirmationDialog = ({ message, onConfirm, onCancel }) => (
  <motion.div
    className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.3 }}
  >
    <motion.div
      className="bg-white p-6 rounded-xl shadow-2xl max-w-sm mx-auto"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <p className="text-lg font-semibold text-gray-800 mb-4">{message}</p>
      <div className="flex justify-end gap-4">
        <motion.button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-full text-sm hover:bg-gray-300 transition duration-150"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Cancel
        </motion.button>
        <motion.button
          onClick={onConfirm}
          className="px-4 py-2 bg-red-600 text-white rounded-full text-sm font-medium hover:bg-red-700 transition duration-150"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Delete
        </motion.button>
      </div>
    </motion.div>
  </motion.div>
);

const DatasetManager = () => {
  const [datasets, setDatasets] = useState([]);
  const [loadingDatasets, setLoadingDatasets] = useState(true);
  const [datasetsError, setDatasetsError] = useState("");
  const [datasetsSuccess, setDatasetsSuccess] = useState("");

  const [models, setModels] = useState([]);
  const [loadingModels, setLoadingModels] = useState(true);
  const [modelsError, setModelsError] = useState("");
  const [modelsSuccess, setModelsSuccess] = useState("");

  const [itemToDelete, setItemToDelete] = useState(null);
  const [itemType, setItemType] = useState(null);

  const getAuthHeaders = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("User not authenticated");
    }
    const uid = currentUser.uid;
    const token = await currentUser.getIdToken(false);
    return {
      Authorization: `Bearer ${token}`,
      "X-User-Uid": uid,
    };
  };

  const fetchDatasets = async () => {
    setLoadingDatasets(true);
    setDatasetsError("");
    try {
      const headers = await getAuthHeaders();
      const response = await axios.get(`${API_BASE}/datasets`, { headers });
      setDatasets(response.data.datasets || []);
    } catch (error) {
      console.error("Failed to fetch datasets:", error);
      setDatasetsError("Failed to fetch datasets.");
    }
    setLoadingDatasets(false);
  };

  const fetchModels = async () => {
    setLoadingModels(true);
    setModelsError("");
    try {
      const headers = await getAuthHeaders();
      const response = await axios.get(`${API_BASE}/model/saved`, { headers });
      setModels(response.data.models || []);
    } catch (error) {
      console.error("Failed to fetch saved models:", error);
      setModelsError("Failed to fetch saved models.");
    }
    setLoadingModels(false);
  };

  const downloadDataset = (filename) => {
    const link = document.createElement("a");
    link.href = `${API_BASE}/datasets/download/${encodeURIComponent(filename)}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteDataset = (filename) => {
    setItemToDelete({ name: filename });
    setItemType("dataset");
  };

  const handleDeleteModel = (modelId, modelName) => {
    setItemToDelete({ id: modelId, name: modelName });
    setItemType("model");
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    if (itemType === "dataset") {
      try {
        const headers = await getAuthHeaders();
        await axios.delete(`${API_BASE}/datasets/${encodeURIComponent(itemToDelete.name)}`, { headers });
        setDatasets((prev) => prev.filter((d) => d.filename !== itemToDelete.name));
        setDatasetsSuccess(`Dataset "${itemToDelete.name}" was deleted successfully.`);
        setTimeout(() => setDatasetsSuccess(""), 5000);
      } catch (error) {
        console.error("Failed to delete dataset:", error);
        setDatasetsError("Failed to delete dataset. Check console for details.");
        setTimeout(() => setDatasetsError(""), 5000);
      }
    } else if (itemType === "model") {
      try {
        const headers = await getAuthHeaders();
        await axios.delete(`${API_BASE}/model/${itemToDelete.id}`, { headers });
        setModels((prev) => prev.filter((m) => m.id !== itemToDelete.id));
        setModelsSuccess(`Model "${itemToDelete.name}" was deleted successfully.`);
        setTimeout(() => setModelsSuccess(""), 5000);
      } catch (error) {
        console.error("Failed to delete model:", error);
        setModelsError("Failed to delete model. Check console for details.");
        setTimeout(() => setModelsError(""), 5000);
      }
    }
    setItemToDelete(null);
    setItemType(null);
  };

  const handleCancelDelete = () => {
    setItemToDelete(null);
    setItemType(null);
  };

  useEffect(() => {
    fetchDatasets();
    fetchModels();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8 font-sans text-gray-800">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-extrabold text-blue-800">
            Resource Manager 🗄️
          </h1>
          <p className="text-lg text-gray-600 mt-2">
            View and manage your uploaded datasets and saved models.
          </p>
        </header>

        <div className="space-y-12">
          <Card
            title="Uploaded Datasets"
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"></path></svg>}
          >
            {datasetsSuccess && (
              <motion.div
                className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4 rounded"
                role="alert"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <p>{datasetsSuccess}</p>
              </motion.div>
            )}
            {datasetsError && (
              <motion.div
                className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded"
                role="alert"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <p>{datasetsError}</p>
              </motion.div>
            )}
            {loadingDatasets && loadingSpinner}
            {!loadingDatasets && datasets.length === 0 && (
              <p className="text-center text-gray-500 py-4">No datasets uploaded yet.</p>
            )}
            {!loadingDatasets && datasets.length > 0 && (
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Filename</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size (KB)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rows</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uploaded At</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {datasets.map((ds) => (
                      <motion.tr
                        key={ds.id}
                        className="hover:bg-gray-50 transition-colors duration-150 ease-in-out"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{ds.filename}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{(ds.size_bytes / 1024).toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{ds.rows || "—"}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {ds.uploaded_at ? new Date(ds.uploaded_at).toLocaleString() : "—"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                          <motion.button
                            onClick={() => downloadDataset(ds.filename)}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-full text-xs font-medium hover:bg-indigo-700 transition duration-150 ease-in-out shadow-sm"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            Download
                          </motion.button>
                          <motion.button
                            onClick={() => handleDeleteDataset(ds.filename)}
                            className="px-4 py-2 bg-red-600 text-white rounded-full text-xs font-medium hover:bg-red-700 transition duration-150 ease-in-out shadow-sm"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            Delete
                          </motion.button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card
            title="Saved Models"
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M8 12h8m-8 4h8m-8-8h8"></path></svg>}
          >
            {modelsSuccess && (
              <motion.div
                className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4 rounded"
                role="alert"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <p>{modelsSuccess}</p>
              </motion.div>
            )}
            {modelsError && (
              <motion.div
                className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded"
                role="alert"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <p>{modelsError}</p>
              </motion.div>
            )}
            {loadingModels && loadingSpinner}
            {!loadingModels && models.length === 0 && (
              <p className="text-center text-gray-500 py-4">No saved models found for your account.</p>
            )}
            {!loadingModels && models.length > 0 && (
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Algorithm</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {models.map((model) => (
                      <motion.tr
                        key={model.id}
                        className="hover:bg-gray-50 transition-colors duration-150 ease-in-out"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{model.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{model.task}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{model.algorithm}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {model.created_at ? new Date(model.created_at).toLocaleString() : "—"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                          <motion.button
                            onClick={() => handleDeleteModel(model.id, model.name)}
                            className="px-4 py-2 bg-red-600 text-white rounded-full text-xs font-medium hover:bg-red-700 transition duration-150 ease-in-out shadow-sm"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            Delete
                          </motion.button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {itemToDelete && (
          <ConfirmationDialog
            message={`Are you sure you want to delete "${itemToDelete.name}"? This action cannot be undone.`}
            onConfirm={handleConfirmDelete}
            onCancel={handleCancelDelete}
          />
        )}
      </div>
    </div>
  );
};

export default DatasetManager;