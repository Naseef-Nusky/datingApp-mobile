import { useState, useEffect, useCallback, useRef } from 'react';

const INACTIVITY_MS = 15 * 60 * 1000; // 15 minutes

const ACTIVITY_EVENTS = [
  'mousedown',
  'mousemove',
  'keydown',
  'scroll',
  'touchstart',
  'touchmove',
  'click',
];

/**
 * Tracks user activity and returns whether the user has been inactive for the threshold.
 * @param {boolean} enabled - When true, activity is tracked and timer runs
 * @returns {[boolean, function]} [showModal, reset] - showModal true when inactive threshold reached, reset() to dismiss and restart timer
 */
export function useInactivity(enabled) {
  const [showModal, setShowModal] = useState(false);
  const timerRef = useRef(null);
  const lastActivityRef = useRef(Date.now());

  const reset = useCallback(() => {
    lastActivityRef.current = Date.now();
    setShowModal(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (!enabled) return;
    timerRef.current = setTimeout(() => {
      setShowModal(true);
      timerRef.current = null;
    }, INACTIVITY_MS);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setShowModal(false);
      return;
    }

    const onActivity = () => {
      lastActivityRef.current = Date.now();
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      timerRef.current = setTimeout(() => {
        setShowModal(true);
        timerRef.current = null;
      }, INACTIVITY_MS);
    };

    // Start the initial timer
    onActivity();

    ACTIVITY_EVENTS.forEach((ev) => {
      window.addEventListener(ev, onActivity);
    });

    return () => {
      ACTIVITY_EVENTS.forEach((ev) => {
        window.removeEventListener(ev, onActivity);
      });
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [enabled]);

  return [showModal, reset];
}
