import { useEffect, useRef } from 'react';

type EventHandler = (event: MouseEvent | TouchEvent) => void;

/**
 * 检测点击是否在元素外部
 */
export function useClickOutside<T extends HTMLElement = HTMLElement>(
  handler: EventHandler,
  shouldListen: boolean = true
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!shouldListen) return;

    const listener = (event: MouseEvent | TouchEvent) => {
      const el = ref.current;
      if (!el || el.contains((event as MouseEvent).target as Node)) {
        return;
      }
      handler(event);
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [handler, shouldListen]);

  return ref;
}

export default useClickOutside;
