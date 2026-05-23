import SlotCard from './SlotCard';

/**
 * DayView — Single-day slot list with session status badges.
 *
 * @param {TimetableSlot[]} slots
 * @param {Date}            date
 */
export default function DayView({ slots = [], date = new Date() }) {
  const label = date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div>
      <p className="text-sm font-semibold text-slate-600 mb-4">{label}</p>
      {slots.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-10">No classes scheduled for today.</p>
      ) : (
        <div className="space-y-3">
          {slots.map((slot) => <SlotCard key={slot.slot_id} slot={slot} />)}
        </div>
      )}
    </div>
  );
}
