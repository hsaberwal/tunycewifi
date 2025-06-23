import { useEffect, useState } from "react";

export default function AdViewsAdminPage() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch("/api/admin/ad_views", {
      headers: {
        Authorization: `Bearer secretadmin`, // use your actual token or state
      },
    })
      .then((res) => res.json())
      .then(setData)
      .catch((err) => console.error("Failed to fetch ad views", err));
  }, []);

  return (
    <div style={{ padding: "1rem" }}>
      <h2>Ad Views</h2>
      <table border="1" cellPadding="6">
        <thead>
          <tr>
            <th>ID</th>
            <th>MAC</th>
            <th>Filename</th>
            <th>Ad ID</th>
            <th>Router IP</th>
            <th>User Agent</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.id}>
              <td>{row.id}</td>
              <td>{row.mac_address}</td>
              <td>{row.ad_filename}</td>
              <td>{row.ad_id}</td>
              <td>{row.router_ip}</td>
              <td style={{ maxWidth: "300px", wordBreak: "break-word" }}>{row.user_agent_data}</td>
              <td>{row.timestamp}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
