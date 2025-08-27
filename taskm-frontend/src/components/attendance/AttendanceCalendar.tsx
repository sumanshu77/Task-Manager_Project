import React, { useState } from 'react';
import { useAttendance } from '../../contexts/useAttendance';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns';

export const AttendanceCalendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { state } = useAttendance();

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getAttendanceForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return state.records.find(record => record.date === dateStr);
  };

  const getHolidayForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return state.holidays.find(holiday => holiday.date === dateStr);
  };

  const isWeekend = (date: Date) => {
    const d = date.getDay();
    return d === 0 || d === 6;
  };

  const getStatusColor = (date: Date) => {
    const attendance = getAttendanceForDate(date);
    const holiday = getHolidayForDate(date) || (isWeekend(date) ? { name: 'Weekend', type: 'company' } : null);

    if (holiday) {
      // strong purple for holidays/weekends
      if (holiday.name === 'Weekend') return 'bg-purple-700 border-purple-800 text-white';
      return 'bg-purple-700 border-purple-800 text-white';
    }
    if (!attendance) return 'bg-gray-50 border-gray-200 text-gray-800';

    switch (attendance.status) {
      case 'present':
        return 'bg-green-600 border-green-700 text-white';
      case 'late':
        return 'bg-yellow-500 border-yellow-600 text-black';
      case 'half-day':
        return 'bg-indigo-600 border-indigo-700 text-white';
      case 'absent':
        return 'bg-red-600 border-red-700 text-white';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  // status label class no longer used; colors are applied to day container

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900">
          {format(currentDate, 'MMMM yyyy')}
        </h3>
        <div className="flex space-x-2">
          <button
            onClick={prevMonth}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={nextMonth}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
          <span>Present</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-orange-100 border border-orange-300 rounded"></div>
          <span>Late</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded"></div>
          <span>Half Day</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
          <span>Absent</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-purple-100 border border-purple-300 rounded"></div>
          <span>Holiday</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-px bg-gray-200">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="bg-gray-50 py-2 text-center text-sm font-medium text-gray-700">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-px bg-gray-200">
          {/* Empty cells for days before month start */}
          {Array.from({ length: monthStart.getDay() }).map((_, index) => (
            <div key={`empty-${index}`} className="bg-white h-24"></div>
          ))}

          {/* Days of the month */}
          {daysInMonth.map((day) => {
            const attendance = getAttendanceForDate(day);
            const holiday = getHolidayForDate(day);
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={day.toString()}
                className={`relative h-32 p-2 border-2 ${getStatusColor(day)} ${isToday ? 'ring-2 ring-blue-500' : ''} overflow-hidden flex flex-col justify-between`}
              >
                {/* Status pill top-right */}
                { (holiday || attendance) && (
                  <span className={`absolute top-2 right-2 inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold shadow ${
                    holiday && holiday.name === 'Weekend'
                      ? 'bg-purple-800 text-white'
                      : holiday
                      ? 'bg-purple-700 text-white'
                      : attendance?.status === 'present'
                      ? 'bg-green-700 text-white'
                      : attendance?.status === 'late'
                      ? 'bg-orange-600 text-white'
                      : attendance?.status === 'half-day'
                      ? 'bg-blue-700 text-white'
                      : attendance?.status === 'absent'
                      ? 'bg-red-700 text-white'
                      : 'bg-gray-700 text-white'
                  }`}>{holiday ? (holiday.name === 'Weekend' ? 'WEEKEND' : 'HOLIDAY') : (attendance?.status || '').toUpperCase()}</span>
                )}

                <div>
                  {/* Weekday abbreviation */}
                  <div className="text-xs text-gray-700">{format(day, 'EEE')}</div>
                  <span className={`block text-sm font-medium ${isToday ? 'font-bold' : ''}`}>
                    {format(day, 'd')}
                  </span>
                  {/* Show weekend/holiday label under date for visibility */}
                  { (isWeekend(day) || (getHolidayForDate(day))) && (
                    <div className="text-[11px] font-medium mt-1 text-white/95">
                      {getHolidayForDate(day)?.name === 'Weekend' || isWeekend(day) ? 'Weekend' : getHolidayForDate(day)?.name}
                    </div>
                  )}
                </div>

                <div className="flex-1 mt-1 text-[12px] space-y-1 overflow-hidden max-h-20">
                  {holiday && (
                    <div className="text-white font-medium truncate opacity-95 text-sm">
                      {holiday.name}
                    </div>
                  )}
                  {attendance && !holiday && (
                    <div className="space-y-0.5">
                      <div className="text-[12px] mt-1 truncate"><span className="font-semibold">Check In:</span> {attendance.checkIn || '-'}</div>
                      <div className="text-[12px] truncate"><span className="font-semibold">Check Out:</span> {attendance.checkOut || '-'}</div>
                    </div>
                  )}

                  <div className="mt-1 font-medium text-sm truncate">{attendance?.totalHours ? `${attendance.totalHours}h` : ''}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};