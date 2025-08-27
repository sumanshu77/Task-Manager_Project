import React, { useEffect, useState } from 'react';
import axios from 'axios';

export const AdminLeaves: React.FC = () => {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/attendance/leaves/all', { withCredentials: true, timeout: 5000 });
      setLeaves(res.data);
    } catch (err) {
      console.error('Error fetching all leaves:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const updateStatus = async (id: number, status: 'approved' | 'rejected') => {
    try {
      const res = await axios.patch(`/api/attendance/leaves/${id}/status`, { status }, { withCredentials: true, timeout: 5000 });
      setLeaves(prev => prev.map(l => (l.id === id ? { ...l, status: res.data.status } : l)));
    } catch (err) {
      console.error('Error updating leave status:', err);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-3">
      {leaves.length === 0 && <div className="text-gray-600">No leave requests</div>}
      {leaves.map(l => (
        <div key={l.id} className="p-3 border rounded flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">{l.startDate} → {l.endDate} • {l.type}</div>
            <div className="text-xs text-gray-500">Applied: {new Date(l.appliedAt).toLocaleString()}</div>
            <div className="text-sm mt-1">{l.reason}</div>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`px-2 py-1 rounded-full text-xs ${l.status === 'approved' ? 'bg-green-100 text-green-800' : l.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>{l.status}</div>
            <div className="flex space-x-2">
              <button onClick={() => updateStatus(l.id, 'approved')} className="px-2 py-1 bg-green-600 text-white rounded">Approve</button>
              <button onClick={() => updateStatus(l.id, 'rejected')} className="px-2 py-1 bg-red-600 text-white rounded">Reject</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
