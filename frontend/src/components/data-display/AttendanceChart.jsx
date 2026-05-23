import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

/**
 * AttendanceChart — Recharts wrapper for attendance trend (line) and distribution (bar).
 *
 * @param {'line'|'bar'} type
 * @param {Array} data — [{ label: string, present: number, absent: number }]
 * @param {string} title
 */
export default function AttendanceChart({ type = 'line', data = [], title }) {
  const common = {
    data,
    margin: { top: 5, right: 10, left: -20, bottom: 5 },
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      {title && <h3 className="text-sm font-semibold text-slate-800 mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={240}>
        {type === 'bar' ? (
          <BarChart {...common}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="present" name="Present" fill="#6366f1" radius={[4, 4, 0, 0]} />
            <Bar dataKey="absent"  name="Absent"  fill="#fca5a5" radius={[4, 4, 0, 0]} />
          </BarChart>
        ) : (
          <LineChart {...common}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="present" name="Present" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="absent"  name="Absent"  stroke="#f87171" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
