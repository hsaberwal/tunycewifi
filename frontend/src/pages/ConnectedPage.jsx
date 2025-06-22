import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

const ConnectedPage = () => {
  const [searchParams] = useSearchParams();
  const macAddress = searchParams.get("mac");
  const [status, setStatus] = useState(null);
  const [minutesRemaining, setMinutesRemaining] = useState(null);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch("http://192.168.100.158:8000/api/session_status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mac_address: macAddress })
        });

        const data = await res.json();
        if (data.status === "active") {
          setStatus("active");
          setMinutesRemaining(data.minutes_remaining);
        } else {
          setStatus("error");
        }
      } catch {
        setStatus("error");
      }
    };

    checkSession();
  }, [macAddress]);

  if (status === "active") {
    return <p className="p-4 text-green-700">✅ You are now connected! You have {minutesRemaining} minute(s) remaining.</p>;
  }

  if (status === "error") {
    return <p className="p-4 text-red-600">❌ Could not verify your session. Try reconnecting.</p>;
  }

  return <p className="p-4">Checking your connection status...</p>;
};

export default ConnectedPage;
