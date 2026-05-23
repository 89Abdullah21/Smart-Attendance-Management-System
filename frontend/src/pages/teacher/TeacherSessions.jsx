import { useState, useEffect } from 'react';
import { Play, Square, Pause, Users, MapPin, Sliders, RefreshCw, AlertCircle, CheckCircle2, ChevronRight, Ban, Radio } from 'lucide-react';
import PageWrapper from '../../components/layout/PageWrapper';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

/**
 * TeacherSessions — /teacher/sessions
 * 
 * Allows teachers to control live lecture windows, broadcast geofences,
 * toggle distance radii parameters, and monitor student check-ins in real-time.
 */
export default function TeacherSessions() {
  const { getMyCourses, getMySlots, PLACEHOLDER_STUDENTS } = useAuth();
  const { push } = useNotification();

  const courses = getMyCourses();
  const slots = getMySlots();

  // Active control states
  const [selectedSlot, setSelectedSlot] = useState(slots[0]?.slot_id || 1);
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionPaused, setSessionPaused] = useState(false);
  const [geofenceRadius, setGeofenceRadius] = useState(50); // meters
  const [locationVerification, setLocationVerification] = useState(true);
  const [simulatedLogs, setSimulatedLogs] = useState([]);
  const [tick, setTick] = useState(0);

  const activeSlotData = slots.find(s => s.slot_id === Number(selectedSlot)) || slots[0];
  const courseData = courses.find(c => c.course_id === activeSlotData?.course_id);

  // ── Simulated Student Check-Ins in Real-Time ─────────────────────────────────
  useEffect(() => {
    if (!sessionActive || sessionPaused) return;

    const interval = setInterval(() => {
      // Pick a random student who hasn't checked in yet
      const checkedInIds = simulatedLogs.map(log => log.student_id);
      const remainingStudents = PLACEHOLDER_STUDENTS.filter(s => !checkedInIds.includes(s.student_id));

      if (remainingStudents.length === 0) {
        clearInterval(interval);
        return;
      }

      const randomStudent = remainingStudents[Math.floor(Math.random() * remainingStudents.length)];
      
      // Simulate random distance from the teacher's classroom slot
      // 80% chance of being within geofence, 20% outside
      const isWithin = Math.random() > 0.2;
      const calculatedDistance = isWithin 
        ? Math.floor(Math.random() * (geofenceRadius - 5)) + 2 
        : Math.floor(Math.random() * 200) + geofenceRadius;

      const timestamp = new Date().toLocaleTimeString();

      const newLog = {
        id: Math.random().toString(),
        student_id: randomStudent.student_id,
        full_name: randomStudent.full_name,
        roll_number: randomStudent.roll_number,
        distance: calculatedDistance,
        is_location_valid: isWithin || !locationVerification,
        marked_at: timestamp,
        status: (isWithin || !locationVerification) ? 'Present' : 'Absent'
      };

      setSimulatedLogs(prev => [newLog, ...prev]);
      
      if (isWithin || !locationVerification) {
        push('success', `Student check-in verified: ${randomStudent.full_name}`);
      } else {
        push('warning', `Check-in flagged (Geofence Breach): ${randomStudent.full_name}`, 5000);
      }

      setTick(t => t + 1);
    }, 4500); // Check-in every 4.5 seconds

    return () => clearInterval(interval);
  }, [sessionActive, sessionPaused, simulatedLogs, geofenceRadius, locationVerification]);

  const handleStartSession = () => {
    setSessionActive(true);
    setSessionPaused(false);
    setSimulatedLogs([]);
    push('success', 'Live attendance session activated successfully. Geofence broadcasting live!');
  };

  const handlePauseToggle = () => {
    setSessionPaused(prev => !prev);
    push('info', sessionPaused ? 'Attendance session resumed.' : 'Attendance session paused temporarily.');
  };

  const handleStopSession = () => {
    setSessionActive(false);
    setSessionPaused(false);
    push('error', `Live session stopped. Recorded ${simulatedLogs.filter(l => l.status === 'Present').length} total verified presences.`);
  };

  // Helper stats
  const presentCount = simulatedLogs.filter(l => l.status === 'Present').length;
  const absentCount = simulatedLogs.filter(l => l.status === 'Absent').length;
  const totalEnrolled = PLACEHOLDER_STUDENTS.length;

  return (
    <PageWrapper title="Live Sessions Control Desk">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ── Control Panel Column ───────────────────────────────────────────── */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <div className="p-5 space-y-4">
              <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-3">
                <Sliders className="w-4 h-4 text-violet-500" />
                Session Activator
              </h2>

              {/* Slot selector */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Select Scheduled Slot</label>
                <select
                  disabled={sessionActive}
                  value={selectedSlot}
                  onChange={(e) => setSelectedSlot(Number(e.target.value))}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-violet-500 focus:outline-none disabled:opacity-50 disabled:bg-slate-50"
                >
                  {slots.map(s => {
                    const c = courses.find(item => item.course_id === s.course_id);
                    return (
                      <option key={s.slot_id} value={s.slot_id}>
                        {c?.course_name} ({s.room_location} · {s.day_of_week} {s.start_time})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Geofence verification radius slider */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Geofence Radius (Meters)</label>
                  <span className="text-sm font-semibold text-violet-600">{geofenceRadius}m</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="150"
                  step="5"
                  value={geofenceRadius}
                  onChange={(e) => setGeofenceRadius(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-violet-600"
                />
              </div>

              {/* GPS verification toggle */}
              <div className="flex items-center justify-between py-2 border-t border-b border-slate-100">
                <div>
                  <p className="text-xs font-semibold text-slate-700">Enforce Geolocation Verification</p>
                  <p className="text-[10px] text-slate-400">Flag check-ins outside geofence boundary as Absent</p>
                </div>
                <button
                  type="button"
                  onClick={() => setLocationVerification(prev => !prev)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${locationVerification ? 'bg-violet-600' : 'bg-slate-200'}`}
                >
                  <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${locationVerification ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Action buttons */}
              <div className="pt-2 space-y-2">
                {!sessionActive ? (
                  <Button
                    onClick={handleStartSession}
                    fullWidth
                    leftIcon={<Play className="w-4 h-4" />}
                    variant="primary"
                    className="bg-violet-600 hover:bg-violet-700 shadow-md text-white"
                  >
                    Activate Session
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Button
                        onClick={handlePauseToggle}
                        fullWidth
                        variant="secondary"
                        leftIcon={sessionPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                      >
                        {sessionPaused ? 'Resume' : 'Pause'}
                      </Button>
                      <Button
                        onClick={handleStopSession}
                        fullWidth
                        variant="danger"
                        leftIcon={<Square className="w-4 h-4" />}
                      >
                        Stop Session
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Active status card */}
          <Card>
            <div className="p-5 flex flex-col items-center justify-center text-center space-y-3">
              <div className={`p-3 rounded-full ${sessionActive && !sessionPaused ? 'bg-emerald-100 text-emerald-600 animate-pulse' : 'bg-slate-100 text-slate-400'}`}>
                {sessionActive && !sessionPaused ? <Radio className="w-8 h-8" /> : <Ban className="w-8 h-8" />}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700">Broadcast Station</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {sessionActive && !sessionPaused 
                    ? `Broadcasting signals at CS geofence point: (${activeSlotData?.latitude}, ${activeSlotData?.longitude})` 
                    : sessionActive && sessionPaused 
                      ? 'Broadcasting signal temporarily suspended.' 
                      : 'Station inactive. Select class and activate live check-ins.'}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* ── Active Session Stats & Charts Column ───────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Header KPI cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase">Present</span>
              <span className="text-3xl font-extrabold text-emerald-600 mt-2">{presentCount}</span>
              <span className="text-[10px] text-slate-400 mt-1">Verified check-ins</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase">Geofence Out</span>
              <span className="text-3xl font-extrabold text-rose-600 mt-2">{absentCount}</span>
              <span className="text-[10px] text-slate-400 mt-1">Flagged / Ineligible</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase">Completion</span>
              <span className="text-3xl font-extrabold text-indigo-600 mt-2">
                {totalEnrolled > 0 ? Math.round(((presentCount + absentCount) / totalEnrolled) * 100) : 0}%
              </span>
              <span className="text-[10px] text-slate-400 mt-1">{presentCount + absentCount} of {totalEnrolled} checked in</span>
            </div>
          </div>

          {/* Real-time live log terminal */}
          <Card>
            <div className="p-5 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-violet-500" />
                  Live Attendance Check-In Monitor
                </h2>
                {sessionActive && (
                  <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Real-time Feed
                  </span>
                )}
              </div>

              <div className="min-h-[280px] max-h-[350px] overflow-y-auto space-y-2 pr-1">
                {simulatedLogs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400 space-y-2">
                    <AlertCircle className="w-8 h-8 opacity-40" />
                    <p className="text-sm font-medium text-slate-500">Feed awaiting activations</p>
                    <p className="text-xs text-slate-400 max-w-[280px] text-center">
                      Activate the live session. Simulated check-ins will populate here as students verify their geofence location.
                    </p>
                  </div>
                ) : (
                  simulatedLogs.map((log) => (
                    <div
                      key={log.id}
                      className={`flex items-center justify-between p-3 border rounded-xl transition-all hover:bg-slate-50 ${
                        log.status === 'Present' 
                          ? 'border-emerald-100 bg-emerald-50/20' 
                          : 'border-rose-100 bg-rose-50/20'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-full ${
                          log.status === 'Present' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                        }`}>
                          {log.status === 'Present' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{log.full_name}</p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                            <span className="font-mono">{log.roll_number}</span>
                            <span>•</span>
                            <span className="flex items-center gap-0.5"><MapPin size={10} /> {log.distance}m away</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                          log.status === 'Present' 
                            ? 'bg-emerald-100/60 text-emerald-700 border-emerald-200' 
                            : 'bg-rose-100/60 text-rose-700 border-rose-200'
                        }`}>
                          {log.status}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-1">{log.marked_at}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Card>
        </div>

      </div>
    </PageWrapper>
  );
}
