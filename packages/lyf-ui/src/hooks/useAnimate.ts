import { useRef, useCallback, useEffect, useState, RefObject } from 'react';

export interface UseAnimateOptions {
  duration?: number;
  easing?: string;
  delay?: number;
  iterations?: number;
  direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
  fill?: 'none' | 'forwards' | 'backwards' | 'both';
}

export interface UseAnimateReturn {
  play: () => void;
  pause: () => void;
  reverse: () => void;
  cancel: () => void;
  finish: () => void;
  updateTiming: (options: UseAnimateOptions) => void;
  animation: Animation | null;
  isPlaying: boolean;
  isPaused: boolean;
}

export function useAnimate<T extends HTMLElement>(
  ref: RefObject<T>,
  keyframes: Keyframe[] | PropertyIndexedKeyframes | null,
  options: UseAnimateOptions = {}
): UseAnimateReturn {
  const animationRef = useRef<Animation | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const {
    duration = 300,
    easing = 'ease',
    delay = 0,
    iterations = 1,
    direction = 'normal',
    fill = 'none',
  } = options;

  const createAnimation = useCallback(() => {
    if (!ref.current || !keyframes) return null;

    const animation = ref.current.animate(keyframes, {
      duration,
      easing,
      delay,
      iterations,
      direction,
      fill,
    });

    animationRef.current = animation;

    animation.onfinish = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    animation.oncancel = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    return animation;
  }, [ref, keyframes, duration, easing, delay, iterations, direction, fill]);

  const play = useCallback(() => {
    if (!animationRef.current) {
      const animation = createAnimation();
      if (animation) {
        animation.play();
        setIsPlaying(true);
        setIsPaused(false);
      }
    } else {
      animationRef.current.play();
      setIsPlaying(true);
      setIsPaused(false);
    }
  }, [createAnimation]);

  const pause = useCallback(() => {
    if (animationRef.current) {
      animationRef.current.pause();
      setIsPlaying(false);
      setIsPaused(true);
    }
  }, []);

  const reverse = useCallback(() => {
    if (animationRef.current) {
      animationRef.current.reverse();
      setIsPlaying(true);
      setIsPaused(false);
    }
  }, []);

  const cancel = useCallback(() => {
    if (animationRef.current) {
      animationRef.current.cancel();
      setIsPlaying(false);
      setIsPaused(false);
    }
  }, []);

  const finish = useCallback(() => {
    if (animationRef.current) {
      animationRef.current.finish();
      setIsPlaying(false);
      setIsPaused(false);
    }
  }, []);

  const updateTiming = useCallback((newOptions: UseAnimateOptions) => {
    if (animationRef.current) {
      animationRef.current.updateTiming({
        duration: newOptions.duration ?? duration,
        easing: newOptions.easing ?? easing,
        delay: newOptions.delay ?? delay,
        iterations: newOptions.iterations ?? iterations,
        direction: newOptions.direction ?? direction,
        fill: newOptions.fill ?? fill,
      });
    }
  }, [duration, easing, delay, iterations, direction, fill]);

  // 清理动画
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        animationRef.current.cancel();
      }
    };
  }, []);

  return {
    play,
    pause,
    reverse,
    cancel,
    finish,
    updateTiming,
    animation: animationRef.current,
    isPlaying,
    isPaused,
  };
}
