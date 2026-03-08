import { useRef, useEffect, useState, useCallback, ReactNode } from 'react';

export interface UseTransitionOptions {
  name?: string;
  duration?: number;
  appear?: boolean;
  onEnter?: (el: HTMLElement) => void;
  onEntering?: (el: HTMLElement) => void;
  onEntered?: (el: HTMLElement) => void;
  onLeave?: (el: HTMLElement) => void;
  onLeaving?: (el: HTMLElement) => void;
  onLeft?: (el: HTMLElement) => void;
}

export function useTransition(
  isVisible: boolean,
  options: UseTransitionOptions = {}
) {
  const {
    name = 'transition',
    duration = 300,
    appear = false,
    onEnter,
    onEntering,
    onEntered,
    onLeave,
    onLeaving,
    onLeft,
  } = options;

  const [isMounted, setIsMounted] = useState(isVisible || appear);
  const [isAnimating, setIsAnimating] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (isVisible) {
      setIsMounted(true);
      setTimeout(() => {
        if (ref.current) {
          onEnter?.(ref.current);
          ref.current.classList.add(`${name}-enter-active`);
          ref.current.classList.add(`${name}-enter-to`);
          onEntering?.(ref.current);
          
          setTimeout(() => {
            if (ref.current) {
              ref.current.classList.remove(`${name}-enter`, `${name}-enter-active`);
              onEntered?.(ref.current);
              setIsAnimating(false);
            }
          }, duration);
        }
      }, 0);
    } else {
      if (ref.current) {
        setIsAnimating(true);
        onLeave?.(ref.current);
        ref.current.classList.add(`${name}-leave-active`);
        ref.current.classList.add(`${name}-leave-to`);
        onLeaving?.(ref.current);
        
        setTimeout(() => {
          if (ref.current) {
            ref.current.classList.remove(`${name}-leave`, `${name}-leave-active`);
            onLeft?.(ref.current);
            setIsMounted(false);
            setIsAnimating(false);
          }
        }, duration);
      }
    }
  }, [isVisible, name, duration, onEnter, onEntering, onEntered, onLeave, onLeaving, onLeft]);

  const getTransitionClassNames = useCallback(() => {
    const baseClass = `${name}-enter`;
    return {
      className: isVisible ? baseClass : `${name}-leave`,
    };
  }, [isVisible, name]);

  return {
    ref,
    isMounted,
    isAnimating,
    ...getTransitionClassNames(),
  };
}

// 示例用法
/*
function TransitionExample() {
  const [isVisible, setIsVisible] = useState(false);
  const { ref, isMounted, className } = useTransition(isVisible, {
    name: 'fade',
    duration: 300,
  });

  return (
    <div>
      <button onClick={() => setIsVisible(!isVisible)}>
        Toggle
      </button>
      {isMounted && (
        <div ref={ref} className={className}>
          Animated Element
        </div>
      )}
    </div>
  );
}
*/
