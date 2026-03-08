import React, { useState, useEffect } from 'react';
import classNames from 'classnames';
import './style/index.scss';

export type InputNumberSize = 'small' | 'default' | 'large';

export interface InputNumberProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  precision?: number;
  size?: InputNumberSize;
  disabled?: boolean;
  onChange?: (value: number | null) => void;
}

export const InputNumber: React.FC<InputNumberProps> = ({
  value,
  defaultValue = 0,
  min,
  max,
  step = 1,
  precision,
  size = 'default',
  disabled = false,
  onChange,
  className,
  ...props
}) => {
  const [currentValue, setCurrentValue] = useState<number | null>(value !== undefined ? value : defaultValue);

  useEffect(() => {
    if (value !== undefined) {
      setCurrentValue(value);
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    if (inputValue === '') {
      setCurrentValue(null);
      onChange?.(null);
      return;
    }

    const numValue = parseFloat(inputValue);
    if (!isNaN(numValue)) {
      let newValue = numValue;
      if (min !== undefined) {
        newValue = Math.max(min, newValue);
      }
      if (max !== undefined) {
        newValue = Math.min(max, newValue);
      }
      if (precision !== undefined) {
        newValue = parseFloat(newValue.toFixed(precision));
      }
      setCurrentValue(newValue);
      onChange?.(newValue);
    }
  };

  const handleStep = (stepValue: number) => {
    if (disabled) return;

    let newValue = currentValue !== null ? currentValue : 0;
    newValue += stepValue;

    if (min !== undefined) {
      newValue = Math.max(min, newValue);
    }
    if (max !== undefined) {
      newValue = Math.min(max, newValue);
    }
    if (precision !== undefined) {
      newValue = parseFloat(newValue.toFixed(precision));
    }

    setCurrentValue(newValue);
    onChange?.(newValue);
  };

  const inputNumberClass = classNames('lyf-input-number', {
    [`lyf-input-number-${size}`]: true,
    'lyf-input-number-disabled': disabled,
  }, className);

  return (
    <div className={inputNumberClass} {...props}>
      <button
        className="lyf-input-number-button lyf-input-number-button-up"
        onClick={() => handleStep(step)}
        disabled={disabled || (max !== undefined && currentValue !== null && currentValue >= max)}
      >
        ↑
      </button>
      <input
        type="number"
        className="lyf-input-number-input"
        value={currentValue !== null ? currentValue : ''}
        onChange={handleChange}
        disabled={disabled}
        min={min}
        max={max}
        step={step}
      />
      <button
        className="lyf-input-number-button lyf-input-number-button-down"
        onClick={() => handleStep(-step)}
        disabled={disabled || (min !== undefined && currentValue !== null && currentValue <= min)}
      >
        ↓
      </button>
    </div>
  );
};

export default InputNumber;
