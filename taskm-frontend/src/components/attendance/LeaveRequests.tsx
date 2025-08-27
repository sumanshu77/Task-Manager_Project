import React, { useState } from 'react';
import { useAttendance } from '../../contexts/useAttendance';
import { useForm } from 'react-hook-form';
import { Plus, Calendar, FileText, Clock, X } from 'lucide-react';
import { useAuth } from '../../contexts/useAuth';
import { AdminLeaves } from './AdminLeaves';

interface LeaveForm {
  startDate: string;
  endDate: string;
  type: 'sick' | 'vacation' | 'personal' | 'other' | 'wfh' | 'festival' | 'emergency';
  reason: string;
  hoursPerDay?: number;
  workLocation?: string;
}

export const LeaveRequests: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const { state, requestLeave } = useAttendance();
  const auth = useAuth();
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<LeaveForm>();

  const watchType = watch('type');

  const onSubmit = (data: LeaveForm) => {
    // Build payload explicitly to avoid using `any`
    let reasonText = data.reason;
    if (data.type === 'wfh') {
      const details: string[] = [];
      if (data.hoursPerDay) details.push(`Hours/day: ${data.hoursPerDay}`);
      if (data.workLocation) details.push(`Location: ${data.workLocation}`);
      if (details.length) reasonText = `WFH — ${details.join(', ')}. ${reasonText}`;
    }

    const payload = {
      startDate: data.startDate,
      endDate: data.endDate,
      type: data.type,
      reason: reasonText,
    };

    requestLeave(payload);
    reset();
    setShowForm(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'sick':
        return 'bg-red-50 text-red-700';
      case 'vacation':
        return 'bg-blue-50 text-blue-700';
      case 'personal':
        return 'bg-purple-50 text-purple-700';
      case 'wfh':
        return 'bg-indigo-50 text-indigo-700';
      case 'festival':
        return 'bg-yellow-50 text-yellow-700';
      case 'emergency':
        return 'bg-pink-50 text-pink-700';
      default:
        return 'bg-gray-50 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Leave Requests</h3>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Request Leave
        </button>
      </div>

      {/* Leave Request Form */}
      {showForm && (
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-medium text-gray-900">New Leave Request</h4>
            <button
              onClick={() => setShowForm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date *
                </label>
                <input
                  {...register('startDate', { required: 'Start date is required' })}
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.startDate && (
                  <p className="text-red-500 text-sm mt-1">{errors.startDate.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date *
                </label>
                <input
                  {...register('endDate', { required: 'End date is required' })}
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.endDate && (
                  <p className="text-red-500 text-sm mt-1">{errors.endDate.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Leave Type *
              </label>
              <select
                {...register('type', { required: 'Leave type is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select leave type</option>
                <option value="sick">Sick Leave</option>
                <option value="vacation">Vacation</option>
                <option value="personal">Personal</option>
                <option value="wfh">Work From Home (WFH)</option>
                <option value="festival">Festival / Holiday</option>
                <option value="emergency">Emergency Leave</option>
                <option value="other">Other</option>
              </select>
              {errors.type && (
                <p className="text-red-500 text-sm mt-1">{errors.type.message}</p>
              )}
            </div>

            {/* WFH extra fields */}
            {watchType === 'wfh' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Estimated hours/day *</label>
                  <input
                    {...register('hoursPerDay', { valueAsNumber: true, min: 1 })}
                    type="number"
                    min={1}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="e.g., 8"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Work location (optional)</label>
                  <input
                    {...register('workLocation')}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="City / Home / Office"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason *
              </label>
              <textarea
                {...register('reason', { required: 'Reason is required' })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Please provide a reason for your leave request"
              />
              {errors.reason && (
                <p className="text-red-500 text-sm mt-1">{errors.reason.message}</p>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Submit Request
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Leave Quotas Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {(() => {
          // define total quotas (tweak as needed)
          const quotas: Record<string, number> = {
            Sick: 12,
            'Work From Home': 20,
            Festival: 6,
            Emergency: 3,
          };

          // map request.type to our quota categories
          const mapTypeToCategory = (t: string) => {
            switch (t) {
              case 'sick':
                return 'Sick';
              case 'wfh':
                return 'Work From Home';
              case 'festival':
              case 'vacation':
                return 'Festival';
              case 'emergency':
                return 'Emergency';
              default:
                return 'Emergency';
            }
          };

          const usedCounts: Record<string, number> = { Sick: 0, 'Work From Home': 0, Festival: 0, Emergency: 0 };
          state.leaveRequests.forEach((r) => {
            const cat = mapTypeToCategory(r.type);
            if (usedCounts[cat] !== undefined) usedCounts[cat] += 1;
          });

          const cards = Object.keys(quotas).map((k) => {
            const total = quotas[k];
            const used = usedCounts[k] || 0;
            const remaining = Math.max(total - used, 0);
            // colors
            const styles: Record<string, { bg: string; accent: string }> = {
              Sick: { bg: 'bg-red-50', accent: 'bg-red-600' },
              'Work From Home': { bg: 'bg-indigo-50', accent: 'bg-indigo-600' },
              Festival: { bg: 'bg-yellow-50', accent: 'bg-yellow-600' },
              Emergency: { bg: 'bg-pink-50', accent: 'bg-pink-600' },
            };
            const st = styles[k] || { bg: 'bg-gray-50', accent: 'bg-gray-600' };

            return (
              <div key={k} className={`p-4 rounded-lg shadow-sm border ${st.bg} border-gray-200`}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-sm text-gray-600">{k}</div>
                    <div className="text-xl font-semibold text-gray-900">{remaining}/{total} left</div>
                  </div>
                  <div className="text-xs text-gray-500">Used: {used}</div>
                </div>
                <div className="w-full bg-white rounded-full h-2 overflow-hidden border border-gray-100">
                  <div
                    className={`${st.accent} h-2 rounded-full`}
                    style={{ width: `${Math.min((used / total) * 100, 100)}%` }}
                  />
                </div>
              </div>
            );
          });

          return cards;
        })()}
      </div>

      {/* Leave Requests List */}
      <div className="space-y-4">
        {state.leaveRequests.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center shadow-sm border border-gray-200">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No leave requests found</p>
          </div>
        ) : (
          state.leaveRequests.map((request) => (
            <div key={request.id} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(request.type)}`}>
                      {request.type}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                      {request.status}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>{request.startDate} to {request.endDate}</span>
                    </div>

                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>Applied on {request.appliedAt}</span>
                    </div>

                    <p className="text-gray-700 mt-2">{request.reason}</p>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Admin: All leaves */}
      {auth.state.user?.role === 'admin' && (
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h4 className="text-lg font-medium mb-4">All Leave Requests (Admin)</h4>
          <AdminLeaves />
        </div>
      )}

      {/* Upcoming Holidays */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Upcoming Holidays</h4>
        <div className="space-y-3">
          {state.holidays.map((holiday) => (
            <div key={holiday.id} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <div>
                <h5 className="font-medium text-gray-900">{holiday.name}</h5>
                <p className="text-sm text-gray-600">{holiday.date}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                holiday.type === 'national' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-green-100 text-green-800'
              }`}>
                {holiday.type}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};