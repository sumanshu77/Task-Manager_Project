import React, { useState } from 'react';
import { useProjects } from '../../contexts/ProjectContext';

interface ProjectModalProps {
  open: boolean;
  onClose: () => void;
  project?: { id: number; name?: string; description?: string } | null;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({ open, onClose, project = null }) => {
  const { createProject, fetchMyProjects, updateProject } = useProjects();
  const [name, setName] = useState(project?.name || '');
  const [description, setDescription] = useState(project?.description || '');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    setName(project?.name || '');
    setDescription(project?.description || '');
  }, [project, open]);

  if (!open) return null;

  const onCreate = async () => {
    setLoading(true);
    try {
      if (project) {
        await updateProject(project.id, { name, description });
      } else {
        await createProject({ name, description });
      }
      setName(''); setDescription('');
      await fetchMyProjects();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Create New Project</h3>
          <button onClick={onClose} className="text-gray-500">Close</button>
        </div>
        <div className="space-y-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Project name" className="w-full p-3 border rounded-lg" />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description" className="w-full p-3 border rounded-lg" rows={4} />
          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-100">Cancel</button>
            <button onClick={onCreate} disabled={loading || !name} className="px-4 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-60">{loading ? 'Creating...' : 'Create'}</button>
          </div>
        </div>
      </div>
    </div>
  );
};


