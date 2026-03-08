import React, { useState, useRef } from 'react';
import classNames from 'classnames';
import { useClickOutside } from '../../../hooks/useClickOutside';
import './style/index.scss';

export interface OptionProps extends React.HTMLAttributes<HTMLOptionElement> {
  value: string | number;
  label: React.ReactNode;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  mode?: 'single' | 'multiple';
  options?: Array<{ value: string | number; label: React.ReactNode; disabled?: boolean }>;
  placeholder?: string;
  disabled?: boolean;
  onChange?: (value: string | number | (string | number)[]) => void;
  children?: React.ReactNode;
}

export const Option: React.FC<OptionProps> = ({
  value,
  label,
  disabled = false,
  className,
  ...props
}) => {
  return (
    <option
      value={value}
      disabled={disabled}
      className={className}
      {...props}
    >
      {label}
    </option>
  );
};

export const Select: React.FC<SelectProps> = ({
  mode = 'single',
  options = [],
  placeholder,
  disabled = false,
  onChange,
  children,
  className,
  ...props
}) => {
  const [value, setValue] = useState(props.value || props.defaultValue);
  const [visible, setVisible] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  // 使用 useClickOutside hook 处理点击外部关闭
  useClickOutside<HTMLDivElement>(() => {
    setVisible(false);
  }, visible);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    let newValue: string | number | (string | number)[];
    if (mode === 'multiple') {
      const selectElement = e.target as HTMLSelectElement;
      newValue = Array.from(selectElement.selectedOptions).map(option => option.value);
    } else {
      newValue = e.target.value;
    }
    setValue(newValue);
    onChange?.(newValue);
  };

  const selectClass = classNames('lyf-select', {
    'lyf-select-multiple': mode === 'multiple',
    'lyf-select-disabled': disabled,
  }, className);

  return (
    <div ref={selectRef} className={selectClass}>
      <select
        className="lyf-select-select"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        multiple={mode === 'multiple'}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option, index) => (
          <Option
            key={index}
            value={option.value}
            label={option.label}
            disabled={option.disabled}
          />
        ))}
        {children}
      </select>
    </div>
  );
};

Select.Option = Option;

export default Select;
