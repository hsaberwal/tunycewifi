import React, { useEffect, useState } from 'react';

const SessionStatus = ({ macAddress }) => {
  const [status, setStatus] = useState(null);
  const [minutesRemaining, setMinutesRemaining] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [authorizing, setAuthorizing] = useState(false);

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
      } catch (error) {
        setStatus("error");
      }
    };

    checkStatus();
  }, [macAddress]);

  // Start 30s countdown
  const startAdCountdown = () => {
    setCountdown(30);
    setAuthorizing(true);
  };

  // Countdown effect
  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      // Countdown complete, authorize session
      authorizeSession();
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown]);

  const authorizeSession = async () => {
    try {
      const res = await fetch("http://192.168.100.158:8000/api/authorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mac_address: macAddress })
      });

      const data = await res.json();
      if (data.status === "authorized") {
        setStatus("active");
        setMinutesRemaining(15); // Reset session timer UI
      } else {
        setStatus("error");
      }
    } catch (e) {
      setStatus("error");
    }
    setAuthorizing(false);
    setCountdown(null);
  };

  // Render logic
  if (status === "active") {
    return <p>You have {minutesRemaining} minute(s) remaining on your session.</p>;
  }

  if (authorizing && countdown !== null) {
    return <p>Authorizing... Please wait {countdown} seconds while the ad finishes.</p>;
  }

  if (status === "expired" || status === "not_found") {
    return (
      <>
        <p>
          {status === "expired"
            ? "Your session has expired. Please re-authorize to continue."
            : "Welcome! Please authorize to begin your session."}
        </p>
        <button onClick={startAdCountdown}>Watch Ad to Connect</button>
      </>
    );
  }

  if (status === "error") {
    return <p>Could not check session status. Please try again later.</p>;
  }

  return <p>Checking your session status...</p>;
};

export default SessionStatus;

