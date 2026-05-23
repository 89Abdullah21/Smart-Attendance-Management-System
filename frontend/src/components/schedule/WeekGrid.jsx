import SlotCard from './SlotCard';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

/**
 * WeekGrid — 5-column Mon–Fri timetable grid.
 *
 * @param {TimetableSlot[]} slots  — from timetable JOIN courses
 * @param {Date}            today  — for highlighting active day column
 */
export default function WeekGrid({ slots = [], today = new Date() }) {
  const todayCode = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][today.getDay()];

  return (
    <div className="grid grid-cols-5 gap-3">
      {DAYS.map((day) => {
        const daySlots = slots.filter((s) => s.day_of_week === day);
        const isToday  = day === todayCode;

        return (
          <div key={day} className={`rounded-xl border ${isToday ? 'border-indigo-300 bg-indigo-50/40' : 'border-slate-200 bg-white'}`}>
            <div className={`px-3 py-2 text-center text-xs font-semibold uppercase tracking-wider rounded-t-xl border-b ${isToday ? 'text-indigo-700 border-indigo-200 bg-indigo-100' : 'text-slate-500 border-slate-100'}`}>
              {day}
            </div>
            <div className="p-2 space-y-2">
              {daySlots.length === 0 ? (
                <p className="text-center text-xs text-slate-300 py-4">—</p>
              ) : (
                daySlots.map((slot) => <SlotCard key={slot.slot_id} slot={slot} compact />)
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
