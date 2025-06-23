import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";

export default function AdPlaybackPage() {
  const [searchParams] = useSearchParams();
  const macAddress = searchParams.get("mac");
  const [ad, setAd] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [status, setStatus] = useState("loading");
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [muted, setMuted] = useState(() => {
    const stored = localStorage.getItem("tunyce_muted");
    return stored === null ? true : stored === "true";
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [showUnmutePrompt, setShowUnmutePrompt] = useState(false);
  const videoRef = useRef();

  useEffect(() => {
    fetch("/api/random_ad")
      .then((res) => res.json())
      .then((data) => {
        setAd(data);
        setStatus("playing");
      })
      .catch((err) => {
        console.error("Error fetching ad:", err);
        setStatus("error");
      });
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (video && ad) {
      video.muted = muted;
      video.play().catch((err) => {
        console.warn("Autoplay failed (likely needs user gesture):", err);
        setOverlayVisible(true);
      });
    }
  }, [ad]);

  const handlePlay = () => {
    setIsPlaying(true);
    setOverlayVisible(false);
    if (videoRef.current?.muted) {
      setShowUnmutePrompt(true);
    }
  };

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (video?.duration) {
      const duration = Math.ceil(video.duration);
      setCountdown(duration);
    }
  };

  useEffect(() => {
    let timer;
    if (isPlaying && countdown > 0 && status === "playing") {
      timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, countdown, status]);

  const handleEnded = async () => {
    const routerIP = window.location.hostname;
    const userAgent = navigator.userAgent;

    try {
      await fetch("/api/ad_view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mac_address: macAddress,
          ad_filename: ad.filename,
          ad_id: ad.id ?? null,
          router_ip: routerIP,
          user_agent_data: userAgent,
        }),
      });
    } catch (err) {
      console.warn("Ad view log failed:", err);
    }

    setStatus("authorizing");

    try {
      const res = await fetch("/api/authorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mac_address: macAddress }),
      });
      const data = await res.json();
      if (data.status === "authorized") {
        window.location.href = `http://192.168.88.1/login?username=${macAddress}&password=wifi`;
      } else {
        setStatus("error");
      }
    } catch (err) {
      console.error("Authorization failed:", err);
      setStatus("error");
    }
  };

  const toggleSound = () => {
    const video = videoRef.current;
    if (video) {
      const newMuted = !video.muted;
      video.muted = newMuted;
      setMuted(newMuted);
      localStorage.setItem("tunyce_muted", newMuted.toString());
      if (!newMuted) {
        video.play().catch((err) => {
          console.warn("Unmute play failed:", err);
        });
      }
      setShowUnmutePrompt(newMuted);
    }
  };

  const handleOverlayClick = () => {
    const video = videoRef.current;
    if (video) {
      video.muted = false;
      setMuted(false);
      localStorage.setItem("tunyce_muted", "false");
      video.play().then(() => {
        setIsPlaying(true);
        setOverlayVisible(false);
        setShowUnmutePrompt(false);
      }).catch((err) => {
        console.warn("Play failed on overlay click:", err);
      });
    }
  };

  if (status === "loading") return <div>Loading ad...</div>;
  if (status === "error") return <div>❌ There was an error. Please try again.</div>;
  if (status === "done") return <div>✅ You're now connected! Enjoy your 15 minutes of WiFi.</div>;

  return (
    <div style={{ textAlign: "center", padding: "2rem", position: "relative" }}>
      <h2>Watch this short ad to connect</h2>
      {showUnmutePrompt && <p>🔇 Please unmute to hear sound</p>}

      <div style={{ position: "relative", display: "inline-block" }}>
        {ad && (
          <video
            ref={videoRef}
            width="320"
            height="240"
            autoPlay
            muted={muted}
            playsInline
            onPlay={handlePlay}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={handleEnded}
            style={{ borderRadius: "8px", background: "#000" }}
          >
            <source src={`/ads/${ad.filename}`} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        )}

        <button
          onClick={toggleSound}
          style={{
            position: "absolute",
            bottom: "10px",
            right: "10px",
            background: "rgba(0,0,0,0.6)",
            color: "#fff",
            border: "none",
            borderRadius: "50%",
            width: "40px",
            height: "40px",
            fontSize: "20px",
            cursor: "pointer"
          }}
          title={muted ? "Unmute" : "Mute"}
        >
          {muted ? "🔈" : "🔊"}
        </button>

        {overlayVisible && (
          <div
            onClick={handleOverlayClick}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.75)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
              cursor: "pointer",
              borderRadius: "8px"
            }}
          >
            👆 Tap to start with sound
          </div>
        )}
      </div>

      {countdown !== null && (
        <p style={{ marginTop: "1rem" }}>⏳ Time remaining: {countdown} seconds</p>
      )}
    </div>
  );
}

// This component handles the ad playback and user authorization process.
// It fetches a random ad, plays it, and manages the countdown until the user is authorized for WiFi access.
// The user can toggle sound on the video, and the component handles logging the ad view and authorizing the user after the ad ends.
// It also provides visual feedback on the current status of the ad playback and authorization process.

