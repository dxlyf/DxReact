import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * 可控状态 Hook - 处理受控和非受控组件
 */
export function useControllableValue<T = any>(
  props: {
    value?: T;
    defaultValue?: T;
    onChange?: (value: T) => void;
  },
  options?: {
    defaultValue?: T;
    valuePropName?: string;
    trigger?: string;
  }
) {

  const { defaultValue,valuePropName='value',trigger='onChange' } = options || {};
  const lastOptions=useRef({ defaultValue,valuePropName,trigger })
  lastOptions.current.valuePropName=valuePropName
  lastOptions.current.trigger=trigger
  const propValue=props[valuePropName]
  const onChange=props[trigger]
  const isControlled = propValue !== undefined;
  const [stateValue, setStateValue] = useState<T>(() => {
    if (isControlled) {
      return propValue;
    }
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    return undefined as any;
  });
  const value=isControlled?propValue:stateValue
  const handleUpdate = useCallback(
    (val: T|((prev:T)=>T)) => {
      const newVal=typeof val === 'function' ? val(value) : val
      if (!isControlled) {
        setStateValue(newVal);
      }
      onChange?.(newVal);
    },
    [onChange, value]
  );

  return [
    value,
    handleUpdate,
  ] as const;
}

export default useControllableValue;
