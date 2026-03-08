import React, { useState } from 'react';
import classNames from 'classnames';
import './style/index.scss';

export interface RadioProps extends React.InputHTMLAttributes<HTMLInputElement> {
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  children?: React.ReactNode;
}

export interface RadioGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string | number;
  defaultValue?: string | number;
  disabled?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  children?: React.ReactNode;
}

export const Radio: React.FC<RadioProps> = ({
  checked,
  defaultChecked = false,
  disabled = false,
  onChange,
  children,
  className,
  ...props
}) => {
  const [isChecked, setIsChecked] = useState(checked !== undefined ? checked : defaultChecked);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsChecked(e.target.checked);
    onChange?.(e);
  };

  const radioClass = classNames('lyf-radio', {
    'lyf-radio-disabled': disabled,
  }, className);

  return (
    <label className={radioClass}>
      <input
        type="radio"
        checked={checked !== undefined ? checked : isChecked}
        disabled={disabled}
        onChange={handleChange}
        {...props}
      />
      <span className="lyf-radio-inner"></span>
      {children && <span className="lyf-radio-label">{children}</span>}
    </label>
  );
};

export const RadioGroup: React.FC<RadioGroupProps> = ({
  value,
  defaultValue,
  disabled = false,
  onChange,
  children,
  className,
  ...props
}) => {
  const [currentValue, setCurrentValue] = useState(value !== undefined ? value : defaultValue);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentValue(e.target.value);
    onChange?.(e);
  };

  const groupClass = classNames('lyf-radio-group', className);

  return (
    <div className={groupClass} {...props}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && (child.type as any) === Radio) {
          return React.cloneElement(child as React.ReactElement, {
            disabled: disabled || (child.props as RadioProps).disabled,
            checked: currentValue === (child.props as any).value,
            onChange: handleChange,
          });
        }
        return child;
      })}
    </div>
  );
};

Radio.Group = RadioGroup;

export default Radio;
