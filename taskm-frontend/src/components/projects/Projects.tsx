import { useMemo, useState } from 'react';
import { useProjects, Project as ProjectType, ProjectContextValue } from '../../contexts/ProjectContext';
import { ProjectModal } from './ProjectModal';
import { ProjectDetails } from './ProjectDetails';

export default function ProjectsUI(): JSX.Element {
  const projCtx = useProjects() as ProjectContextValue;
  const deleteProject = projCtx?.deleteProject;

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All'|'Active'|'Completed'|'Archived'>('All');
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectType | null>(null);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [openAddFor, setOpenAddFor] = useState<number | null>(null);
  const [addQuery, setAddQuery] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [openMembersFor, setOpenMembersFor] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const projects: ProjectType[] = projCtx?.projects || [];
    const q = query.trim().toLowerCase();
    return projects.filter(p => {
      const name = (p.name || '').toLowerCase();
      const matchesSearch = q === '' || name.includes(q);
      const matchesStatus = statusFilter === 'All' || (p.status || 'All') === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [projCtx?.projects, query, statusFilter]);

  const formatDate = (d?: string) => {
    if (!d) return '-';
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return d;
    return dt.toLocaleDateString();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-white rounded-full shadow px-2 py-1">
            <input
              aria-label="Search projects"
              placeholder="Search projects..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="outline-none px-2"
            />
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <button className={`px-3 py-2 rounded-2xl ${statusFilter === 'All' ? 'bg-blue-600 text-white' : 'bg-transparent text-slate-600'}`} onClick={() => setStatusFilter('All')}>All</button>
            <button className={`px-3 py-2 rounded-2xl ${statusFilter === 'Active' ? 'bg-blue-600 text-white' : 'bg-transparent text-slate-600'}`} onClick={() => setStatusFilter('Active')}>Active</button>
            <button className={`px-3 py-2 rounded-2xl ${statusFilter === 'Completed' ? 'bg-blue-600 text-white' : 'bg-transparent text-slate-600'}`} onClick={() => setStatusFilter('Completed')}>Completed</button>
            <button className={`px-3 py-2 rounded-2xl ${statusFilter === 'Archived' ? 'bg-blue-600 text-white' : 'bg-transparent text-slate-600'}`} onClick={() => setStatusFilter('Archived')}>Archived</button>
          </div>
        </div>

        <div>
          <button
            onClick={() => { setEditingProject(null); setShowProjectModal(true); }}
            className="rounded-2xl px-4 py-2 bg-blue-600 text-white"
          >
            + New Project
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((project) => (
          <div key={project.id} className="bg-white rounded-2xl shadow hover:shadow-lg transition-all cursor-pointer p-5">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-lg font-semibold">{project.name}</h2>
                <p className="text-sm text-gray-500">{project.description}</p>
              </div>
              <span className={`px-2 py-1 text-xs rounded-full font-medium ${project.status === 'Active' ? 'bg-green-100 text-green-700' : project.status === 'Completed' ? 'bg-gray-100 text-gray-700' : 'bg-yellow-100 text-yellow-700'}`}>
                {project.status}
              </span>
            </div>

            <p className="text-xs text-gray-500 mt-3">{formatDate(project.start_date)} – {formatDate(project.end_date)}</p>
            <p className="text-sm font-medium mt-2">{project.tasks_completed || 0}/{project.tasks_total || 0} Tasks Completed</p>

            <div className="flex items-center mt-3">
              <div className="flex -space-x-3 items-center">
                {(project.members || []).slice(0,4).map((u: { id:number; name:string; avatar?:string }, idx:number) => (
                  <div key={u.id} title={u.name} className={`w-10 h-10 rounded-full border-2 border-white shadow-sm overflow-hidden ${idx===0?'' : ''}`}>
                    <img src={u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=fff&color=444`} alt={u.name} className="w-full h-full object-cover" />
                  </div>
                ))}
                {(project.members || []).length > 4 && (
                  <div title={`${(project.members || []).length} members`} className="w-10 h-10 flex items-center justify-center bg-gray-200 text-xs rounded-full border-2 border-white">+{(project.members || []).length - 4}</div>
                )}
              </div>

              <div className="ml-3 relative">
                <button onClick={(e)=>{ e.stopPropagation(); setOpenMembersFor(openMembersFor===project.id?null:project.id); }} className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center shadow">+</button>

                {openMembersFor === project.id && (
                  <div onClick={(e)=>e.stopPropagation()} className="absolute right-0 mt-2 w-60 bg-white rounded-lg shadow-lg border">
                    <div className="p-3">
                      <div className="text-sm font-semibold mb-2">Members</div>
                      <div className="space-y-2 max-h-48 overflow-auto">
                        {(project.members || []).map((m:{id:number;name:string;avatar?:string}) => (
                          <div key={m.id} className="flex items-center gap-3 p-2 rounded hover:bg-slate-50">
                            <img src={m.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.name)}&background=fff&color=444`} alt={m.name} className="w-8 h-8 rounded-full" />
                            <div className="flex-1 text-sm">{m.name}</div>
                            <button onClick={async ()=>{ if(!confirm('Remove member?')) return; try{ await projCtx.removeMember(project.id, m.id); await projCtx.fetchMyProjects(); }catch(e){console.error(e);} }} className="text-red-500 text-sm">Remove</button>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3">
                        {!openAddFor && (
                          <div className="flex gap-2">
                            <button onClick={()=>{ setOpenAddFor(project.id); }} className="px-3 py-2 bg-emerald-600 text-white rounded">Add member</button>
                            <button onClick={()=>setOpenMembersFor(null)} className="px-3 py-2 border rounded">Close</button>
                          </div>
                        )}

                        {openAddFor === project.id && (
                          <div className="mt-3 flex gap-2">
                            <input value={addQuery} onChange={(e)=>setAddQuery(e.target.value)} placeholder="Name or ID" className="px-3 py-2 border rounded w-44" />
                            <button disabled={addLoading} onClick={async ()=>{
                              setAddLoading(true);
                              try{
                                const q = addQuery.trim();
                                if(!q) { alert('Enter name or id'); return; }
                                let userId: number | null = null;
                                if(/^\d+$/.test(q)) userId = parseInt(q,10);
                                else {
                                  const res = await fetch(`/api/users?search=${encodeURIComponent(q)}`, { credentials: 'include' });
                                  const users = await res.json();
                                  if(users.length) userId = users[0].id;
                                }
                                if(!userId) { alert('User not found'); return; }
                                await projCtx.addMember(project.id, userId, 'member');
                                await projCtx.fetchMyProjects();
                                setAddQuery('');
                                setOpenAddFor(null);
                              }catch(err){ console.error(err); alert('Failed to add user'); }
                              finally{ setAddLoading(false); }
                            }} className="px-3 py-2 bg-emerald-600 text-white rounded">Add</button>
                            <button onClick={()=>{ setOpenAddFor(null); setAddQuery(''); }} className="px-3 py-2 border rounded">Cancel</button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <button
                onClick={(e) => { e.stopPropagation(); setDetailId(project.id); }}
                className="px-3 py-1 border rounded text-sm"
              >
                View
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setEditingProject(project); setShowProjectModal(true); }}
                className="px-3 py-1 border rounded text-sm"
              >
                Edit
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDeleteConfirmation(project.id); }}
                className="px-3 py-1 bg-red-600 text-white rounded text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {detailId && (
        <ProjectDetails projectId={detailId} onClose={() => setDetailId(null)} />
      )}

      <ProjectModal open={showProjectModal} onClose={() => { setShowProjectModal(false); setEditingProject(null); }} project={editingProject} />
    </div>
  );

  function onDeleteConfirmation(id:number) {
    if (window.confirm('Delete project? This action cannot be undone.')) {
      deleteProject?.(id).catch(console.error);
    }
  }
}


