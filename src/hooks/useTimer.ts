import { useEffect, useRef, useState } from 'react';

export const useTimer = (onEnd: () => void) => {
  const [seconds, setSeconds] = useState<number>(0);
  const intervalRef = useRef<number | null>(null);

  const start = (minutes: number): void => {
    const totalSeconds = minutes * 60;
    setSeconds(totalSeconds);

    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
    }

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
  };

  const stop = (): void => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setSeconds(0);
  };

  useEffect(() => {
    return () => stop();
  }, []);

  return {
    seconds,
    start,
    stop
  };
};