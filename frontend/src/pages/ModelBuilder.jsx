import React, { useState, useEffect } from "react";
import axios from "axios";
import { auth } from "../firebase";

const API_BASE = "http://localhost:8000";

const taskTypes = [
  { id: "regression", label: "Regression" },
  { id: "classification", label: "Classification" },
  { id: "clustering", label: "Clustering" },
];

const algorithms = {
  regression: [
    "Linear Regression",
    "Polynomial Regression",
    "Ridge Regression",
    "Lasso Regression",
  ],
  classification: [
    "Logistic Regression",
    "Random Forest",
    "SVM",
    "KNN",
    "Naive Bayes",
    "XGBoost",
  ],
  clustering: ["K-Means", "Hierarchical", "DBSCAN"],
};

const improvementOptions = [
  "Standardization",
  "Normalization",
  "PCA",
  "Feature Selection",
  "Hyperparameter Tuning",
  "Remove Outliers",
  "Handle Missing Values",
  "Polynomial Features",
  "Encoding Categorical Data",
  "SMOTE (for imbalance)",
];

const Card = ({ children, title, step }) => (
  <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
    <h2 className="text-xl font-bold text-gray-800 mb-4">
      {step && <span className="text-blue-500 mr-2">{step}.</span>}
      {title}
    </h2>
    {children}
  </div>
);

const loadingSpinner = (
  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

export default function ModelBuilder() {
  const [task, setTask] = useState("");
  const [dataset, setDataset] = useState("");
  const [datasetFilename, setDatasetFilename] = useState("");
  const [datasetList, setDatasetList] = useState([]);
  const [algorithm, setAlgorithm] = useState("");
  const [split, setSplit] = useState(0.2);
  const [trainMetrics, setTrainMetrics] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [loadingTrain, setLoadingTrain] = useState(false);
  const [savingModel, setSavingModel] = useState(false);

  const [selectedImprovementsMulti, setSelectedImprovementsMulti] = useState([]);

  useEffect(() => {
    const fetchDatasets = async () => {
      try {
        const uid = auth?.currentUser?.uid;
        let url = `${API_BASE}/datasets`;
        if (uid) url += `?uid=${uid}`;
        const res = await axios.get(url);
        setDatasetList(res.data.datasets || []);
      } catch (err) {
        console.error("Error fetching datasets", err);
      }
    };
    fetchDatasets();
  }, []);

  useEffect(() => {
    if (dataset) {
      const parts = dataset.split(/[\\/]/);
      setDatasetFilename(parts[parts.length - 1]);
    } else {
      setDatasetFilename("");
    }
  }, [dataset]);

  const handleTrainModel = async () => {
    if (!task || !dataset || !algorithm) {
      alert("Please select task type, dataset, and algorithm.");
      return;
    }
    setLoadingTrain(true);
    setTrainMetrics(null);
    setSessionId(null);

    try {
      const payload = {
        task,
        dataset,
        algorithm,
        test_size: split,
        improve_with: selectedImprovementsMulti, // Pass selected improvements with the initial training request
      };

      const user = auth?.currentUser;
      let headers = {};
      if (user) {
        const token = await user.getIdToken(false);
        headers.Authorization = `Bearer ${token}`;
        headers["X-User-Uid"] = user.uid;
      }

      const res = await axios.post(`${API_BASE}/model/train`, payload, { headers });
      const data = res.data;

      setTrainMetrics(data.metrics || data);
      setSessionId(data.session_id || null);

      if (data.session_id) {
        // No alert needed, success is implied by metrics/session ID appearing
      } else {
        alert("Model trained (no session id returned).");
      }
    } catch (err) {
      console.error("Error training model", err);
      const message = err?.response?.data?.detail || err?.message || "Model training failed.";
      alert("Model training failed: " + JSON.stringify(message));
    } finally {
      setLoadingTrain(false);
    }
  };

  const handleSaveModel = async () => {
    if (!sessionId) {
      alert("No trained session to save. Please train a model first.");
      return;
    }
    if (!datasetFilename) {
      alert("Select a dataset before saving the model.");
      return;
    }
    let modelName = datasetFilename.replace(/\.[^/.]+$/, "") + ".pkl";

    setSavingModel(true);
    try {
      const user = auth?.currentUser;
      let headers = {};
      if (user) {
        const token = await user.getIdToken(false);
        headers.Authorization = `Bearer ${token}`;
        headers["X-User-Uid"] = user.uid;
      } else {
        headers["X-User-Uid"] = "dev_user";
      }
      const payload = { session_id: sessionId, model_name: modelName };
      await axios.post(`${API_BASE}/model/save`, payload, { headers });
      alert(`Model saved as ${modelName}!`);
    } catch (err) {
      console.error("Error saving model", err);
      alert("Model saving failed: " + JSON.stringify(err?.response?.data?.detail || err?.message));
    } finally {
      setSavingModel(false);
    }
  };

  const toggleMultiSelectOption = (option) => {
    setSelectedImprovementsMulti((prev) =>
      prev.includes(option) ? prev.filter((i) => i !== option) : [...prev, option]
    );
  };

  const showImprovementOptions = dataset && task && algorithm;

  return (
    <div className="min-h-screen bg-gray-100 p-8 font-sans text-gray-800">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-extrabold text-blue-800">
            Model Builder 🤖
          </h1>
          <p className="text-lg text-gray-600 mt-2">
            Build, train, and improve machine learning models with ease.
          </p>
        </header>

        <div className="space-y-8">
          {/* Step 1: Select Task */}
          <Card title="Select Task Type" step="1">
            <div className="flex flex-wrap gap-4">
              {taskTypes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTask(t.id)}
                  className={`px-6 py-3 rounded-full border-2 font-medium transition-all duration-200 ease-in-out ${
                    task === t.id
                      ? "bg-blue-600 text-white border-blue-600 shadow-md"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-blue-50"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </Card>

          {/* Step 2: Select Dataset & Algorithm */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card title="Select Dataset" step="2">
              <select
                className="block w-full appearance-none bg-white border border-gray-300 text-gray-700 py-3 px-4 rounded-lg leading-tight focus:outline-none focus:bg-white focus:border-blue-500 transition duration-150 ease-in-out cursor-pointer"
                value={dataset}
                onChange={(e) => setDataset(e.target.value)}
              >
                <option value="">-- Select Dataset --</option>
                {datasetList.map((ds) => (
                  <option key={ds.id} value={ds.filename}>
                    {ds.filename}
                  </option>
                ))}
              </select>
            </Card>

            {task && (
              <Card title="Select Algorithm" step="3">
                <select
                  className="block w-full appearance-none bg-white border border-gray-300 text-gray-700 py-3 px-4 rounded-lg leading-tight focus:outline-none focus:bg-white focus:border-blue-500 transition duration-150 ease-in-out cursor-pointer"
                  value={algorithm}
                  onChange={(e) => setAlgorithm(e.target.value)}
                >
                  <option value="">-- Select Algorithm --</option>
                  {algorithms[task].map((algo, idx) => (
                    <option key={idx} value={algo}>
                      {algo}
                    </option>
                  ))}
                </select>
              </Card>
            )}
          </div>

          {/* Step 4: Preprocessing & Improvements */}
          {showImprovementOptions && (
            <Card title="Preprocessing & Improvements (Optional)" step="4">
              <p className="text-sm text-gray-500 mb-4">
                Select one or more preprocessing steps to apply before training your model.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {improvementOptions.map((opt) => (
                  <label
                    key={opt}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-colors duration-150 ${
                      selectedImprovementsMulti.includes(opt)
                        ? "bg-blue-100 border-blue-500 border"
                        : "bg-gray-100 hover:bg-gray-200"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedImprovementsMulti.includes(opt)}
                      onChange={() => toggleMultiSelectOption(opt)}
                      className="form-checkbox h-4 w-4 text-blue-600 rounded"
                    />
                    <span className="text-sm font-medium">{opt}</span>
                  </label>
                ))}
              </div>
            </Card>
          )}

          {/* Step 5: Train-Test Split */}
          <Card title="Train-Test Split" step={showImprovementOptions ? "5" : "4"}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Test Size: {split * 100}%
            </label>
            <input
              type="range"
              min="0.05"
              max="0.95"
              step="0.05"
              value={split}
              onChange={(e) => setSplit(parseFloat(e.target.value))}
              className="w-full h-2 bg-blue-100 rounded-lg appearance-none cursor-pointer focus:outline-none focus:bg-blue-200 transition-colors duration-200"
            />
            <p className="text-gray-500 text-sm mt-2">
              Drag the slider to adjust the test set size.
            </p>
          </Card>

          {/* Train Button */}
          <div className="flex justify-center">
            <button
              onClick={handleTrainModel}
              className="px-8 py-3 bg-green-600 text-white font-semibold rounded-full shadow-lg hover:bg-green-700 transition-colors duration-200 ease-in-out disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={loadingTrain}
            >
              {loadingTrain ? (
                <>
                  {loadingSpinner}
                  <span>Training...</span>
                </>
              ) : (
                <span>🚀 Train Model</span>
              )}
            </button>
          </div>

          {/* Metrics Display & Save Button */}
          {trainMetrics && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card title="Training Metrics" step="6">
                <pre className="bg-gray-800 text-gray-50 text-sm p-4 rounded-lg overflow-x-auto whitespace-pre-wrap font-mono">
                  {JSON.stringify(trainMetrics, null, 2)}
                </pre>
              </Card>

              <Card title="Save Your Model" step="7">
                <p className="text-gray-600 mb-4">
                  Once you're happy with the results, save your final model. It will be named after your dataset.
                </p>
                <div className="flex justify-center">
                  <button
                    onClick={handleSaveModel}
                    className="px-6 py-2 bg-green-600 text-white font-semibold rounded-full hover:bg-green-700 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                    disabled={savingModel || !sessionId}
                  >
                    {savingModel ? (
                      <>
                        {loadingSpinner}
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>💾 Save Model</span>
                    )}
                  </button>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}