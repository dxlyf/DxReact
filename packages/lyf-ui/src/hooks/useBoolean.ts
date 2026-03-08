import { useState, useCallback } from 'react';

/**
 * 布尔状态 Hook
 */
export function useBoolean(defaultValue: boolean = false) {
  const [value, setValue] = useState(defaultValue);

  const setTrue = useCallback(() => setValue(true), []);
  const setFalse = useCallback(() => setValue(false), []);
  const toggle = useCallback(() => setValue((v) => !v), []);

  return {
    value,
    setTrue,
    setFalse,
    toggle,
  };
}

export default useBoolean;
