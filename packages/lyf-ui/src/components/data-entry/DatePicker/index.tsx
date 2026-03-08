import React, { useState, useRef } from 'react';
import classNames from 'classnames';
import { useClickOutside } from '../../../hooks/useClickOutside';
import './style/index.scss';

export interface DatePickerProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  disabled?: boolean;
  onChange?: (date: string) => void;
  format?: string;
}

export interface RangePickerProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: [string, string];
  defaultValue?: [string, string];
  placeholder?: [string, string];
  disabled?: boolean;
  onChange?: (dates: [string, string]) => void;
  format?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  defaultValue,
  placeholder,
  disabled = false,
  onChange,
  format = 'YYYY-MM-DD',
  className,
  ...props
}) => {
  const [currentValue, setCurrentValue] = useState<string>(value !== undefined ? value : defaultValue || '');
  const [visible, setVisible] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);

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

  const datePickerClass = classNames('lyf-date-picker', {
    'lyf-date-picker-disabled': disabled,
  }, className);

  return (
    <div ref={datePickerRef} className={datePickerClass} {...props}>
      <input
        type="text"
        className="lyf-date-picker-input"
        value={currentValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
      />
      <span className="lyf-date-picker-icon">📅</span>
    </div>
  );
};

export const RangePicker: React.FC<RangePickerProps> = ({
  value,
  defaultValue,
  placeholder = ['开始日期', '结束日期'],
  disabled = false,
  onChange,
  format = 'YYYY-MM-DD',
  className,
  ...props
}) => {
  const [currentValue, setCurrentValue] = useState<[string, string]>(value !== undefined ? value : defaultValue || ['', '']);
  const [visible, setVisible] = useState(false);
  const rangePickerRef = useRef<HTMLDivElement>(null);

  // 使用 useClickOutside hook 处理点击外部关闭
  useClickOutside<HTMLDivElement>(() => {
    setVisible(false);
  }, visible);

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const newValues = [...currentValue];
    newValues[index] = e.target.value;
    setCurrentValue(newValues);
  };

  const handleBlur = () => {
    onChange?.(currentValue);
  };

  const rangePickerClass = classNames('lyf-date-picker-range', {
    'lyf-date-picker-disabled': disabled,
  }, className);

  return (
    <div ref={rangePickerRef} className={rangePickerClass} {...props}>
      <input
        type="text"
        className="lyf-date-picker-input"
        value={currentValue[0]}
        onChange={(e) => handleChange(0, e)}
        onBlur={handleBlur}
        placeholder={placeholder[0]}
        disabled={disabled}
      />
      <span className="lyf-date-picker-separator">至</span>
      <input
        type="text"
        className="lyf-date-picker-input"
        value={currentValue[1]}
        onChange={(e) => handleChange(1, e)}
        onBlur={handleBlur}
        placeholder={placeholder[1]}
        disabled={disabled}
      />
      <span className="lyf-date-picker-icon">📅</span>
    </div>
  );
};

DatePicker.RangePicker = RangePicker;

export default DatePicker;
