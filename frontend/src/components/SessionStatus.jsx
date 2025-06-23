import React, { useEffect, useState } from 'react';

const SessionStatus = ({ macAddress }) => {
  const [status, setStatus] = useState(null);
  const [minutesRemaining, setMinutesRemaining] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [authorizing, setAuthorizing] = useState(false);

  // Collect device/browser info
  const collectDeviceInfo = () => ({
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    language: navigator.language
  });

  // Initial session check
  useEffect(() => {
    const checkStatus = async () => {
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
        } else if (data.status === "expired") {
          setStatus("expired");
        } else if (data.status === "not_found") {
          setStatus("not_found");
        } else {
          setStatus("error");
        }
      } catch {
        setStatus("error");
      }
    };

    checkStatus();
  }, [macAddress]);

  // Start ad countdown
  const startAdCountdown = () => {
    setCountdown(30);
    setAuthorizing(true);
  };

  // Countdown timer
  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      authorizeSession();
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown]);

  // Authorize + log ad view + redirect to MikroTik login
  const authorizeSession = async () => {
    const deviceInfo = collectDeviceInfo();
    const adStart = new Date(Date.now() - 30 * 1000);
    const adEnd = new Date();

    try {
      // Log ad view
      const logRes = await fetch("http://192.168.100.158:8000/api/log_ad_view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mac_address: macAddress,
          ad_filename: "example_ad.mp4", // Replace later with real ad filename
          router_ip: window.location.hostname,
          user_agent_data: JSON.stringify(deviceInfo),
          ad_watch_timestamp: adStart.toISOString(),
          ad_completion_timestamp: adEnd.toISOString()
        })
      });

      const logData = await logRes.json();
      if (!logRes.ok || logData.status !== "ad_view_logged") {
        setStatus("error");
        setAuthorizing(false);
        setCountdown(null);
        return;
      }

      // Authorize session
      const authRes = await fetch("http://192.168.100.158:8000/api/authorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mac_address: macAddress })
      });

      const authData = await authRes.json();
      if (authData.status === "authorized") {
        setStatus("active");
        setMinutesRemaining(15);

        // Redirect back to MikroTik login page to complete access
        window.location.href = `http://192.168.88.1/login?username=${macAddress}&password=wifi`;
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }

    setAuthorizing(false);
    setCountdown(null);
  };

  // UI Rendering
  if (status === "active") {
    return <p>You have {minutesRemaining} minute(s) remaining on your session.</p>;
  }

  if (authorizing && countdown !== null) {
    return <p>Authorizing... Please wait {countdown} second(s) while the ad finishes.</p>;
  }

  if (status === "expired" || status === "not_found") {
    return (
      <>
        <p>
          {status === "expired"
            ? "Your session has expired. Please re-authorize to continue."
            : "Welcome! Please authorize to begin your session."}
        </p>
        <button
          className="px-4 py-2 mt-2 bg-blue-600 text-white rounded"
          onClick={startAdCountdown}
        >
          Watch Ad to Connect
        </button>
      </>
    );
  }

  if (status === "error") {
    return <p className="text-red-600">Something went wrong. Please try again later.</p>;
  }

  return <p>Checking your session status...</p>;
};

export default SessionStatus;

