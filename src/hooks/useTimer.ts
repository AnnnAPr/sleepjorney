import { useEffect, useRef, useState, useCallback, useMemo } from 'react';

export const useTimer = (onEnd: () => void) => {
  const [seconds, setSeconds] = useState<number>(0);
  const intervalRef = useRef<number | null>(null);

  const stop = useCallback((): void => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const reset = useCallback((): void => {
    stop();
    setSeconds(0);
  }, [stop]);

  const start = useCallback((minutes: number): void => {
    const totalSeconds = Math.floor(minutes * 60);
    setSeconds(totalSeconds);

    stop();

    intervalRef.current = window.setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          stop();
          onEnd();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [stop, onEnd]);

  const resume = useCallback((): void => {
    if (intervalRef.current || seconds <= 0) return;

    intervalRef.current = window.setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          stop();
          onEnd();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [stop, onEnd, seconds]);

  useEffect(() => {
    return () => stop();
  }, [stop]);

  return useMemo(() => ({
    seconds,
    start,
    stop,
    reset,
    resume
  }), [seconds, start, stop, reset, resume]);
};