import React, { useState, useRef } from "react";
import Papa from "papaparse";
import axios from "axios";
import { auth } from "../firebase";

const UploadBox = ({ onUploaded }) => {
  const [hover, setHover] = useState(false);
  const [file, setFile] = useState(null);
  const [previewRows, setPreviewRows] = useState([]);
  const [previewCols, setPreviewCols] = useState([]);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");  // <--- NEW: success message
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  const acceptedTypes = [".csv", ".xlsx", ".xls"];

  const onDrop = (e) => {
    e.preventDefault();
    setHover(false);
    const f = e.dataTransfer?.files?.[0];
    if (f) handleFileSelect(f);
  };

  const onFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f) handleFileSelect(f);
  };

  const handleFileSelect = (f) => {
    setError("");
    setSuccess(""); // Remove any old success when new file selected
    const ext = f.name.split(".").pop()?.toLowerCase();
    if (!["csv", "xlsx", "xls"].includes(ext)) {
      setError("Only .csv and .xlsx/.xls files are allowed.");
      return;
    }
    setFile(f);
    generatePreview(f);
  };

  const generatePreview = (f) => {
    setParsing(true);
    setPreviewRows([]);
    setPreviewCols([]);
    setError("");
    setSuccess("");
    if (f.name.toLowerCase().endsWith(".csv")) {
      Papa.parse(f, {
        header: true,
        preview: 10,
        skipEmptyLines: true,
        complete: (results) => {
          setPreviewCols(results.meta.fields || []);
          setPreviewRows(results.data || []);
          setParsing(false);
        },
        error: () => {
          setError("Error parsing CSV file.");
          setParsing(false);
        },
      });
    } else {
      setError("Preview for Excel files not implemented yet.");
      setParsing(false);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file first.");
      return;
    }
    setUploading(true);
    setError("");
    setSuccess(""); // Remove any old success
    try {
      const form = new FormData();
      form.append("file", file);
      const uid = auth?.currentUser?.uid;
      const headers = { "Content-Type": "multipart/form-data" };
      if (uid) headers["X-User-Uid"] = uid;
      const resp = await axios.post("http://localhost:8000/datasets/upload", form, { headers });
      setUploading(false);
      setFile(null);
      setPreviewRows([]);
      setPreviewCols([]);
      setSuccess("✅ Upload successful."); // Inline success message
      if (onUploaded) onUploaded(resp.data);
      if (inputRef.current) inputRef.current.value = ""; // reset file input
    } catch (err) {
      console.error("Upload failed:", err);
      setError("Upload failed.");
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <label className="block text-lg font-semibold mb-3">Upload Dataset</label>
      <div
        onClick={() => inputRef.current?.click()}
        onDragEnter={(e) => {
          e.preventDefault();
          setHover(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setHover(false);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setHover(true);
        }}
        onDrop={onDrop}
        className={`w-full border-2 rounded-md p-6 text-center cursor-pointer transition-colors ${
          hover ? "border-indigo-500 bg-indigo-50" : "border-dashed border-gray-300 bg-gray-50"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={acceptedTypes.join(",")}
          onChange={onFileChange}
          className="hidden"
        />
        <p className="text-gray-700 mb-2">Drag & drop or click to upload</p>
        <p className="text-sm text-gray-500">Accepted: .csv, .xlsx, .xls</p>
      </div>

      {/* Feedback messages */}
      {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
      {success && <div className="mt-3 text-sm text-green-600">{success}</div>}

      {file && (
        <div className="mt-4 flex items-center justify-between gap-4">
          <div>
            <div className="text-sm font-medium">{file.name}</div>
            <div className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setFile(null);
                setPreviewRows([]);
                setPreviewCols([]);
                setError("");
                setSuccess(""); // Clear any success
                if (inputRef.current) inputRef.current.value = "";
              }}
              className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
            >
              Remove
            </button>
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-60"
            >
              {uploading ? "Uploading..." : "Upload"}
            </button>
          </div>
        </div>
      )}

      {parsing && <div className="mt-4 text-sm text-gray-600">Preparing preview...</div>}

      {!parsing && previewRows.length > 0 && (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {previewCols.map((c) => (
                  <th key={c} className="px-3 py-2 text-left font-medium text-gray-600">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewRows.map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  {previewCols.map((c) => (
                    <td key={c} className="px-3 py-2 text-gray-700">
                      {row[c]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UploadBox;
