import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useProjects, Project as ProjectType } from '../../contexts/ProjectContext';
import { X, Trash } from 'lucide-react';

export const ProjectDetails: React.FC<{ projectId: number; onClose: () => void }> = ({ projectId, onClose }) => {
  const { getProject, inviteMember, removeMember } = useProjects();
  const [loading, setLoading] = useState(true);
  type Member = { id:number; name:string; email?:string; avatar?:string; role?:string; status?:string };
  type TaskShort = { id:number; title:string; assigned_to?:string; assignee_name?:string; priority?:string; due_date?:string };
  const [data, setData] = useState<{ project?: ProjectType | null; tasks?: TaskShort[]; members?: Member[] } | null>(null);
  const [tab, setTab] = useState<'overview'|'users'|'tasks'|'activity'>('overview');
  const [inviteUserId, setInviteUserId] = useState('');
  const [inviteRole, setInviteRole] = useState<'member'|'admin'|'viewer'>('member');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getProject(projectId) as { project?: ProjectType | null; tasks?: TaskShort[]; members?: Member[] };
      setData({ project: res.project || null, tasks: res.tasks || [], members: res.members || [] });
      // optional: check users endpoint exists
      try {
        const ures = await axios.get('/api/users', { withCredentials: true });
        void ures;
      } catch (err) { void err; }
    } catch (e) {
      console.error('Failed to load project', e);
    } finally { setLoading(false); }
  }, [getProject, projectId]);

  useEffect(() => { load(); }, [load]);

  const onInvite = async () => {
    if (!inviteUserId) return;
    try {
      await inviteMember({ projectId, userId: parseInt(inviteUserId, 10), role: inviteRole });
      setInviteUserId('');
      setInviteRole('member');
      await load();
    } catch (e) { console.error(e); }
  };

  const onRemove = async (userId: number) => {
    if (!window.confirm('Remove member from project?')) return;
    try {
      await removeMember(projectId, userId);
      await load();
    } catch (e) { console.error(e); }
  };

  const addDirectMember = async () => {
    if (!inviteUserId) return;
    try {
      await axios.post(`/api/projects/${projectId}/members`, { userId: parseInt(inviteUserId,10), role: inviteRole }, { withCredentials: true });
      setInviteUserId('');
      await load();
    } catch (e) { console.error(e); }
  };

  if (!data && loading) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-lg overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h3 className="text-lg font-semibold">{data?.project?.name}</h3>
            <div className="text-sm text-slate-500">{data?.project?.description}</div>
          </div>
          <div>
            <button onClick={onClose} className="p-2 text-slate-600"><X /></button>
          </div>
        </div>

        <div className="p-4">
          <div className="flex gap-4 border-b pb-4">
            <button onClick={() => setTab('overview')} className={`px-3 py-2 ${tab==='overview' ? 'bg-slate-100 rounded' : ''}`}>Overview</button>
            <button onClick={() => setTab('users')} className={`px-3 py-2 ${tab==='users' ? 'bg-slate-100 rounded' : ''}`}>Users</button>
            <button onClick={() => setTab('tasks')} className={`px-3 py-2 ${tab==='tasks' ? 'bg-slate-100 rounded' : ''}`}>Tasks</button>
            <button onClick={() => setTab('activity')} className={`px-3 py-2 ${tab==='activity' ? 'bg-slate-100 rounded' : ''}`}>Activity</button>
          </div>

          <div className="mt-4">
            {tab === 'overview' && (
              <div>
                <p className="text-sm text-slate-700">{data?.project?.description}</p>
                <div className="mt-3 text-sm text-slate-500">Start: {data?.project?.start_date || '-'} • End: {data?.project?.end_date || '-'}</div>
              </div>
            )}

            {tab === 'users' && (
              <div>
                <div className="space-y-3">
                  {(data?.members || []).map((m: { id:number; name:string; email?:string; avatar?:string }) => (
                    <div key={m.id} className="flex items-center justify-between bg-slate-50 p-2 rounded">
                      <div className="flex items-center gap-3"><img src={m.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.name)}`} className="w-8 h-8 rounded-full"/> <div>{m.name}<div className="text-xs text-slate-500">{m.email}</div></div></div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => onRemove(m.id)} className="p-2 text-red-600" title="Remove"><Trash className="w-4 h-4"/></button>
                      </div>
                    </div>
                  ))}

                  <div className="mt-3 flex gap-2">
                    <input value={inviteUserId} onChange={(e: React.ChangeEvent<HTMLInputElement>)=>setInviteUserId(e.target.value)} placeholder="User ID to invite or add" className="px-3 py-2 border rounded w-48" />
                    <select value={inviteRole} onChange={(e: React.ChangeEvent<HTMLSelectElement>)=>setInviteRole(e.target.value as 'member'|'admin'|'viewer')} className="px-3 py-2 border rounded">
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                      <option value="viewer">Viewer</option>
                    </select>
                    <button onClick={onInvite} className="px-3 py-2 bg-blue-600 text-white rounded">Invite (Pending)</button>
                    <button onClick={addDirectMember} className="px-3 py-2 bg-emerald-600 text-white rounded">Add (Direct)</button>
                  </div>
                </div>
              </div>
            )}

            {tab === 'tasks' && (
              <div>
                <table className="w-full text-sm">
                  <thead className="text-left text-xs text-slate-500"><tr><th>Title</th><th>Assigned</th><th>Priority</th><th>Due</th></tr></thead>
                  <tbody>
                    {(data?.tasks || []).map((t: TaskShort) => (
                      <tr key={t.id} className="border-t"><td className="py-2">{t.title}</td><td>{t.assigned_to || t.assignee_name}</td><td>{t.priority}</td><td>{t.due_date}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {tab === 'activity' && (
              <div className="text-sm text-slate-500">No recent activity.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


