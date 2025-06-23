import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AdminSessions from '../components/AdminSessions';
import AdviewsAdminPage from './AdviewsAdminPage';

const AdminPage = () => {
  const [routers, setRouters] = useState([]);
  const [ads, setAds] = useState([]);
  const [ip, setIp] = useState("");
  const [secret, setSecret] = useState("");
  const [NumberPlate, setNumberPlate] = useState("");
  const [adFile, setAdFile] = useState(null);
  const [adWeight, setAdWeight] = useState(1);
  const token = localStorage.getItem("adminToken");
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate("/admin-login");
    } else {
      fetchRouters();
      fetchAds();
    }
  }, [token]);

  const fetchRouters = async () => {
    try {
      const res = await fetch("/api/admin/routers", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 403) {
        alert("Unauthorized. Redirecting to login.");
        navigate("/admin-login");
        return;
      }
      const data = await res.json();
      setRouters(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching routers:", err);
    }
  };

  const fetchAds = async () => {
    try {
      const res = await fetch("/api/admin/ads", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setAds(data);
    } catch (err) {
      console.error("Error fetching ads:", err);
    }
  };

  const addRouter = async () => {
    if (!ip.trim() || !secret.trim() || !NumberPlate.trim()) {
      alert("All fields are required.");
      return;
    }
    try {
      const res = await fetch("/api/admin/routers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ip_address: ip, secret, number_plate: NumberPlate }),
      });
      if (res.ok) {
        setIp("");
        setSecret("");
        setNumberPlate("");
        fetchRouters();
      } else {
        const err = await res.json();
        alert("Failed to add router: " + (err.detail || res.status));
      }
    } catch (err) {
      console.error("Add router error:", err);
    }
  };

  const deleteRouter = async (id) => {
    try {
      await fetch(`/api/admin/routers/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchRouters();
    } catch (err) {
      console.error("Delete router error:", err);
    }
  };

  const uploadAd = async () => {
    if (!adFile) return;
    const formData = new FormData();
    formData.append("file", adFile);
    formData.append("weight", adWeight);
    formData.append("uploaded_by", "admin");
    try {
      const res = await fetch("/api/upload_ad", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        setAdFile(null);
        setAdWeight(1);
        fetchAds();
      } else {
        const err = await res.json();
        alert("Upload failed: " + (err.detail || res.status));
      }
    } catch (err) {
      console.error("Upload error:", err);
    }
  };

  const deleteAd = async (filename) => {
    try {
      await fetch(`/api/admin/ads/${filename}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchAds();
    } catch (err) {
      console.error("Delete ad error:", err);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">TunyceWifi Admin Panel</h1>

      <div className="mb-4 space-x-4">
        <Link to="/admin/reject-logs" className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700">
          View Reject Logs
        </Link>
      </div>

      <div className="my-6">
        <h2 className="text-xl font-semibold mb-2">Active Sessions</h2>
        <AdminSessions />
      </div>

      <div className="my-6">
        <h2 className="text-xl font-semibold mb-2">Router Management</h2>

        <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <input className="border p-2 rounded" placeholder="Router IP" value={ip} onChange={(e) => setIp(e.target.value)} />
          <input className="border p-2 rounded" placeholder="Secret" value={secret} onChange={(e) => setSecret(e.target.value)} />
          <input className="border p-2 rounded" placeholder="Number Plate" value={NumberPlate} onChange={(e) => setNumberPlate(e.target.value)} />
        </div>
        <button onClick={addRouter} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
          Add Router
        </button>

        <ul className="mt-6 divide-y">
          {routers.map((r) => (
            <li key={r.id} className="py-2 flex justify-between items-center">
              <span>{r.ip_address} — <span className="italic text-sm text-gray-700">{r.number_plate}</span></span>
              <button onClick={() => deleteRouter(r.id)} className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600">
                Delete
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="my-6">
        <h2 className="text-xl font-semibold mb-2">Upload New Ad</h2>
        <input type="file" onChange={(e) => setAdFile(e.target.files[0])} className="mb-2" />
        <input type="number" value={adWeight} onChange={(e) => setAdWeight(e.target.value)} placeholder="Weight" className="border p-2 rounded mb-2 w-32" />
        <button onClick={uploadAd} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 ml-2">
          Upload Ad
        </button>
      </div>

      <div className="my-6">
        <h2 className="text-xl font-semibold mb-2">Uploaded Ads</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ads.map((ad) => (
            <div key={ad.filename} className="border rounded-lg p-4 shadow hover:shadow-lg transition">
              <video
                className="w-full h-48 object-cover rounded mb-2"
                controls
                preload="metadata"
                src={`/videos/${ad.filename}`}
              >
                Your browser does not support the video tag.
              </video>
              <div className="text-sm text-gray-800 font-semibold">{ad.filename}</div>
              <div className="text-sm text-gray-600">
                Weight: {ad.weight} <br />
                Uploaded by: {ad.uploaded_by}
              </div>
              <button onClick={() => deleteAd(ad.filename)} className="mt-2 bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="my-6">
        <h2 className="text-xl font-semibold mb-2">Ad Views</h2>
        <AdviewsAdminPage />
      </div>
    </div>
  );
};

export default AdminPage;
