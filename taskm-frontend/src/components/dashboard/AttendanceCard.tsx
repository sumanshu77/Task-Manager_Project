import React from 'react';
import { useAttendance } from '../../contexts/useAttendance';
import { Clock, Calendar, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

export const AttendanceCard: React.FC = () => {
  const { state } = useAttendance();

  const todayRecord = state.records.find(record => 
    record.date === format(new Date(), 'yyyy-MM-dd')
  );

  const thisMonthRecords = state.records.filter(record => {
    const recordDate = new Date(record.date);
    const now = new Date();
    return recordDate.getMonth() === now.getMonth() && recordDate.getFullYear() === now.getFullYear();
  });

  const presentDays = thisMonthRecords.filter(record => record.status === 'present').length;
  const totalWorkingDays = 22; // Assuming 22 working days in a month
  const attendancePercentage = Math.round((presentDays / totalWorkingDays) * 100);

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Today's Attendance</h3>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          state.currentStatus === 'checked-in' 
            ? 'bg-green-100 text-green-800'
            : state.currentStatus === 'on-break'
            ? 'bg-orange-100 text-orange-800'
            : 'bg-gray-100 text-gray-800'
        }`}>
          {state.currentStatus === 'checked-in' ? 'Active' : 
           state.currentStatus === 'on-break' ? 'On Break' : 'Checked Out'}
        </div>
      </div>

      <div className="space-y-4">
        {/* Current Status */}
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Clock className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Current Status</p>
            <p className="font-semibold capitalize">
              {state.currentStatus.replace('-', ' ')}
            </p>
          </div>
        </div>

        {/* Today's Hours */}
        {todayRecord && (
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Hours Today</p>
              <p className="font-semibold">{todayRecord.totalHours || 0}h</p>
            </div>
          </div>
        )}

        {/* Monthly Attendance */}
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-50 rounded-lg">
            <Calendar className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">This Month</p>
            <p className="font-semibold">{attendancePercentage}% Attendance</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="pt-2">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Monthly Progress</span>
            <span>{presentDays}/{totalWorkingDays} days</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${attendancePercentage}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};