import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const ProjectContribution: React.FC = () => {
  const contributionData = [
    { week: 'Week 1', tasks: 12, commits: 25, hours: 40 },
    { week: 'Week 2', tasks: 15, commits: 32, hours: 42 },
    { week: 'Week 3', tasks: 18, commits: 28, hours: 38 },
    { week: 'Week 4', tasks: 22, commits: 35, hours: 45 },
    { week: 'Week 5', tasks: 19, commits: 30, hours: 41 },
    { week: 'Week 6', tasks: 25, commits: 40, hours: 44 },
  ];

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Project Contribution Graph</h3>
        <div className="flex space-x-4 text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2" />
            <span className="text-gray-600">Tasks Completed</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2" />
            <span className="text-gray-600">Git Commits</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-purple-500 rounded-full mr-2" />
            <span className="text-gray-600">Hours Worked</span>
          </div>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={contributionData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="week" />
          <YAxis />
          <Tooltip />
          <Line 
            type="monotone" 
            dataKey="tasks" 
            stroke="#3B82F6" 
            strokeWidth={3}
            dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
          />
          <Line 
            type="monotone" 
            dataKey="commits" 
            stroke="#10B981" 
            strokeWidth={3}
            dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
          />
          <Line 
            type="monotone" 
            dataKey="hours" 
            stroke="#8B5CF6" 
            strokeWidth={3}
            dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};