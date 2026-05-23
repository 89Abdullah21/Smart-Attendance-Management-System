import { Link } from 'react-router-dom';
import { MapPin, Clock, User } from 'lucide-react';
import Badge from '../ui/Badge';
import { useAttendanceWindow } from '../../hooks/useAttendanceWindow';
import { formatSlotTime } from '../../utils/dateHelpers';

/**
 * SlotCard — Individual class card showing course, room, teacher, and session badge.
 * Links to /student/mark/:slotId when session is Active.
 *
 * @param {TimetableSlot} slot — { slot_id, course_name, teacher_name, room_location,
 *                               start_time, end_time, day_of_week }
 * @param {boolean} compact — smaller layout for WeekGrid cells
 */
export default function SlotCard({ slot, compact = false }) {
  const { sessionStatus } = useAttendanceWindow(slot);
  const badgeVariant = { active: 'Active', upcoming: 'Upcoming', finished: 'Finished' }[sessionStatus] ?? 'Finished';

  if (compact) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-2 text-xs space-y-1 shadow-sm">
        <p className="font-semibold text-slate-800 truncate">{slot.course_name}</p>
        <p className="text-slate-400">{formatSlotTime(slot.start_time)}</p>
        <Badge label={badgeVariant} variant={badgeVariant} />
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl border shadow-sm p-4 transition-all ${sessionStatus === 'active' ? 'border-indigo-300 ring-1 ring-indigo-200' : 'border-slate-200'}`}>
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-slate-900 text-sm">{slot.course_name}</h3>
        <Badge label={badgeVariant} variant={badgeVariant} />
      </div>
      <div className="space-y-1 text-xs text-slate-500">
        <p className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{formatSlotTime(slot.start_time)} – {formatSlotTime(slot.end_time)}</p>
        <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{slot.room_location}</p>
        {slot.teacher_name && <p className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" />{slot.teacher_name}</p>}
      </div>
      {sessionStatus === 'active' && (
        <Link
          to={`/student/mark/${slot.slot_id}`}
          id={`slot-mark-btn-${slot.slot_id}`}
          className="mt-3 block w-full text-center text-xs font-medium py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
        >
          Mark Attendance →
        </Link>
      )}
    </div>
  );
}
