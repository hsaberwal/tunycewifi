import React, { useEffect, useState } from "react";
import axios from "axios";

const RejectLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [error, setError] = useState(null);
  const [macFilter, setMacFilter] = useState("");
  const [reasonFilter, setReasonFilter] = useState("");

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const token = localStorage.getItem("adminToken");
        const res = await axios.get("/api/admin/reject-logs", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setLogs(res.data);
        setFilteredLogs(res.data);
      } catch (err) {
        console.error(err);
        setError("Failed to load reject logs.");
      }
    };

    fetchLogs();
  }, []);

  useEffect(() => {
    const filtered = logs.filter((log) => {
      const macMatch = log.mac_address.toLowerCase().includes(macFilter.toLowerCase());
      const reasonMatch = log.reason.toLowerCase().includes(reasonFilter.toLowerCase());
      return macMatch && reasonMatch;
    });
    setFilteredLogs(filtered);
  }, [macFilter, reasonFilter, logs]);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Recent Reject Logs</h2>
      {error && <p className="text-red-500">{error}</p>}

      <div className="mb-4 flex gap-4">
        <input
          type="text"
          placeholder="Filter by MAC"
          value={macFilter}
          onChange={(e) => setMacFilter(e.target.value)}
          className="border px-3 py-1 rounded w-1/3"
        />
        <input
          type="text"
          placeholder="Filter by Reason"
          value={reasonFilter}
          onChange={(e) => setReasonFilter(e.target.value)}
          className="border px-3 py-1 rounded w-1/3"
        />
      </div>

      <div className="overflow-auto rounded shadow">
        <table className="min-w-full border border-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border-b text-left">MAC Address</th>
              <th className="p-2 border-b text-left">Reason</th>
              <th className="p-2 border-b text-left">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map((log, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="p-2 border-b">{log.mac_address}</td>
                <td className="p-2 border-b">{log.reason}</td>
                <td className="p-2 border-b">
                  {new Date(log.timestamp).toLocaleString()}
                </td>
              </tr>
            ))}
            {filteredLogs.length === 0 && (
              <tr>
                <td colSpan="3" className="p-4 text-center text-gray-500">
                  No logs match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RejectLogsPage;

