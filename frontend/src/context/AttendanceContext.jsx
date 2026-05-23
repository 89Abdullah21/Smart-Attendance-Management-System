import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { haversineDistance } from '../utils/distanceCalc';

const GEOFENCE_RADIUS_METERS = 50; 

const AttendanceContext = createContext(null);

const INITIAL_GEO = {
  lat: null,
  lng: null,
  accuracy: null,
  status: 'idle', // 'idle' | 'requesting' | 'granted' | 'denied' | 'error'
};

export function AttendanceProvider({ children }) {
  const { user, token, DEV_MODE, PLACEHOLDER_TIMETABLE, PLACEHOLDER_COURSES } = useAuth();

  const [activeSlot, setActiveSlot]             = useState(null);
  const [geolocation, setGeolocation]           = useState(INITIAL_GEO);
  const [distanceMeters, setDistanceMeters]     = useState(null);
  const [isWithinRadius, setIsWithinRadius]     = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState('idle');
  const [lastRecord, setLastRecord]             = useState(null);

  const watchIdRef = { current: null };

  // ── loadActiveSlot ─────────────────────────────────────────────────────────
  const loadActiveSlot = useCallback(async (slotId) => {
    // DEV MODE FALLBACK INTERCEPTOR
    if (DEV_MODE) {
      const match = PLACEHOLDER_TIMETABLE.find(s => s.slot_id === parseInt(slotId));
      if (match) {
        const course = PLACEHOLDER_COURSES.find(c => c.course_id === match.course_id);
        setActiveSlot({
          ...match,
          course_name: course ? course.course_name : "Academic Course Lecture",
          teacher_name: "Prof. Dr. Faisal Khan",
          // Set standard mock campus classroom coordinates anchor
          latitude: 34.0150,
          longitude: 71.5250
        });
      }
      return;
    }

    try {
      const res = await fetch(`/api/student/slot/${slotId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load slot');
      const slot = await res.json();
      setActiveSlot(slot);
    } catch (err) {
      console.error('[AttendanceContext] loadActiveSlot:', err);
    }
  }, [token, DEV_MODE, PLACEHOLDER_TIMETABLE, PLACEHOLDER_COURSES]);

  // ── startGeolocation ───────────────────────────────────────────────────────
  const startGeolocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGeolocation((g) => ({ ...g, status: 'error' }));
      return;
    }
    setGeolocation((g) => ({ ...g, status: 'requesting' }));

    // DEV MODE FALLBACK INTERCEPTOR: Simulate real geolocation tracking safely without browser blocks
    if (DEV_MODE) {
      setTimeout(() => {
        const mockLat = 34.0151; // Sitting right inside the classroom boundary
        const mockLng = 71.5251;
        setGeolocation({ lat: mockLat, lng: mockLng, accuracy: 5, status: 'granted' });
        
        if (activeSlot?.latitude) {
          const dist = haversineDistance(mockLat, mockLng, activeSlot.latitude, activeSlot.longitude);
          setDistanceMeters(Math.round(dist));
          setIsWithinRadius(dist <= GEOFENCE_RADIUS_METERS);
        } else {
          // If activeSlot parameters haven't written to state yet, provide an acceptable test baseline
          setDistanceMeters(12);
          setIsWithinRadius(true);
        }
      }, 600);
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setGeolocation({ lat: latitude, lng: longitude, accuracy, status: 'granted' });

        if (activeSlot?.latitude && activeSlot?.longitude) {
          const dist = haversineDistance(
            latitude, longitude,
            activeSlot.latitude, activeSlot.longitude,
          );
          setDistanceMeters(Math.round(dist));
          setIsWithinRadius(dist <= GEOFENCE_RADIUS_METERS);
        }
      },
      (err) => {
        const status = err.code === 1 ? 'denied' : 'error';
        setGeolocation((g) => ({ ...g, status }));
      },
      { enableHighAccuracy: true, maximumAge: 5000 },
    );
  }, [activeSlot, DEV_MODE]);

  // ── submitAttendance ───────────────────────────────────────────────────────
  const submitAttendance = useCallback(async () => {
    if (!activeSlot || !user) return;
    setSubmissionStatus('submitting');

    // DEV MODE FALLBACK INTERCEPTOR
    if (DEV_MODE) {
      await new Promise(resolve => setTimeout(resolve, 800)); // Network latency layout
      setLastRecord({
        attendance_id: Math.floor(Math.random() * 1000),
        student_id: user.id,
        slot_id: activeSlot.slot_id,
        status: isWithinRadius ? 'Present' : 'Absent',
        marked_at: new Date().toISOString()
      });
      setSubmissionStatus('success');
      return;
    }

    try {
      const body = {
        student_id:       user.id,
        slot_id:          activeSlot.slot_id,
        course_id:        activeSlot.course_id,
        latitude_marked:  geolocation.lat,
        longitude_marked: geolocation.lng,
        is_location_valid: isWithinRadius,
        status:           isWithinRadius ? 'Present' : 'Absent',
      };
      const res = await fetch('/api/attendance/mark', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Submission failed');
      }
      const record = await res.json();
      setLastRecord(record);
      setSubmissionStatus('success');
    } catch (err) {
      console.error('[AttendanceContext] submitAttendance:', err);
      setSubmissionStatus('error');
    }
  }, [activeSlot, user, token, geolocation, isWithinRadius, DEV_MODE]);

  const resetSubmission = useCallback(() => {
    setSubmissionStatus('idle');
    setLastRecord(null);
  }, []);

  const value = {
    activeSlot,
    geolocation,
    distanceMeters,
    isWithinRadius,
    submissionStatus,
    lastRecord,
    GEOFENCE_RADIUS_METERS,
    loadActiveSlot,
    startGeolocation,
    submitAttendance,
    resetSubmission,
  };

  return (
    <AttendanceContext.Provider value={value}>
      {children}
    </AttendanceContext.Provider>
  );
}

export function useAttendance() {
  const ctx = useContext(AttendanceContext);
  if (!ctx) throw new Error('useAttendance must be used within <AttendanceProvider>');
  return ctx;
}

export default AttendanceContext;