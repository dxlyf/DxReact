// useTimeline.ts
import { useEffect, useRef, useState } from 'react';
import { AnimationConfig } from './types';
import { easings } from './easings';

const useTimeline = (config: AnimationConfig) => {
  const { duration = 300, easing = 'linear', delay = 0 } = config;
  const [progress, setProgress] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    const easingFn = typeof easing === 'string' ? easings[easing] : easing;

    const step = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp + delay;
      const elapsed = timestamp - startTimeRef.current;
      if (elapsed < 0) {
        animationFrameRef.current = requestAnimationFrame(step);
        return;
      }
      let currentProgress = elapsed / duration;
      if (currentProgress > 1) currentProgress = 1;
      const easedProgress = easingFn(currentProgress);
      setProgress(easedProgress);
      if (currentProgress < 1) {
        animationFrameRef.current = requestAnimationFrame(step);
      } else {
        config.onComplete?.();
      }
    };

    animationFrameRef.current = requestAnimationFrame(step);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [duration, easing, delay]);

  return progress;
};