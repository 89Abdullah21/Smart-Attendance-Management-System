import { useState, useEffect } from 'react';
import { isSlotActive, isSlotUpcoming, isSlotFinished } from '../utils/dateHelpers';
import { DEV_MODE } from '../context/AuthContext';

/**
 * useAttendanceWindow — Enhanced to ensure active statuses remain open during local testing.
 */
export function useAttendanceWindow(slot) {
  const [sessionStatus, setSessionStatus] = useState(null);

  useEffect(() => {
    if (!slot) { setSessionStatus(null); return; }

    const evaluate = () => {
      // DEV_MODE override to ensure the Submit button isn't locked down due to real-world clock mismatch
      if (DEV_MODE) {
        return setSessionStatus('active');
      }

      if (isSlotActive(slot))    return setSessionStatus('active');
      if (isSlotUpcoming(slot))  return setSessionStatus('upcoming');
      if (isSlotFinished(slot))  return setSessionStatus('finished');
      setSessionStatus(null); 
    };

    evaluate();
    const interval = setInterval(evaluate, 30_000); 
    return () => clearInterval(interval);
  }, [slot]);

  return { sessionStatus, isActive: sessionStatus === 'active' };
}