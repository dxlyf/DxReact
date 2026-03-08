import React, { useState, useRef } from 'react';
import classNames from 'classnames';
import { useClickOutside } from '../../../hooks/useClickOutside';
import './style/index.scss';

export interface TimePickerProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  disabled?: boolean;
  onChange?: (time: string) => void;
  format?: string;
}

export const TimePicker: React.FC<TimePickerProps> = ({
  value,
  defaultValue,
  placeholder,
  disabled = false,
  onChange,
  format = 'HH:mm:ss',
  className,
  ...props
}) => {
  const [currentValue, setCurrentValue] = useState<string>(value !== undefined ? value : defaultValue || '');
  const [visible, setVisible] = useState(false);
  const timePickerRef = useRef<HTMLDivElement>(null);

  // 使用 useClickOutside hook 处理点击外部关闭
  useClickOutside<HTMLDivElement>(() => {
    setVisible(false);
  }, visible);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentValue(e.target.value);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    onChange?.(e.target.value);
  };

  const timePickerClass = classNames('lyf-time-picker', {
    'lyf-time-picker-disabled': disabled,
  }, className);

  return (
    <div ref={timePickerRef} className={timePickerClass} {...props}>
      <input
        type="time"
        className="lyf-time-picker-input"
        value={currentValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
      />
      <span className="lyf-time-picker-icon">🕒</span>
    </div>
  );
};

export default TimePicker;
