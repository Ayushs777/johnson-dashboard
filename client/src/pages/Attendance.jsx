import React, { useEffect, useState } from 'react';
import { 
  CheckCircle2, XCircle, Calendar, Sun, Clock, Compass, Users, Star,
  ChevronLeft, ChevronRight, MapPin, FileText
} from 'lucide-react';
import { attendanceService } from '../services/attendanceService';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

const Attendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);

  const { role, user } = useAuth();

  // Month navigation state
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await attendanceService.getAttendance(null, month + 1, year);
        if (data.success) {
          setAttendance(data.attendance || []);
          if (data.attendance && data.attendance.length > 0) {
            setSelectedDay(data.attendance[0]);
          } else {
            setSelectedDay(null);
          }
        } else {
          setError(data.message || 'Failed to fetch attendance records');
        }
      } catch (err) {
        console.error('Error fetching attendance:', err);
        setError('Error loading attendance. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [month, year]);  // Re-fetch whenever the viewed month/year changes

  // Summary counts — filtered to currently-viewed month
  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  const counts = {
    present: attendance.filter(a => a.status === 'Present' && a.date?.startsWith(monthPrefix)).length,
    absent: attendance.filter(a => a.status === 'Absent' && a.date?.startsWith(monthPrefix)).length,
    leave: attendance.filter(a => a.status === 'Leave' && a.date?.startsWith(monthPrefix)).length,
    holiday: attendance.filter(a => a.status === 'Holiday' && a.date?.startsWith(monthPrefix)).length,
    halfDay: attendance.filter(a => a.status === 'Half Day' && a.date?.startsWith(monthPrefix)).length,
    outstation: attendance.filter(a => a.status === 'Outstation' && a.date?.startsWith(monthPrefix)).length,
    deputation: attendance.filter(a => a.status === 'Deputation' && a.date?.startsWith(monthPrefix)).length,
    compOff: attendance.filter(a => a.status === 'Comp-Off' && a.date?.startsWith(monthPrefix)).length,
    weekOff: attendance.filter(a => a.status === 'Week Off' && a.date?.startsWith(monthPrefix)).length,
  };


  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sun, 1 = Mon...
  // Convert Sunday=0 to Monday=0 indexing (Mon=0, Tue=1, Wed=2, Thu=3, Fri=4, Sat=5, Sun=6)
  const startingOffset = (firstDayOfMonth + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Create date map for quick lookup: { "2026-09-01": record }
  const attendanceByDate = {};
  attendance.forEach(rec => {
    if (rec.date) {
      // Normalize date to YYYY-MM-DD
      const dateKey = rec.date.slice(0, 10);
      attendanceByDate[dateKey] = rec;
    }
  });

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const getStatusAbbr = (status) => {
    switch (status) {
      case 'Present': return 'DO';
      case 'Holiday': return 'HO';
      case 'Outstation': return 'OS';
      case 'Leave': return 'L';
      case 'Deputation': return 'DE';
      case 'Half Day': return 'HD';
      case 'Absent': return 'AB';
      case 'Comp-Off': return 'CO';
      case 'Week Off': return 'WO';
      default: return 'DO';
    }
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'Present':
        return 'bg-emerald-500 text-white';
      case 'Absent':
        return 'bg-rose-500 text-white';
      case 'Leave':
        return 'bg-amber-500 text-white';
      case 'Holiday':
        return 'bg-rose-400 text-white';
      case 'Half Day':
        return 'bg-sky-400 text-white';
      case 'Outstation':
        return 'bg-cyan-500 text-white';
      case 'Deputation':
        return 'bg-indigo-500 text-white';
      case 'Comp-Off':
        return 'bg-pink-500 text-white';
      case 'Week Off':
        return 'bg-slate-500 text-white';
      default:
        return 'bg-slate-400 text-white';
    }
  };

  const getCardBgStyle = (status) => {
    switch (status) {
      case 'Present':
        return 'bg-emerald-50/60 border-emerald-100 hover:border-emerald-300';
      case 'Absent':
        return 'bg-rose-50/60 border-rose-100 hover:border-rose-300';
      case 'Leave':
        return 'bg-amber-50/60 border-amber-100 hover:border-amber-300';
      case 'Holiday':
        return 'bg-rose-50/40 border-rose-100 hover:border-rose-300';
      case 'Half Day':
        return 'bg-sky-50/60 border-sky-100 hover:border-sky-300';
      case 'Outstation':
        return 'bg-cyan-50/60 border-cyan-100 hover:border-cyan-300';
      case 'Deputation':
        return 'bg-indigo-50/60 border-indigo-100 hover:border-indigo-300';
      case 'Comp-Off':
        return 'bg-pink-50/60 border-pink-100 hover:border-pink-300';
      case 'Week Off':
        return 'bg-slate-100/60 border-slate-200 hover:border-slate-400';
      default:
        return 'bg-slate-50 border-slate-200';
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading Attendance Dashboard..." />;
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-md">
            {(attendance[0]?.employeeName || user?.name || 'U').charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {attendance[0]?.employeeName || user?.name || 'Employee User'}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="text-sm text-slate-500 font-medium">
                {user?.kcode || user?.ecode || attendance[0]?.ecode || '—'}
              </span>
              {/* Department Badge — sourced from attendance record or JWT */}
              {(attendance[0]?.department || user?.department) && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200">
                  <Compass className="w-3 h-3" />
                  {attendance[0]?.department || user?.department}
                </span>
              )}
            </div>
            {user?.email && (
              <p className="text-xs text-slate-400 mt-0.5">{user.email}</p>
            )}
          </div>
        </div>

        {/* Date Selector Navigation */}
        <div className="flex items-center gap-3 self-end md:self-auto">
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-1 shadow-xs">
            <button 
              onClick={handlePrevMonth}
              className="p-2 hover:bg-white rounded-lg text-slate-600 transition"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold text-slate-800 min-w-[140px] text-center flex items-center justify-center gap-2 px-4">
              <Calendar className="w-4 h-4 text-blue-600" />
              {monthNames[month]} {year}
            </span>
            <button 
              onClick={handleNextMonth}
              className="p-2 hover:bg-white rounded-lg text-slate-600 transition"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <button 
            onClick={handleToday}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm transition"
          >
            Today
          </button>
        </div>
      </div>



      {/* Main Content: Calendar Grid + Legend Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left: 3/4 Width Calendar Grid */}
        <div className="lg:col-span-3 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          {/* Days of week header */}
          <div className="grid grid-cols-7 gap-3 mb-3 text-center">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => (
              <div key={idx} className="text-xs font-bold text-slate-500 uppercase tracking-wider py-2 bg-slate-50 rounded-xl">
                {day}
              </div>
            ))}
          </div>

          {/* Monthly Calendar Cells */}
          <div className="grid grid-cols-7 gap-3">
            {/* Prev month empty cells offset */}
            {Array.from({ length: startingOffset }).map((_, i) => (
              <div key={`offset-${i}`} className="min-h-[100px] p-2 bg-slate-50/40 border border-slate-100 rounded-2xl opacity-40">
                <span className="text-xs font-semibold text-slate-400">{30 - startingOffset + i + 1}</span>
                <span className="block text-[10px] text-slate-400 mt-6 text-center">(Prev Month)</span>
              </div>
            ))}

            {/* Current month days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const record = attendanceByDate[dateStr];
              const isSelected = selectedDay && selectedDay.date?.slice(0, 10) === dateStr;

              return (
                <div
                  key={dayNum}
                  onClick={() => record && setSelectedDay(record)}
                  className={`min-h-[105px] p-2.5 rounded-2xl border transition cursor-pointer flex flex-col justify-between ${
                    record ? getCardBgStyle(record.status) : 'bg-slate-50 border-slate-200'
                  } ${isSelected ? 'ring-2 ring-blue-600 shadow-md' : ''}`}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-bold text-slate-800">{String(dayNum).padStart(2, '0')}</span>
                    {record && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shadow-2xs ${getStatusBadgeStyle(record.status)}`}>
                        {getStatusAbbr(record.status)}
                      </span>
                    )}
                  </div>

                  {record ? (
                    <div className="mt-2 text-center">
                      <p className="text-xs font-semibold text-slate-700">{record.status}</p>
                      {record.loginTime && record.loginTime !== '--' ? (
                        <p className="text-[10px] text-slate-500 font-medium mt-1">
                          {record.loginTime} - {record.logoutTime || '--'}
                        </p>
                      ) : (
                        <p className="text-[10px] text-slate-400 mt-1">--</p>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-2">
                      <span className="text-xs text-slate-300">--</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Sidebar: Day Details + Legend */}
        <div className="space-y-6">
          {/* Selected Day Details */}
          {selectedDay && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                Day Details
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">Date</span>
                  <span className="text-xs font-bold text-slate-800">{selectedDay.date?.slice(0,10) || '—'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">Status</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusBadgeStyle(selectedDay.status)}`}>
                    {selectedDay.status}
                  </span>
                </div>
                {selectedDay.loginTime && selectedDay.loginTime !== '--' && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-medium">Login</span>
                    <span className="text-xs font-bold text-slate-800">{selectedDay.loginTime}</span>
                  </div>
                )}
                {selectedDay.logoutTime && selectedDay.logoutTime !== '--' && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-medium">Logout</span>
                    <span className="text-xs font-bold text-slate-800">{selectedDay.logoutTime}</span>
                  </div>
                )}
                {selectedDay.workingHours && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-medium">Hours</span>
                    <span className="text-xs font-bold text-emerald-700">{selectedDay.workingHours} hrs</span>
                  </div>
                )}
                {selectedDay.employeeName && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-medium">Employee</span>
                    <span className="text-xs font-bold text-slate-800">{selectedDay.employeeName}</span>
                  </div>
                )}
                {selectedDay.ecode && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-medium">ECode</span>
                    <span className="text-xs font-mono font-bold text-slate-700">{selectedDay.ecode}</span>
                  </div>
                )}
                {(selectedDay.department || user?.department) && (
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-xs text-slate-500 font-medium">Department</span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200">
                      <Compass className="w-3 h-3" />
                      {selectedDay.department || user?.department}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Status Legend */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              Attendance Status Legend
            </h3>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="flex items-center gap-2">
                <span className="w-6 h-5 rounded-md bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center">DO</span>
                <span className="text-xs text-slate-600 font-medium">Present</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-5 rounded-md bg-rose-400 text-white text-[10px] font-bold flex items-center justify-center">HO</span>
                <span className="text-xs text-slate-600 font-medium">Holiday</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-5 rounded-md bg-cyan-500 text-white text-[10px] font-bold flex items-center justify-center">OS</span>
                <span className="text-xs text-slate-600 font-medium">Outstation</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-5 rounded-md bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">L</span>
                <span className="text-xs text-slate-600 font-medium">Leave</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-5 rounded-md bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center">DE</span>
                <span className="text-xs text-slate-600 font-medium">Deputation</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-5 rounded-md bg-sky-400 text-white text-[10px] font-bold flex items-center justify-center">HD</span>
                <span className="text-xs text-slate-600 font-medium">Half Day</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-5 rounded-md bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">AB</span>
                <span className="text-xs text-slate-600 font-medium">Absent</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-5 rounded-md bg-pink-500 text-white text-[10px] font-bold flex items-center justify-center">CO</span>
                <span className="text-xs text-slate-600 font-medium">Comp-Off</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-5 rounded-md bg-slate-500 text-white text-[10px] font-bold flex items-center justify-center">WO</span>
                <span className="text-xs text-slate-600 font-medium">Week Off</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Attendance;

