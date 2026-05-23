import { Crosshair, Wifi, WifiOff, AlertTriangle } from 'lucide-react';

/**
 * LocationCard — Shows GPS status, accuracy, and live coordinates.
 * Used on the AttendanceMarking page.
 *
 * @param {{ lat, lng, accuracy, status }} geolocation — from AttendanceContext
 */
export default function LocationCard({ geolocation }) {
  const { lat, lng, accuracy, status } = geolocation;

  const STATUS_CONFIG = {
    idle:       { icon: Crosshair,   color: 'text-slate-400', bg: 'bg-slate-50',   label: 'Not started' },
    requesting: { icon: Crosshair,   color: 'text-amber-500', bg: 'bg-amber-50',   label: 'Requesting GPS…' },
    granted:    { icon: Wifi,        color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'GPS Active' },
    denied:     { icon: WifiOff,     color: 'text-red-600',   bg: 'bg-red-50',     label: 'Permission Denied' },
    error:      { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50',     label: 'GPS Error' },
  };

  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.idle;
  const Icon = cfg.icon;

  return (
    <div className={`rounded-xl border border-slate-200 p-4 ${cfg.bg}`}>
      <div className="flex items-center gap-3 mb-3">
        <Icon className={`w-5 h-5 ${cfg.color}`} />
        <span className={`text-sm font-medium ${cfg.color}`}>{cfg.label}</span>
      </div>

      {status === 'granted' && lat && lng && (
        <div className="space-y-1 text-xs text-slate-600">
          <p><span className="font-medium w-20 inline-block">Latitude:</span>{lat.toFixed(6)}</p>
          <p><span className="font-medium w-20 inline-block">Longitude:</span>{lng.toFixed(6)}</p>
          {accuracy && (
            <p><span className="font-medium w-20 inline-block">Accuracy:</span>±{Math.round(accuracy)} m</p>
          )}
        </div>
      )}

      {status === 'denied' && (
        <p className="text-xs text-red-600">
          Location access was denied. Please enable GPS in your browser settings and try again.
        </p>
      )}
    </div>
  );
}
