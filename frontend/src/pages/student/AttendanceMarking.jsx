import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, CheckCircle2, XCircle } from 'lucide-react';
import PageWrapper from '../../components/layout/PageWrapper';
import LocationCard from '../../components/location/LocationCard';
import GeofenceMap from '../../components/location/GeofenceMap';
import ProxyWarning from '../../components/location/ProxyWarning';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import { useAttendance } from '../../context/AttendanceContext';
import { useAttendanceWindow } from '../../hooks/useAttendanceWindow';
import { useNotification } from '../../context/NotificationContext';
import { formatSlotTime } from '../../utils/dateHelpers';

/**
 * AttendanceMarking — /student/mark/:slotId
 *
 * Local state:
 *   confirmModalOpen  boolean
 *
 * All live state (activeSlot, geolocation, distanceMeters,
 * isWithinRadius, submissionStatus) lives in AttendanceContext.
 *
 * DB write:
 *   INSERT INTO attendance (student_id, slot_id, course_id, class_date,
 *     status, latitude_marked, longitude_marked, is_location_valid)
 *   Unique constraint: uq_attendance(student_id, slot_id, class_date)
 */
export default function AttendanceMarking() {
  const { slotId } = useParams();
  const navigate   = useNavigate();
  const { push }   = useNotification();
  const {
    activeSlot, geolocation, distanceMeters, isWithinRadius,
    submissionStatus, loadActiveSlot, startGeolocation, submitAttendance, resetSubmission,
  } = useAttendance();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const { sessionStatus } = useAttendanceWindow(activeSlot);

  // Load slot data and start GPS on mount
  useEffect(() => {
    loadActiveSlot(slotId);
    startGeolocation();
    return () => resetSubmission();
  }, [slotId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle submission result
  useEffect(() => {
    if (submissionStatus === 'success') {
      push('success', isWithinRadius ? 'Attendance marked as Present!' : 'Recorded as Absent — location invalid.');
      setTimeout(() => navigate('/student/dashboard'), 2000);
    }
    if (submissionStatus === 'error') {
      push('error', 'Submission failed. You may have already marked attendance today.');
    }
  }, [submissionStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!activeSlot) return <Spinner label="Loading session…" />;

  const gpsReady = geolocation.status === 'granted';
  const canSubmit = gpsReady && sessionStatus === 'active' && submissionStatus === 'idle';

  return (
    <PageWrapper title="Mark Attendance">
      <div className="max-w-lg mx-auto space-y-5">

        {/* ── Session Info Card ─────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-indigo-200 ring-1 ring-indigo-100 p-5 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-semibold text-slate-900">{activeSlot.course_name}</h2>
              <p className="text-sm text-slate-500">{activeSlot.teacher_name} · {activeSlot.room_location}</p>
            </div>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
              sessionStatus === 'active'   ? 'bg-blue-50 text-blue-700 border-blue-200' :
              sessionStatus === 'upcoming' ? 'bg-amber-50 text-amber-700 border-amber-200' :
              'bg-slate-100 text-slate-500 border-slate-200'
            }`}>
              {sessionStatus?.charAt(0).toUpperCase() + sessionStatus?.slice(1)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-slate-600">
            <Clock className="w-4 h-4 text-indigo-400" />
            {formatSlotTime(activeSlot.start_time)} – {formatSlotTime(activeSlot.end_time)}
          </div>
          {sessionStatus !== 'active' && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              {sessionStatus === 'upcoming'
                ? '⏳ Class has not started yet. Return during the scheduled window to mark attendance.'
                : '⌛ This class session has already ended.'}
            </p>
          )}
        </div>

        {/* ── Location Module ───────────────────────────────────── */}
        <LocationCard geolocation={geolocation} />
        <GeofenceMap
          targetLat={activeSlot.latitude}
          targetLng={activeSlot.longitude}
          studentLat={geolocation.lat}
          studentLng={geolocation.lng}
          isWithinRadius={isWithinRadius}
          roomName={activeSlot.room_location}
        />

        {/* ── Distance Readout ──────────────────────────────────── */}
        {gpsReady && distanceMeters !== null && (
          <div className="flex items-center justify-between text-sm px-4 py-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-600">Distance from classroom</span>
            <span className={`font-semibold ${isWithinRadius ? 'text-emerald-600' : 'text-red-600'}`}>
              {distanceMeters} m
            </span>
          </div>
        )}

        {/* ── Anti-proxy Warning ────────────────────────────────── */}
        {gpsReady && !isWithinRadius && distanceMeters !== null && (
          <ProxyWarning distanceMeters={distanceMeters} show />
        )}

        {/* ── Success / Error States ───────────────────────────── */}
        {submissionStatus === 'success' && (
          <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium">Attendance recorded! Redirecting…</span>
          </div>
        )}
        {submissionStatus === 'error' && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
            <XCircle className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium">Already marked or session expired.</span>
          </div>
        )}

        {/* ── Submit Button ─────────────────────────────────────── */}
        <Button
          id="attendance-submit-btn"
          fullWidth
          size="lg"
          onClick={() => setConfirmOpen(true)}
          disabled={!canSubmit}
          loading={submissionStatus === 'submitting'}
        >
          Submit Attendance
        </Button>
      </div>

      {/* ── Confirmation Modal ────────────────────────────────── */}
      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Confirm Attendance"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button
              variant={isWithinRadius ? 'success' : 'danger'}
              size="sm"
              onClick={() => { setConfirmOpen(false); submitAttendance(); }}
            >
              {isWithinRadius ? 'Confirm — Mark Present' : 'Submit Anyway (Absent)'}
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          {isWithinRadius
            ? 'Your location is verified. Your attendance will be recorded as Present.'
            : 'Your location is outside the allowed radius. Submitting will record you as Absent.'}
        </p>
      </Modal>
    </PageWrapper>
  );
}
