import { useState, useCallback, useMemo } from 'react';

interface UseControllerValueProps<T> {
  value?: T;
  defaultValue?: T;
  onChange?: (value: T, ...args: any[]) => void;
}

export function useControllerValue<T>(props: UseControllerValueProps<T>) {
  const {
    value: controlledValue,
    defaultValue,
    onChange: propsOnChange,
  } = props;

  // 判断是否为受控模式
  const isControlled = controlledValue !== undefined;
  
  // 内部状态，用于非受控模式
  const [internalValue, setInternalValue] = useState<T | undefined>(defaultValue);

  // 当前值：受控模式下使用 props.value，非受控模式下使用内部状态
  const value = isControlled ? controlledValue : internalValue;

  // 统一的变化处理函数
  const onChange = useCallback((
    newValue: T,
    ...extraArgs: any[]
  ) => {
    // 非受控模式下更新内部状态
    if (!isControlled) {
      setInternalValue(newValue);
    }

    // 调用外部的 onChange
    propsOnChange?.(newValue, ...extraArgs);
  }, [isControlled, propsOnChange]);

  // 设置值的快捷方法
  const setValue = useCallback((
    newValue: T | ((prev: T | undefined) => T),
    ...extraArgs: any[]
  ) => {
    if (typeof newValue === 'function') {
      const updater = newValue as (prev: T | undefined) => T;
      const updatedValue = updater(value);
      onChange(updatedValue, ...extraArgs);
    } else {
      onChange(newValue, ...extraArgs);
    }
  }, [value, onChange]);

  // 重置为默认值
  const reset = useCallback(() => {
    const resetValue = defaultValue as T;
    if (!isControlled) {
      setInternalValue(resetValue);
    }
    propsOnChange?.(resetValue);
  }, [defaultValue, isControlled, propsOnChange]);

  // 返回的控制器对象
  const controller = useMemo(() => ({
    // 状态
    value,
    // 方法
    onChange,
    setValue,
    reset,
    // 元信息
    isControlled,
    defaultValue,
  }), [value, onChange, setValue, reset, isControlled, defaultValue]);

  return controller;
}

