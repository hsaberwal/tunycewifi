import React, { useState } from 'react';

const UploadAdForm = () => {
  const [file, setFile] = useState(null);
  const [weight, setWeight] = useState(1);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setMessage("Please select a video file.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("weight", weight);

    try {
      const res = await fetch("http://192.168.100.158:8000/api/upload_ad", {
        method: "POST",
        body: formData
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(`Ad uploaded: ${data.filename}`);
        setFile(null);
        setWeight(1);
      } else {
        setMessage(`Upload failed: ${data.detail}`);
      }
    } catch (err) {
      setMessage("Upload failed: Network error");
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Upload New Ad</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium">Select Video File</label>
          <input
            type="file"
            accept="video/*"
            onChange={(e) => setFile(e.target.files[0])}
            className="mt-1"
          />
        </div>
        <div>
          <label className="block font-medium">Weight (default: 1)</label>
          <input
            type="number"
            value={weight}
            min="1"
            onChange={(e) => setWeight(e.target.value)}
            className="mt-1 border px-2 py-1"
          />
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Upload Ad
        </button>
      </form>
      {message && <p className="mt-4 text-sm">{message}</p>}
    </div>
  );
};

export default UploadAdForm;

