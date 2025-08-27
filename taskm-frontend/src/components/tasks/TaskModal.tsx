import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTasks } from '../../contexts/useTasks';
import { useAuth } from '../../contexts/useAuth';
import { Task } from '../../contexts/TaskContext';
import { X, Calendar, User, AlertCircle, Link } from 'lucide-react';
import { useProjects } from '../../contexts/ProjectContext';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task?: Task | null;
}

interface TaskForm {
  title: string;
  description: string;
  assigneeName: string;
  assigneeId?: string;
  projectId?: string;
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  githubLink?: string;
}

export const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, task }) => {
  const { createTask, updateTask, state: tasksState } = useTasks();
  const { state: authState } = useAuth();
  const { projects } = useProjects();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<TaskForm>();

  useEffect(() => {
    if (isOpen) {
      if (task) {
        reset({
          title: task.title,
          description: task.description,
          assigneeName: task.assigneeName,
          assigneeId: String(task.assigneeId || ''),
          projectId: String((task as any).projectId || ''),
          priority: task.priority,
          dueDate: task.dueDate,
          githubLink: task.githubLink || '',
        });
      } else {
        reset({
          title: '',
          description: '',
          assigneeName: '',
          assigneeId: '',
          projectId: '',
          priority: 'medium',
          dueDate: '',
          githubLink: '',
        });
      }
    }
  }, [isOpen, task, reset]);

  if (!isOpen) return null;

  const onSubmit = (data: TaskForm) => {
    if (task) {
      updateTask({
        ...task,
        ...data,
        // If admin provided assigneeId, set it; otherwise keep existing
        assigneeId: data.assigneeId ? data.assigneeId : task.assigneeId,
      });
    } else {
      createTask({
        ...data,
        status: 'todo',
        assigneeId: data.assigneeId ? data.assigneeId : '1', // Default to provided or fallback
      } as any); // projectId may be optional and Task type may not include it; backend accepts project_id
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {task ? 'Edit Task' : 'Create New Task'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Task Title *
            </label>
            <input
              {...register('title', { required: 'Title is required' })}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter task title"
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              {...register('description', { required: 'Description is required' })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter task description"
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
            )}
          </div>

          {/* Assignee and Priority Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-1" />
                Assignee *
              </label>
              {authState.user?.role === 'admin' ? (
                <select
                  {...register('assigneeId')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Unassigned</option>
                  {Array.from(new Map(tasksState.tasks.map(t => [String(t.assigneeId), t.assigneeName]))).map(([id, name]) => (
                    <option key={id} value={id}>{name || `User ${id}`}</option>
                  ))}
                </select>
              ) : (
                <input
                  {...register('assigneeName', { required: 'Assignee is required' })}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter assignee name"
                />
              )}
              {errors.assigneeName && (
                <p className="text-red-500 text-sm mt-1">{errors.assigneeName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <AlertCircle className="w-4 h-4 inline mr-1" />
                Priority *
              </label>
              <select
                {...register('priority', { required: 'Priority is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          {/* Project */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project (optional)
            </label>
            <select
              {...register('projectId')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">No Project</option>
              {(projects || []).map((p: any) => (
                <option key={p.id} value={String(p.id)}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Due Date *
            </label>
            <input
              {...register('dueDate', { required: 'Due date is required' })}
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.dueDate && (
              <p className="text-red-500 text-sm mt-1">{errors.dueDate.message}</p>
            )}
          </div>

          {/* GitHub Link */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Link className="w-4 h-4 inline mr-1" />
              GitHub Link (Optional)
            </label>
            <input
              {...register('githubLink')}
              type="url"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://github.com/..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              {task ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};