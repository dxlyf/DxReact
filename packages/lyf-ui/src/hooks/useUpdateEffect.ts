import { useEffect, useRef } from 'react';

/**
 * 更新 Hook
 */
export function useUpdateEffect(effect: React.EffectCallback, deps?: React.DependencyList) {
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    return effect();
  }, deps);
}

export default useUpdateEffect;
