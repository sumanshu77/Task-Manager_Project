import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/useAuth';
import { useAttendance } from '../../contexts/useAttendance';
import { 
  Bell, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  User
} from 'lucide-react';

export const Header: React.FC = () => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const { state: authState, logout } = useAuth();
  const { state: attendanceState } = useAttendance()!;

  return (
    <header className="fixed top-0 right-0 left-0 bg-white border-b border-gray-200 z-40">
      <div className="px-4 lg:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Mobile menu button */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="lg:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100"
          >
            {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* Logo for mobile */}
          <Link to="/dashboard" className="lg:hidden">
            <span className="text-xl font-bold text-blue-600">TaskFlow</span>
          </Link>

          {/* Right side items */}
          <div className="flex items-center space-x-4">
            {/* Attendance status indicator (read-only) */}
            <div className="hidden sm:flex items-center">
              <span className={`px-2 py-1 rounded-full text-sm font-medium mr-3 ${
                attendanceState.currentStatus === 'checked-in' ? 'bg-green-100 text-green-800' :
                attendanceState.currentStatus === 'on-break' ? 'bg-orange-100 text-orange-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {attendanceState.currentStatus === 'checked-in' ? 'Checked-in' : attendanceState.currentStatus === 'on-break' ? 'On Break' : 'Checked-out'}
              </span>
            </div>

            {/* Notifications */}
            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg relative">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
            </button>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100"
              >
                {authState.user?.avatar ? (
                  <img
                    src={authState.user.avatar}
                    alt={authState.user.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
                <span className="hidden md:block text-sm font-medium text-gray-700">
                  {authState.user?.name}
                </span>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200">
                  <div className="p-3 border-b border-gray-200">
                    <p className="text-sm font-medium text-gray-900">{authState.user?.name}</p>
                    <p className="text-xs text-gray-500">{authState.user?.email}</p>
                    <p className="text-xs text-blue-600 mt-1 capitalize">{authState.user?.role}</p>
                  </div>
                  <div className="py-1">
                    <Link
                      to="/profile"
                      className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <User className="w-4 h-4 mr-3" />
                      Profile
                    </Link>
                    <Link
                      to="/settings"
                      className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Settings className="w-4 h-4 mr-3" />
                      Settings
                    </Link>
                    <button
                      onClick={logout}
                      className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <LogOut className="w-4 h-4 mr-3" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile attendance controls moved to Attendance page */}
    </header>
  );
};