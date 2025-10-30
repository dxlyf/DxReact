import { useState, useCallback, useMemo } from 'react';

// 更完整的类型定义
interface UseControllerValueOptions<T, E = any> {
  /** 受控值 */
  value?: T;
  /** 默认值 */
  defaultValue?: T;
  /** 变化回调 */
  onChange?: (value: T, event?: E, ...args: any[]) => void;
  /** 值转换器 */
  transform?: (value: T, event?: E) => T;
  /** 值验证器 */
  validate?: (value: T) => boolean;
}

interface ControllerValue<T, E = any> {
  // 状态
  value: T | undefined;
  // 方法
  onChange: (value: T, event?: E, ...args: any[]) => void;
  setValue: (value: T | ((prev: T | undefined) => T), event?: E, ...args: any[]) => void;
  reset: () => void;
  // 元信息
  isControlled: boolean;
  defaultValue: T | undefined;
}

export function useControllerValue<T, E = any>(
  options: UseControllerValueOptions<T, E> = {}
): ControllerValue<T, E> {
  const {
    value: controlledValue,
    defaultValue,
    onChange: propsOnChange,
    transform,
    validate,
  } = options;

  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = useState<T | undefined>(defaultValue);

  const value = isControlled ? controlledValue : internalValue;

  const onChange = useCallback((
    newValue: T,
    event?: E,
    ...extraArgs: any[]
  ) => {
    // 值转换
    let finalValue = newValue;
    if (transform) {
      finalValue = transform(newValue, event);
    }

    // 值验证（可选）
    if (validate && !validate(finalValue)) {
      return; // 验证失败不更新
    }

    // 非受控模式下更新内部状态
    if (!isControlled) {
      setInternalValue(finalValue);
    }

    // 调用外部 onChange
    propsOnChange?.(finalValue, event, ...extraArgs);
  }, [isControlled, propsOnChange, transform, validate]);

  const setValue = useCallback((
    newValue: T | ((prev: T | undefined) => T),
    event?: E,
    ...extraArgs: any[]
  ) => {
    if (typeof newValue === 'function') {
      const updater = newValue as (prev: T | undefined) => T;
      const updatedValue = updater(value);
      onChange(updatedValue, event, ...extraArgs);
    } else {
      onChange(newValue, event, ...extraArgs);
    }
  }, [value, onChange]);

  const reset = useCallback(() => {
    const resetValue = defaultValue as T;
    if (!isControlled) {
      setInternalValue(resetValue);
    }
    propsOnChange?.(resetValue);
  }, [defaultValue, isControlled, propsOnChange]);

  const controller = useMemo(() => ({
    value,
    onChange,
    setValue,
    reset,
    isControlled,
    defaultValue,
  }), [value, onChange, setValue, reset, isControlled, defaultValue]);

  return controller;
}