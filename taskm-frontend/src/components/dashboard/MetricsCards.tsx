import React from 'react';
import { useTasks } from '../../contexts/useTasks';
import { CheckSquare, Clock, AlertCircle, TrendingUp } from 'lucide-react';

export const MetricsCards: React.FC = () => {
  const { state } = useTasks();

  const completedTasks = state.tasks.filter(task => task.status === 'completed').length;
  const inProgressTasks = state.tasks.filter(task => task.status === 'in-progress').length;
  const pendingTasks = state.tasks.filter(task => task.status === 'todo').length;
  const totalTasks = state.tasks.length;

  const metrics = [
    {
      title: 'Completed Tasks',
      value: completedTasks,
      icon: CheckSquare,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      change: '+12%',
      changeColor: 'text-green-600'
    },
    {
      title: 'In Progress',
      value: inProgressTasks,
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      change: '+5%',
      changeColor: 'text-blue-600'
    },
    {
      title: 'Pending Tasks',
      value: pendingTasks,
      icon: AlertCircle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      change: '-8%',
      changeColor: 'text-green-600'
    },
    {
      title: 'Total Tasks',
      value: totalTasks,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      change: '+15%',
      changeColor: 'text-green-600'
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric, index) => (
        <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">{metric.title}</p>
              <p className="text-3xl font-bold text-gray-900">{metric.value}</p>
            </div>
            <div className={`p-3 rounded-lg ${metric.bgColor}`}>
              <metric.icon className={`w-6 h-6 ${metric.color}`} />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className={`text-sm font-medium ${metric.changeColor}`}>
              {metric.change}
            </span>
            <span className="text-sm text-gray-500 ml-2">vs last month</span>
          </div>
        </div>
      ))}
    </div>
  );
};