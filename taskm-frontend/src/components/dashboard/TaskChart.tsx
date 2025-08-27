import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useTasks } from '../../contexts/useTasks';

export const TaskChart: React.FC = () => {
  const { state } = useTasks();

  // Weekly task completion data
  const weeklyData = [
    { name: 'Mon', completed: 5, inProgress: 2, todo: 1 },
    { name: 'Tue', completed: 3, inProgress: 4, todo: 2 },
    { name: 'Wed', completed: 7, inProgress: 1, todo: 3 },
    { name: 'Thu', completed: 4, inProgress: 3, todo: 1 },
    { name: 'Fri', completed: 6, inProgress: 2, todo: 2 },
    { name: 'Sat', completed: 2, inProgress: 1, todo: 0 },
    { name: 'Sun', completed: 1, inProgress: 0, todo: 1 },
  ];

  // Task status distribution
  const statusData = [
    { name: 'Completed', value: state.tasks.filter(t => t.status === 'completed').length, color: '#10B981' },
    { name: 'In Progress', value: state.tasks.filter(t => t.status === 'in-progress').length, color: '#3B82F6' },
    { name: 'Todo', value: state.tasks.filter(t => t.status === 'todo').length, color: '#F59E0B' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Weekly Progress Chart */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Task Progress</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="completed" fill="#10B981" name="Completed" />
            <Bar dataKey="inProgress" fill="#3B82F6" name="In Progress" />
            <Bar dataKey="todo" fill="#F59E0B" name="Todo" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Task Distribution Chart */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Task Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={statusData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={5}
              dataKey="value"
            >
              {statusData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex justify-center mt-4 space-x-4">
          {statusData.map((item, index) => (
            <div key={index} className="flex items-center">
              <div 
                className="w-3 h-3 rounded-full mr-2" 
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm text-gray-600">{item.name}: {item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};