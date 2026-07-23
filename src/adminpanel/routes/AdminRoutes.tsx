import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from '../layout/AdminLayout';
import AdminAuthGuard from '../components/AdminAuthGuard';

// Pages
import Dashboard from '../pages/Dashboard';
import Workspaces from '../pages/Workspaces';
import WorkspaceDetails from '../pages/WorkspaceDetails';
import Users from '../pages/Users';
import UserDetails from '../pages/UserDetails';
import Analytics from '../pages/Analytics';
import Announcements from '../pages/Announcements';
import Notifications from '../pages/Notifications';
import PlatformSettings from '../pages/PlatformSettings';
import AuditLogs from '../pages/AuditLogs';

const AdminRoutes: React.FC = () => {
  return (
    <AdminAuthGuard>
      <Routes>
        <Route element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="workspaces" element={<Workspaces />} />
          <Route path="workspaces/:id" element={<WorkspaceDetails />} />
          <Route path="users" element={<Users />} />
          <Route path="users/:id" element={<UserDetails />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="announcements" element={<Announcements />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="settings" element={<PlatformSettings />} />
          <Route path="audit-logs" element={<AuditLogs />} />
          <Route path="*" element={<Navigate to="/adminpanel" replace />} />
        </Route>
      </Routes>
    </AdminAuthGuard>
  );
};

export default AdminRoutes;
