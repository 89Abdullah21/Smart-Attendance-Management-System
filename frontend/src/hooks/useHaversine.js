import { useMemo } from 'react';
import { haversineDistance } from '../utils/distanceCalc';

/**
 * useHaversine — Reactively computes the great-circle distance (meters)
 * between a student's live position and a fixed classroom coordinate.
 *
 * @param {number|null} studentLat
 * @param {number|null} studentLng
 * @param {number|null} targetLat   — timetable.latitude
 * @param {number|null} targetLng   — timetable.longitude
 * @param {number}      radius      — geofence threshold in meters (default 50)
 *
 * Returns:
 *   distanceMeters  number | null
 *   isWithinRadius  boolean
 */
export function useHaversine(studentLat, studentLng, targetLat, targetLng, radius = 50) {
  const distanceMeters = useMemo(() => {
    if (
      studentLat == null || studentLng == null ||
      targetLat  == null || targetLng  == null
    ) return null;
    return Math.round(haversineDistance(studentLat, studentLng, targetLat, targetLng));
  }, [studentLat, studentLng, targetLat, targetLng]);

  const isWithinRadius = distanceMeters !== null && distanceMeters <= radius;

  return { distanceMeters, isWithinRadius };
}
