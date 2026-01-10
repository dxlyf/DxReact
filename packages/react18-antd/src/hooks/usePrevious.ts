import * as React from 'react';
import { useEffect, useRef } from 'react';
export const usePrevious = <T>(state: T): T | undefined => {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = state;
  });

  return ref.current;
};

// function usePrevious<T>(value: T) {
//   const ref = React.useRef({ value, previous: value });

//   // We compare values before making an update to ensure that
//   // a change has been made. This ensures the previous value is
//   // persisted correctly between renders.
//   return React.useMemo(() => {
//     if (ref.current.value !== value) {
//       ref.current.previous = ref.current.value;
//       ref.current.value = value;
//     }
//     return ref.current.previous;
//   }, [value]);
// }

export { usePrevious };