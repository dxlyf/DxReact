import { RefObject } from 'react';

export function useCombinedRefs<T>(...refs: RefObject<T>[]) {
  return (element: T | null) => {
    refs.forEach(ref => {
      if (typeof ref === 'function') {
        ref(element);
      } else if (ref) {
        (ref as React.MutableRefObject<T | null>).current = element;
      }
    });
  };
}
