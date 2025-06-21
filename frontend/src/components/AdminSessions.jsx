import React, { useState, useEffect } from 'react';

const AdminSessions = () => {
  const [sessions, setSessions] = useState([]);
  const [token, setToken] = useState(localStorage.getItem('adminToken') || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://192.168.100.158:8000/api/admin/sessions", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) throw new Error("Failed to fetch sessions");

      const data = await res.json();
      setSessions(data);
      setError('');
    } catch (err) {
      setError('Could not fetch sessions. Check your token.');
    }
    setLoading(false);
  };

  const deleteSession = async (mac) => {
    if (!window.confirm(`Remove session for ${mac}?`)) return;
    try {
      const res = await fetch(`http://192.168.100.158:8000/api/admin/sessions/${mac}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) throw new Error("Failed to delete session");

      setSessions(sessions.filter(s => s.mac_address !== mac));
    } catch (err) {
      alert('Delete failed.');
    }
  };

  useEffect(() => {
    if (!token) return;

    fetchSessions();
    const interval = setInterval(fetchSessions, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, [token]);

  const handleLogin = () => {
    const input = prompt("Enter admin token:");
    if (input) {
      localStorage.setItem('adminToken', input);
      setToken(input);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setToken('');
    setSessions([]);
  };

  if (!token) {
    return (
      <div className="p-4 text-center">
        <button onClick={handleLogin} className="bg-blue-500 text-white px-4 py-2 rounded">
          Enter Admin Token
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Active Sessions</h1>
        <button onClick={handleLogout} className="text-sm text-red-500">Logout</button>
      </div>
      {error && <p className="text-red-600 mb-4">{error}</p>}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="w-full border text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-2 py-1">MAC</th>
              <th className="border px-2 py-1">Start</th>
              <th className="border px-2 py-1">End</th>
              <th className="border px-2 py-1">Device</th>
              <th className="border px-2 py-1">Router</th>
              <th className="border px-2 py-1">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s, i) => {
              const isExpired = !!s.end_time;
              return (
                <tr key={i} className={isExpired ? 'bg-gray-200 text-gray-500' : ''}>
                  <td className="border px-2 py-1">{s.mac_address}</td>
                  <td className="border px-2 py-1">{s.start_time ? new Date(s.start_time).toLocaleString() : '-'}</td>
                  <td className="border px-2 py-1">{s.end_time ? new Date(s.end_time).toLocaleString() : '-'}</td>
                  <td className="border px-2 py-1">{s.device_type || '-'}</td>
                  <td className="border px-2 py-1">{s.router_id || '-'}</td>
                  <td className="border px-2 py-1">
                    <button onClick={() => deleteSession(s.mac_address)} className="text-red-500">Kick</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminSessions;

