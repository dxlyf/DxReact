import { useMemo, useRef, useState } from 'react';
import type { SetStateAction } from 'react';
import useMemoizedFn from './useMemoizedFn';


export interface Options<T> {
  defaultValue?: T;
  defaultValuePropName?: string;
  valuePropName?: string;
  trigger?: string;
    strict?:boolean
}

export type Props = Record<string, any>;

export interface StandardProps<T> {
  value: T;
  defaultValue?: T;
  onChange: (val: T) => void;
}

function useControllableValue<T = any>(
  props: StandardProps<T>,
): [T, (v: SetStateAction<T>) => void];
function useControllableValue<T = any>(
  props: Props,
  options?: Options<T>,
): [T, (v: SetStateAction<T>, ...args: any[]) => void];
function useControllableValue<T = any>(defaultProps: Props, options: Options<T> = {}) {
  const props = defaultProps ?? {};

  const {
    strict=true,
    defaultValue,
    defaultValuePropName = 'defaultValue',
    valuePropName = 'value',
    trigger = 'onChange',
  } = options;

  const value = props[valuePropName] as T;
  const isControlled = strict?Object.prototype.hasOwnProperty.call(props, valuePropName):props[valuePropName]!==undefined;

  const initialValue = useMemo(() => {
    if (isControlled) {
      return value;
    }
    if (Object.prototype.hasOwnProperty.call(props, defaultValuePropName)) {
      return props[defaultValuePropName];
    }
    return defaultValue;
  }, []);

  const stateRef = useRef(initialValue);
  if (isControlled) {
    stateRef.current = value;
  }

  const [,update] = useState(false);

  function setState(v: SetStateAction<T>, ...args: any[]) {
    const r = typeof v==='function' ? (v as Function)(stateRef.current) : v;

    if (!isControlled) {
      stateRef.current = r;
      update(v=>!v);
    }
    if (props[trigger]) {
      props[trigger](r, ...args);
    }
  }

  return [stateRef.current, useMemoizedFn(setState)] as const;
}

export default useControllableValue;
