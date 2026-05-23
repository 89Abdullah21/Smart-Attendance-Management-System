import { ShieldAlert } from 'lucide-react';

/**
 * ProxyWarning — Anti-proxy messaging banner shown when student is outside geofence.
 *
 * @param {number} distanceMeters
 * @param {number} radiusMeters
 * @param {boolean} show
 */
export default function ProxyWarning({ distanceMeters, radiusMeters = 50, show = true }) {
  if (!show) return null;

  const excess = distanceMeters != null ? Math.max(0, distanceMeters - radiusMeters) : null;

  return (
    <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm">
      <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
      <div>
        <p className="font-semibold text-red-700">Location verification failed</p>
        <p className="text-red-600 text-xs mt-0.5">
          You must be within <strong>{radiusMeters} m</strong> of the classroom to mark attendance.
          {excess != null && ` You are currently ~${excess} m outside the allowed radius.`}
        </p>
        <p className="text-red-500 text-xs mt-1 italic">
          This session will be recorded as Absent if submitted from this location.
        </p>
      </div>
    </div>
  );
}
