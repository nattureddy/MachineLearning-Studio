import React, { useState, useEffect } from "react";
import axios from "axios";
import { auth } from "../firebase";

const API_BASE = "https://machinelearning-studio-1.onrender.com"; // adjust if needed

const PredictionStudio = () => {
  const [modelList, setModelList] = useState([]);
  const [selectedModelId, setSelectedModelId] = useState("");
  const [featureNames, setFeatureNames] = useState([]);
  const [inputValues, setInputValues] = useState({});
  const [predictionResult, setPredictionResult] = useState(null);
  const [loadingModels, setLoadingModels] = useState(false);
  const [loadingFeatures, setLoadingFeatures] = useState(false);
  const [loadingPredict, setLoadingPredict] = useState(false);

  // Get auth headers with UID and token
  const getAuthHeaders = async () => {
    const currentUser = auth.currentUser;
    const uid = currentUser?.uid || "dev_user";
    const token = currentUser ? await currentUser.getIdToken(false) : "";
    return {
      Authorization: `Bearer ${token}`,
      "X-User-Uid": uid,
    };
  };

  // Loading spinner component
  const loadingSpinner = (
    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );

  // Load saved models for user on mount
  useEffect(() => {
    const fetchModels = async () => {
      setLoadingModels(true);
      try {
        const headers = await getAuthHeaders();
        const response = await axios.get(`${API_BASE}/model/saved`, { headers });
        setModelList(response.data.models || []);
      } catch (e) {
        console.error("Error loading models:", e);
        alert("Error loading saved models.");
      } finally {
        setLoadingModels(false);
      }
    };
    fetchModels();
  }, []);

  // Fetch features when model changes
  useEffect(() => {
    if (!selectedModelId) {
      setFeatureNames([]);
      setInputValues({});
      setPredictionResult(null);
      return;
    }
    const fetchFeatures = async () => {
      setLoadingFeatures(true);
      try {
        const headers = await getAuthHeaders();
        const res = await axios.get(`${API_BASE}/model/features/${selectedModelId}`, { headers });
        const features = res.data.features || [];
        setFeatureNames(features);
        setInputValues(features.reduce((acc, f) => ({ ...acc, [f]: "" }), {}));
        setPredictionResult(null);
      } catch (e) {
        console.error("Failed loading features:", e);
        alert("Failed to load model features. Ensure model is properly saved.");
        setFeatureNames([]);
        setInputValues({});
      } finally {
        setLoadingFeatures(false);
      }
    };
    fetchFeatures();
  }, [selectedModelId]);

  const handleInputChange = (feature, value) => {
    setInputValues((prev) => ({ ...prev, [feature]: value }));
  };

  const submitManualPrediction = async () => {
    if (!selectedModelId) {
      alert("Select a model first.");
      return;
    }
    // Basic validation: all inputs filled
    for (const f of featureNames) {
      if (!inputValues[f]) {
        alert(`Please provide a value for feature: ${f}`);
        return;
      }
    }
    setLoadingPredict(true);
    try {
      const headers = await getAuthHeaders();
      const res = await axios.post(
        `${API_BASE}/model/predict/manual`,
        { model_id: Number(selectedModelId), inputs: inputValues },
        { headers }
      );
      setPredictionResult(res.data.prediction);
    } catch (e) {
      console.error("Prediction error:", e);
      alert("Manual prediction failed. Check inputs and try again.");
    } finally {
      setLoadingPredict(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 font-sans text-gray-800">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-extrabold text-blue-800">
            Prediction Studio 🔮
          </h1>
          <p className="text-lg text-gray-600 mt-2">
            Make predictions using your saved machine learning models.
          </p>
        </header>

        <div className="space-y-8">
          {/* Model Selection Card */}
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <span className="text-blue-500 mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
              </span>
              Select Model
            </h2>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Choose a saved model from the list:
            </label>
            {loadingModels ? (
              <p className="text-gray-500 flex items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Loading models...
              </p>
            ) : (
              <select
                value={selectedModelId}
                onChange={(e) => {
                  setSelectedModelId(e.target.value);
                  setPredictionResult(null);
                }}
                className="block w-full appearance-none bg-white border border-gray-300 text-gray-700 py-3 px-4 rounded-lg leading-tight focus:outline-none focus:bg-white focus:border-blue-500 transition duration-150 ease-in-out cursor-pointer"
              >
                <option value="">-- Select a model --</option>
                {modelList.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Feature Input Card */}
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Enter Feature Values
            </h2>
            {loadingFeatures && (
              <p className="text-gray-500 flex items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Loading features...
              </p>
            )}
            {!loadingFeatures && featureNames.length > 0 ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  submitManualPrediction();
                }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {featureNames.map((feature) => (
                    <div key={feature}>
                      <label className="block text-sm font-medium text-gray-700">
                        {feature}:
                      </label>
                      <input
                        type="text"
                        value={inputValues[feature] || ""}
                        onChange={(e) => handleInputChange(feature, e.target.value)}
                        required
                        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition duration-150 ease-in-out"
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex justify-end">
                  <button
                    type="submit"
                    disabled={loadingPredict}
                    className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-full shadow-lg hover:bg-blue-700 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {loadingPredict ? (
                      <>
                        {loadingSpinner}
                        <span>Predicting...</span>
                      </>
                    ) : (
                      <span>Predict</span>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              !loadingFeatures && (
                <p className="text-gray-500 text-center py-4">
                  Select a model to load features for manual input.
                </p>
              )
            )}
          </div>

          {/* Prediction Result Card */}
          {predictionResult && (
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Prediction Result ✨</h3>
              <pre className="bg-gray-800 text-gray-50 text-sm p-4 rounded-lg overflow-x-auto whitespace-pre-wrap font-mono">
                {JSON.stringify(predictionResult, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PredictionStudio;