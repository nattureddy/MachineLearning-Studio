// src/pages/EDAStudio.jsx
import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { auth } from "../firebase";

const API_BASE = "http://localhost:8000";

const EDAStudio = () => {
  const [datasets, setDatasets] = useState([]);
  const [selected, setSelected] = useState("");
  const [preview, setPreview] = useState([]);
  const [summary, setSummary] = useState(null);
  const [missing, setMissing] = useState(null);
  const [correlation, setCorrelation] = useState(null);
  const [loading, setLoading] = useState(false);

  const [histColumn, setHistColumn] = useState("");
  const [histSrc, setHistSrc] = useState("");
  const [chartLoading, setChartLoading] = useState(false);
  const [chartError, setChartError] = useState("");

  // Keep track of object URL so we can revoke it later
  const objectUrlRef = useRef(null);

  useEffect(() => {
    fetchDatasets();
    return () => {
      // cleanup any created object URL on unmount
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  const fetchDatasets = async () => {
    try {
      const uid = auth?.currentUser?.uid;
      let url = `${API_BASE}/datasets`;
      if (uid) url += `?uid=${uid}`;
      const resp = await axios.get(url);
      setDatasets(resp.data.datasets || []);
    } catch (err) {
      console.error("Failed to fetch datasets:", err);
      setDatasets([]);
    }
  };

  const onSelect = async (fname) => {
    setSelected(fname);
    setPreview([]);
    setSummary(null);
    setMissing(null);
    setCorrelation(null);
    setHistColumn("");
    setHistSrc("");
    setChartError("");
    setLoading(true);

    try {
      const base = `${API_BASE}/eda`;
      const encodedName = encodeURIComponent(fname);

      const [p, s, m, c] = await Promise.all([
        axios.get(`${base}/${encodedName}/preview?rows=10`),
        axios.get(`${base}/${encodedName}/summary`),
        axios.get(`${base}/${encodedName}/missing`),
        axios.get(`${base}/${encodedName}/correlation`),
      ]);

      setPreview(p.data.preview || []);
      setSummary(s.data);
      setMissing(m.data);
      setCorrelation(c.data);
    } catch (err) {
      console.error("EDA fetch error:", err);
      alert("Failed to load EDA for selected dataset. See console.");
    } finally {
      setLoading(false);
    }
  };

  // Robust show histogram: try direct img src first; if fails due to auth/CORS, fetch via axios with token
  const showHistogram = async (col) => {
    if (!selected) return;
    setChartError("");
    setHistColumn(col);
    setHistSrc("");
    setChartLoading(true);

    // revoke previous object URL if any
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    const encodedName = encodeURIComponent(selected);
    const encodedCol = encodeURIComponent(col);
    const directUrl = `${API_BASE}/eda/${encodedName}/histogram/${encodedCol}`;

    // First try direct URL in img — quick and requires no headers
    try {
      const headResp = await fetch(directUrl, { method: "HEAD" });
      if (headResp.ok) {
        setHistSrc(directUrl);
        setChartLoading(false);
        return;
      }
      console.warn("Direct HEAD returned not-ok:", headResp.status);
    } catch (err) {
      console.warn("Direct HEAD failed (CORS or network). Will try token fetch.", err);
    }

    // Fallback: fetch binary via axios while sending Firebase ID token
    try {
      const user = auth?.currentUser;
      let token = null;
      if (user) {
        token = await user.getIdToken(/* forceRefresh */ false);
      }

      const resp = await axios.get(directUrl, {
        responseType: "blob",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const blob = resp.data;
      const objUrl = URL.createObjectURL(blob);
      objectUrlRef.current = objUrl;
      setHistSrc(objUrl);
    } catch (err) {
      console.error("Failed to fetch chart via axios:", err);
      const message =
        err?.response?.data?.detail ||
        err?.response?.data ||
        err?.message ||
        "Failed to load chart.";
      setChartError(String(message));
    } finally {
      setChartLoading(false);
    }
  };

  const Card = ({ title, children, icon }) => (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
      <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
        {icon && <span className="mr-2 text-blue-500">{icon}</span>}
        {title}
      </h2>
      {children}
    </div>
  );

  // const SectionTitle = ({ title, icon }) => (
  //   <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
  //     {icon && <span className="mr-2 text-blue-500">{icon}</span>}
  //     {title}
  //   </h2>
  // );
  
  const loadingSpinner = (
    <div className="flex justify-center items-center py-8">
      <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 p-8 font-sans text-gray-800">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-extrabold text-blue-800">
            EDA Studio <span className="text-blue-500">📊</span>
          </h1>
          <p className="text-lg text-gray-600 mt-2">
            Explore and analyze your datasets with powerful visualizations and statistics.
          </p>
        </header>

        <div className="mb-8 p-6 bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col md:flex-row items-center justify-between">
          <div className="w-full md:w-auto">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Dataset
            </label>
            <div className="relative">
              <select
                value={selected}
                onChange={(e) => onSelect(e.target.value)}
                className="block w-full md:w-96 appearance-none bg-white border border-gray-300 text-gray-700 py-3 px-4 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-white focus:border-blue-500 transition duration-150 ease-in-out cursor-pointer"
              >
                <option value="">-- Select a file --</option>
                {datasets.map((d) => (
                  <option key={d.filename} value={d.filename}>
                    {d.filename}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {loading && (
          <div className="flex justify-center items-center py-12 text-gray-500">
            {loadingSpinner}
            <p className="ml-3 text-lg font-medium">Loading EDA insights...</p>
          </div>
        )}

        {selected && !loading && (
          <div className="space-y-8">
            {/* Preview */}
            <Card title="Data Preview" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><line x1="10" y1="9" x2="8" y2="9"></line></svg>}>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      {(preview[0] ? Object.keys(preview[0]) : []).map((c) => (
                        <th key={c} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {preview.map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50 transition-colors duration-150 ease-in-out">
                        {(preview[0] ? Object.keys(preview[0]) : []).map((c) => (
                          <td key={c} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {String(row[c] ?? "")}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Summary */}
              <Card title="Column Summary" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"></path><path d="M18.7 8.3L12 15l-3.3-3.3"></path></svg>}>
                {summary ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Column</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dtype</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Count</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Missing</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Info</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {Object.entries(summary.summary).map(([col, info]) => (
                          <tr key={col} className="hover:bg-gray-50 transition-colors duration-150 ease-in-out">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{col}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{info.dtype}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{info.count}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{info.n_missing}</td>
                            <td className="px-6 py-4 text-sm text-gray-700">
                              {info.numeric ? (
                                <div>
                                  <span className="block">Mean: {info.numeric.mean ? Number(info.numeric.mean).toFixed(3) : "—"}</span>
                                  <span className="block">Std: {info.numeric.std ? Number(info.numeric.std).toFixed(3) : "—"}</span>
                                  <button
                                    className="mt-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-full text-xs hover:bg-blue-700 transition duration-150 ease-in-out shadow-sm"
                                    onClick={() => showHistogram(col)}
                                  >
                                    Show Histogram
                                  </button>
                                </div>
                              ) : (
                                <div>
                                  <span className="block">Unique: {info.unique ?? "—"}</span>
                                  {info.top && <span className="block">Top: {info.top} ({info.top_freq})</span>}
                                  <button
                                    className="mt-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-full text-xs hover:bg-blue-700 transition duration-150 ease-in-out shadow-sm"
                                    onClick={() => showHistogram(col)}
                                  >
                                    Show Bar Chart
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500">No summary available.</p>
                )}
              </Card>

              {/* Chart area */}
              <Card title="Chart Visualization" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"></path><path d="M18.7 8.3L12 15l-3.3-3.3"></path></svg>}>
                {chartLoading && (
                  <div className="flex justify-center items-center py-8">
                    {loadingSpinner}
                    <p className="ml-3 text-sm text-gray-500">Generating chart for <b>{histColumn}</b>...</p>
                  </div>
                )}
                {chartError && (
                  <div className="bg-red-50 p-4 rounded-lg text-red-700">
                    <p className="font-semibold">Error:</p>
                    <p>{chartError}</p>
                  </div>
                )}
                {histSrc ? (
                  <div className="flex justify-center items-center">
                    <img src={histSrc} alt={`chart-${histColumn}`} className="rounded-lg shadow-md max-w-full h-auto" />
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">Select a column from the summary table to view its chart.</p>
                )}
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Missing Values */}
              <Card title="Missing Values" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>}>
                {missing && missing.missing.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Column</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Missing Count</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Missing %</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {missing.missing.map((m) => (
                          <tr key={m.column} className="hover:bg-gray-50 transition-colors duration-150 ease-in-out">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{m.column}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{m.missing_count}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{m.missing_pct}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500">No missing values found.</p>
                )}
              </Card>

              {/* Correlation */}
              <Card title="Correlation Matrix" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><line x1="1" y1="12" x2="23" y2="12"></line></svg>}>
                {correlation && correlation.correlation && Object.keys(correlation.correlation).length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                          {Object.keys(correlation.correlation).map((c) => (
                            <th key={c} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{c}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {Object.entries(correlation.correlation).map(([rowCol, rowVals]) => (
                          <tr key={rowCol} className="hover:bg-gray-50 transition-colors duration-150 ease-in-out">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{rowCol}</td>
                            {Object.values(rowVals).map((v, i) => (
                              <td key={i} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{Number(v).toFixed(3)}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500">No numeric columns for correlation.</p>
                )}
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EDAStudio;