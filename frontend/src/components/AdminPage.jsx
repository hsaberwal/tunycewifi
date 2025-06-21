import React from 'react';
import AdminSessions from './AdminSessions';

const AdminPage = () => {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">TunyceWifi Admin Panel</h1>
      <AdminSessions />
    </div>
  );
};

export default AdminPage;

