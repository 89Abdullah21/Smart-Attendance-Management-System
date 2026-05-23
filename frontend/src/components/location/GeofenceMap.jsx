import { MapPin } from 'lucide-react';

/**
 * GeofenceMap — Visual placeholder showing classroom pin and student radius ring.
 * Uses a static map image (OpenStreetMap tile) with an overlay.
 * Replace with a real Leaflet implementation when the backend is connected.
 *
 * @param {number} targetLat      — timetable.latitude
 * @param {number} targetLng      — timetable.longitude
 * @param {number} studentLat     — student's current GPS lat
 * @param {number} studentLng     — student's current GPS lng
 * @param {boolean} isWithinRadius
 * @param {string}  roomName
 */
export default function GeofenceMap({
  targetLat, targetLng, studentLat, studentLng,
  isWithinRadius, roomName,
}) {
  const hasTarget  = targetLat != null && targetLng != null;
  const hasStudent = studentLat != null && studentLng != null;

  // Static OSM tile preview (no JS required — server-rendered image)
  const mapUrl = hasTarget
    ? `https://staticmap.openstreetmap.de/staticmap.php?center=${targetLat},${targetLng}&zoom=17&size=600x300&markers=${targetLat},${targetLng},red`
    : null;

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-100">
      {mapUrl ? (
        <div className="relative">
          <img
            src={mapUrl}
            alt={`Map showing ${roomName}`}
            className="w-full h-44 object-cover"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          {/* Geofence status overlay */}
          <div className={`absolute bottom-2 left-2 px-2 py-1 rounded-lg text-xs font-medium shadow ${isWithinRadius ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
            {isWithinRadius ? '✓ Within radius' : '✗ Outside radius'}
          </div>
        </div>
      ) : (
        <div className="h-44 flex items-center justify-center text-slate-400">
          <div className="text-center">
            <MapPin className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Map unavailable</p>
          </div>
        </div>
      )}

      {hasStudent && (
        <div className="px-4 py-3 text-xs text-slate-600 border-t border-slate-200 bg-white">
          <p>Your position: <span className="font-mono">{studentLat?.toFixed(5)}, {studentLng?.toFixed(5)}</span></p>
          <p>Classroom: <span className="font-medium">{roomName}</span></p>
        </div>
      )}
    </div>
  );
}
