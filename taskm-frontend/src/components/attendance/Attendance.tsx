import React, { useState, useEffect } from 'react';
import { useAttendance } from '../../contexts/useAttendance';
import { AttendanceCalendar } from './AttendanceCalendar';
import { LeaveRequests } from './LeaveRequests';
import { WFHRequests } from './WFHRequests';
import { AttendanceStats } from './AttendanceStats';
import { Calendar, Clock, FileText } from 'lucide-react';

export const Attendance: React.FC = () => {
  const { checkIn, checkOut, startBreak, endBreak } = useAttendance()!;
  const [activeTab, setActiveTab] = useState<'overview' | 'calendar' | 'leaves' | 'wfh'>('overview');
  const [breakModalOpen, setBreakModalOpen] = useState(false);
  const [breakDuration, setBreakDuration] = useState<number | null>(null);
  const [remainingMs, setRemainingMs] = useState<number>(0);
  const [onBreak, setOnBreak] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    if (onBreak && breakDuration) {
      setRemainingMs(breakDuration * 60 * 1000);
      timer = setInterval(() => {
        setRemainingMs(prev => {
          if (prev <= 1000) {
            clearInterval(timer);
            setOnBreak(false);
            // auto end break
            endBreak();
            return 0;
          }
          return prev - 1000;
        });
      }, 1000);
    }
    return () => { if (timer) clearInterval(timer); };
  }, [onBreak, breakDuration, endBreak]);

  const openBreakModal = () => setBreakModalOpen(true);
  const chooseBreak = (minutes: number) => {
    setBreakDuration(minutes);
    setBreakModalOpen(false);
    // call API to start break
    startBreak();
    setOnBreak(true);
  };

  const returnFromBreak = () => {
    endBreak();
    setOnBreak(false);
    setRemainingMs(0);
    setBreakDuration(null);
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: Clock },
    { id: 'calendar', name: 'Calendar', icon: Calendar },
    { id: 'leaves', name: 'Leave Requests', icon: FileText },
    { id: 'wfh', name: 'WFH Requests', icon: FileText },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Attendance Management</h1>
        <p className="text-gray-600 mt-1">Track your attendance, manage leaves, and view attendance history</p>
      </div>

      {/* Controls */}
      <div className="flex items-center space-x-4">
        <button onClick={checkIn} className="bg-green-600 text-white px-4 py-2 rounded">Check In</button>
        <button onClick={checkOut} className="bg-red-600 text-white px-4 py-2 rounded">Check Out</button>
        <button onClick={openBreakModal} className="bg-yellow-500 text-white px-4 py-2 rounded">Start Break</button>
        {onBreak && (
          <div className="flex items-center space-x-3">
            <div className="text-sm">Break remaining:</div>
            <div className="font-mono">
              {Math.floor(remainingMs / 60000).toString().padStart(2,'0')}:{Math.floor((remainingMs % 60000)/1000).toString().padStart(2,'0')}
            </div>
            <button onClick={returnFromBreak} className="bg-blue-600 text-white px-3 py-1 rounded">Return</button>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'overview' | 'calendar' | 'leaves')}
                className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'overview' && <AttendanceStats />}
          {activeTab === 'calendar' && <AttendanceCalendar />}
          {activeTab === 'leaves' && <LeaveRequests />}
          {activeTab === 'wfh' && <WFHRequests />}
        </div>
      </div>

      {/* Break Modal */}
      {breakModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="bg-white p-6 rounded shadow">
            <h3 className="text-lg font-medium mb-4">Choose break duration</h3>
            <div className="grid grid-cols-2 gap-3">
              {[15,30,45,60].map(m => (
                <button key={m} onClick={() => chooseBreak(m)} className="p-3 bg-gray-100 rounded">{m} minutes</button>
              ))}
            </div>
            <div className="mt-4 text-right">
              <button onClick={() => setBreakModalOpen(false)} className="text-sm text-gray-600">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};