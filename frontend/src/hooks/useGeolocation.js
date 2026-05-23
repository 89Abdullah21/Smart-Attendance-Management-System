import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * useGeolocation — Wraps the browser Geolocation API with a clean state machine.
 *
 * Returns:
 *   coords   { lat, lng, accuracy }
 *   status   'idle' | 'requesting' | 'granted' | 'denied' | 'error'
 *   error    GeolocationPositionError | null
 *   refresh  () => void  — re-trigger a one-shot position request
 *   startWatch () => void — begin continuous GPS updates
 *   stopWatch  () => void — clear the watch
 */
export function useGeolocation(options = {}) {
  const { enableHighAccuracy = true, maximumAge = 5000, timeout = 10000 } = options;

  const [coords, setCoords]   = useState({ lat: null, lng: null, accuracy: null });
  const [status, setStatus]   = useState('idle');
  const [error, setError]     = useState(null);
  const watchIdRef            = useRef(null);

  const onSuccess = useCallback((pos) => {
    const { latitude, longitude, accuracy } = pos.coords;
    setCoords({ lat: latitude, lng: longitude, accuracy });
    setStatus('granted');
    setError(null);
  }, []);

  const onError = useCallback((err) => {
    setError(err);
    setStatus(err.code === err.PERMISSION_DENIED ? 'denied' : 'error');
  }, []);

  const geoOptions = { enableHighAccuracy, maximumAge, timeout };

  /** One-shot position request */
  const refresh = useCallback(() => {
    if (!navigator.geolocation) { setStatus('error'); return; }
    setStatus('requesting');
    navigator.geolocation.getCurrentPosition(onSuccess, onError, geoOptions);
  }, [onSuccess, onError]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Continuous GPS watch */
  const startWatch = useCallback(() => {
    if (!navigator.geolocation) { setStatus('error'); return; }
    if (watchIdRef.current !== null) return; // already watching
    setStatus('requesting');
    watchIdRef.current = navigator.geolocation.watchPosition(onSuccess, onError, geoOptions);
  }, [onSuccess, onError]); // eslint-disable-line react-hooks/exhaustive-deps

  const stopWatch = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => () => stopWatch(), [stopWatch]);

  return { coords, status, error, refresh, startWatch, stopWatch };
}
