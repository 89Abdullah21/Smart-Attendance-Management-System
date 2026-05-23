import { useState } from 'react';
import { CalendarDays, List } from 'lucide-react';
import PageWrapper from '../../components/layout/PageWrapper';
import WeekGrid from '../../components/schedule/WeekGrid';
import DayView from '../../components/schedule/DayView';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import { useFetch } from '../../hooks/useFetch';
import { useAuth } from '../../context/AuthContext';

/**
 * StudentTimetable — /student/timetable
 * Enhanced with instant local seed fallbacks for smooth offline development.
 */
export default function StudentTimetable() {
  const { DEV_MODE, PLACEHOLDER_TIMETABLE } = useAuth();
  const [viewMode, setViewMode]       = useState('week');
  const [selectedDay, setSelectedDay] = useState(new Date());

  // Fetch production data when endpoint is online
  const { data: serverSlots, isLoading: serverLoading } = useFetch('/student/timetable');

  // ── LOCAL SEED ACCELERATOR ─────────────────────────────────────────────────
  // If in DEV_MODE and the server is offline or loading, fall back to AuthContext data
  const useLocalSeeds = DEV_MODE && !serverSlots;
  const slots = useLocalSeeds ? PLACEHOLDER_TIMETABLE : (serverSlots ?? []);

  // Filter slots to the selectedDay's weekday code for day view
  // Note: The database uses 3-letter codes ('Mon', 'Tue', 'Wed', 'Thu', 'Fri')
  const DAY_CODES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayCode   = DAY_CODES[selectedDay.getDay()];
  const daySlots  = slots.filter((s) => s.day_of_week === dayCode);

  const isLoading = !DEV_MODE && serverLoading;

  const actions = (
    <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
      <Button
        id="timetable-week-view-btn"
        variant={viewMode === 'week' ? 'primary' : 'ghost'}
        size="sm"
        onClick={() => setViewMode('week')}
        leftIcon={<CalendarDays className="w-4 h-4" />}
      >
        Week
      </Button>
      <Button
        id="timetable-day-view-btn"
        variant={viewMode === 'day' ? 'primary' : 'ghost'}
        size="sm"
        onClick={() => setViewMode('day')}
        leftIcon={<List className="w-4 h-4" />}
      >
        Day
      </Button>
    </div>
  );

  return (
    <PageWrapper title="My Timetable" actions={actions}>
      {isLoading ? (
        <Spinner label="Loading timetable…" />
      ) : !slots?.length ? (
        <EmptyState
          title="No classes scheduled"
          message="You are not enrolled in any courses with active timetable slots."
        />
      ) : viewMode === 'week' ? (
        <WeekGrid slots={slots} today={new Date()} />
      ) : (
        <>
          {/* Day selector */}
          <div className="flex items-center gap-2 mb-4">
            <input
              id="timetable-day-picker"
              type="date"
              value={selectedDay.toISOString().split('T')[0]}
              onChange={(e) => setSelectedDay(new Date(e.target.value + 'T00:00:00'))}
              className="text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <DayView slots={daySlots} date={selectedDay} />
        </>
      )}
    </PageWrapper>
  );
}