import React from 'react';
import { Link } from 'react-router-dom';
import { useTasks } from '../../contexts/useTasks';
import { CheckSquare, Clock, AlertCircle, ArrowRight } from 'lucide-react';

export const RecentTasks: React.FC = () => {
  const { state } = useTasks();
  
  const recentTasks = state.tasks
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-orange-100 text-orange-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Recent Tasks</h3>
        <Link 
          to="/tasks"
          className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center"
        >
          View All
          <ArrowRight className="w-4 h-4 ml-1" />
        </Link>
      </div>

      <div className="space-y-4">
        {recentTasks.map((task) => (
          <div key={task.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="flex-shrink-0 mt-1">
              {getStatusIcon(task.status)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {task.title}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">
                    Assigned to {task.assigneeName}
                  </p>
                  <div className="flex items-center space-x-2 mt-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                      {task.status.replace('-', ' ')}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  </div>
                </div>
                <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                  Due {task.dueDate}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};