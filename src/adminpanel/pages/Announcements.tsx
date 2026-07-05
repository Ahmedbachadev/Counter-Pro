import React from 'react';

const Announcements: React.FC = () => {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Announcements</h2>
      <p className="text-gray-600 dark:text-gray-400">
        Broadcast messages to all workspaces or specific users.
      </p>
    </div>
  );
};

export default Announcements;
