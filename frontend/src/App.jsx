import React from 'react';
import { BrowserRouter as Router, Routes, Route, useSearchParams } from 'react-router-dom';
import SessionStatus from './components/SessionStatus.jsx';
import AdminPage from './pages/AdminPage';
import RejectLogsPage from "./pages/RejectLogsPage";
import ConnectedPage from "./pages/ConnectedPage";
import AdminLoginPage from './pages/AdminLoginPage';
import AdPlaybackPage from "./pages/AdPlaybackPage";

const HomePage = () => {
  const [searchParams] = useSearchParams();
  const macAddress = searchParams.get('mac');

  return (
    <div className="p-4 text-center text-lg font-medium">
      {macAddress ? (
        <SessionStatus macAddress={macAddress} />
      ) : (
        <p className="text-red-600">No MAC address found in URL.</p>
      )}
    </div>
  );
};

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<AdPlaybackPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/admin/reject-logs" element={<RejectLogsPage />} />
      <Route path="/connected" element={<ConnectedPage />} />
      <Route path="/admin-login" element={<AdminLoginPage />} />
    </Routes>
  );
};

export default App;
