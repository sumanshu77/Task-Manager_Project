import React from 'react';
import { useAttendance } from '../../contexts/useAttendance';
import { Calendar, Clock, TrendingUp, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const AttendanceStats: React.FC = () => {
  const { state } = useAttendance();

  // Calculate stats
  const thisMonthRecords = state.records.filter(record => {
    const recordDate = new Date(record.date);
    const now = new Date();
    return recordDate.getMonth() === now.getMonth() && recordDate.getFullYear() === now.getFullYear();
  });

  const presentDays = thisMonthRecords.filter(record => record.status === 'present').length;
  const lateDays = thisMonthRecords.filter(record => record.status === 'late').length;
  const halfDays = thisMonthRecords.filter(record => record.status === 'half-day').length;
  const totalHours = thisMonthRecords.reduce((sum, record) => sum + (record.totalHours || 0), 0);
  const averageHours = totalHours / thisMonthRecords.length || 0;

  const stats = [
    {
      title: 'Days Present',
      value: presentDays,
      icon: Calendar,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Total Hours',
      value: `${Math.round(totalHours)}h`,
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Average Hours',
      value: `${averageHours.toFixed(1)}h`,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Late Days',
      value: lateDays,
      icon: Users,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  // Weekly attendance data
  const weeklyData = [
    { week: 'Week 1', present: 5, late: 0, absent: 0 },
    { week: 'Week 2', present: 4, late: 1, absent: 0 },
    { week: 'Week 3', present: 5, late: 0, absent: 0 },
    { week: 'Week 4', present: 3, late: 1, absent: 1 },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Weekly Attendance Chart */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Attendance Overview</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="present" fill="#10B981" name="Present" />
            <Bar dataKey="late" fill="#F59E0B" name="Late" />
            <Bar dataKey="absent" fill="#EF4444" name="Absent" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Attendance Records */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Attendance</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Check In</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Check Out</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Total Hours</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {state.records.slice(0, 7).map((record) => (
                <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">{record.date}</td>
                  <td className="py-3 px-4">{record.checkIn}</td>
                  <td className="py-3 px-4">{record.checkOut || '-'}</td>
                  <td className="py-3 px-4">{record.totalHours ? `${record.totalHours}h` : '-'}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      record.status === 'present' 
                        ? 'bg-green-100 text-green-800'
                        : record.status === 'late'
                        ? 'bg-orange-100 text-orange-800'
                        : record.status === 'half-day'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {record.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};