import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/useAuth';

interface WFHRequest {
  id: number;
  userId?: number;
  startDate: string;
  endDate: string;
  hoursPerDay?: number | null;
  workLocation?: string | null;
  status: 'pending' | 'approved' | 'rejected';
  appliedAt: string;
}

export const WFHRequests: React.FC = () => {
  const auth = useAuth();
  const [requests, setRequests] = useState<WFHRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({ startDate: today, endDate: today, hoursPerDay: 8, workLocation: '' });
  const [errors, setErrors] = useState<{ startDate?: string; endDate?: string }>({});

  const fetchRequests = async () => {
    setLoading(true);
    try {
      if (auth.state.user?.role === 'admin') {
        const res = await axios.get('/api/wfh/all', { withCredentials: true, timeout: 5000 });
        setRequests(res.data);
      } else {
        const res = await axios.get('/api/wfh', { withCredentials: true, timeout: 5000 });
        setRequests(res.data);
      }
    } catch (err) {
      console.error('Error fetching WFH requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!auth.state.initialized) return;
    if (!auth.state.user) return;
    fetchRequests();
  }, [auth.state.initialized, auth.state.user]);

  const submit = async () => {
    // client-side validation
    const newErrors: { startDate?: string; endDate?: string } = {};
    if (!form.startDate) newErrors.startDate = 'Start date is required';
    if (!form.endDate) newErrors.endDate = 'End date is required';
    setErrors(newErrors);
    if (Object.keys(newErrors).length) return;

    try {
      // sanitize payload: convert empty strings to null and trim
      const payload = {
        startDate: (form.startDate || '').trim() || null,
        endDate: (form.endDate || '').trim() || null,
        hoursPerDay: form.hoursPerDay || null,
        workLocation: form.workLocation ? form.workLocation.trim() : null,
      };
      setLoading(true);
      const res = await axios.post('/api/wfh', payload, { withCredentials: true, timeout: 5000 });
      setRequests(prev => [res.data, ...prev]);
      setForm({ startDate: '', endDate: '', hoursPerDay: 8, workLocation: '' });
      setErrors({});
    } catch (err) {
      console.error('Error submitting WFH request:', err);
      // show generic error in console; could add UI toast
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: number, status: 'approved' | 'rejected') => {
    try {
      const res = await axios.patch(`/api/wfh/${id}/status`, { status }, { withCredentials: true, timeout: 5000 });
      setRequests(prev => prev.map(r => (r.id === id ? res.data : r)));
    } catch (err) {
      console.error('Error updating WFH status:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Work From Home Requests</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <input className="px-3 py-2 border rounded w-full" type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
            {errors.startDate && <div className="text-red-500 text-xs mt-1">{errors.startDate}</div>}
          </div>
          <div>
            <input className="px-3 py-2 border rounded w-full" type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
            {errors.endDate && <div className="text-red-500 text-xs mt-1">{errors.endDate}</div>}
          </div>
          <input className="px-3 py-2 border rounded" type="number" min={1} value={form.hoursPerDay} onChange={e => setForm(f => ({ ...f, hoursPerDay: Number(e.target.value) }))} placeholder="Hours/day" />
          <input className="px-3 py-2 border rounded" type="text" value={form.workLocation} onChange={e => setForm(f => ({ ...f, workLocation: e.target.value }))} placeholder="Work location" />
        </div>
        <div className="flex justify-end mt-3">
          <button onClick={submit} disabled={loading} className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}>
            {loading ? 'Submitting...' : 'Request WFH'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h4 className="text-md font-medium mb-4">My WFH Requests</h4>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <div className="space-y-3">
            {requests.length === 0 && <div className="text-gray-600">No WFH requests found</div>}
            {requests.map(r => (
              <div key={r.id} className="p-3 border rounded flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-700">{r.startDate} → {r.endDate}</div>
                  <div className="text-xs text-gray-500">Hours/day: {r.hoursPerDay ?? '-'} • Location: {r.workLocation ?? '-'}</div>
                  <div className="text-sm mt-1">Applied: {new Date(r.appliedAt).toLocaleString()}</div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`px-2 py-1 rounded-full text-xs ${r.status === 'approved' ? 'bg-green-100 text-green-800' : r.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>{r.status}</div>
                  {auth.state.user?.role === 'admin' && (
                    <div className="flex space-x-2">
                      <button onClick={() => updateStatus(r.id, 'approved')} className="px-2 py-1 bg-green-600 text-white rounded">Approve</button>
                      <button onClick={() => updateStatus(r.id, 'rejected')} className="px-2 py-1 bg-red-600 text-white rounded">Reject</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
