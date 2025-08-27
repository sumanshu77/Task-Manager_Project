import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTasks } from '../../contexts/useTasks';
import { Task } from '../../contexts/TaskContext';
import { 
  Calendar, 
  User, 
  AlertCircle, 
  Clock, 
  CheckSquare, 
  Edit3, 
  Trash2, 
  ExternalLink,
  GripVertical
} from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onEdit: () => void;
  isAdmin: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onEdit, isAdmin }) => {
  const { deleteTask, updateTask } = useTasks();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckSquare className="w-4 h-4 text-green-600" />;
      case 'in-progress':
        return <Clock className="w-4 h-4 text-blue-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-orange-600" />;
    }
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      deleteTask(task.id);
    }
  };

  const toggleComplete = () => {
    const newStatus = task.status === 'completed' ? 'todo' : 'completed';
    updateTask({ ...task, status: newStatus });
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-all ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      {/* Drag Handle */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <button
            {...attributes}
            {...listeners}
            className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="w-4 h-4" />
          </button>
          {getStatusIcon(task.status)}
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={toggleComplete}
            className="text-gray-400 hover:text-gray-600"
            title={task.status === 'completed' ? 'Mark as incomplete' : 'Mark as complete'}
          >
            <CheckSquare className={`w-4 h-4 ${task.status === 'completed' ? 'text-green-600' : ''}`} />
          </button>
          <button
            onClick={onEdit}
            className="text-gray-400 hover:text-blue-600"
            title="Edit task"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          {isAdmin && (
            <button
              onClick={handleDelete}
              className="text-gray-400 hover:text-red-600"
              title="Delete task"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Task Content */}
      <div className="space-y-3">
        <div>
          <h4 className="font-semibold text-gray-900 mb-1">{task.title}</h4>
          <p className="text-sm text-gray-600 line-clamp-2">{task.description}</p>
        </div>

        {/* Priority Badge */}
        <div className="flex items-center justify-between">
          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
            {task.priority} priority
          </span>
        </div>

        {/* Task Details */}
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4" />
            <span>{task.assigneeName}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4" />
            <span>Due {task.dueDate}</span>
          </div>
          {task.githubLink && (
            <div className="flex items-center space-x-2">
              <ExternalLink className="w-4 h-4" />
              <a
                href={task.githubLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                GitHub Link
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};