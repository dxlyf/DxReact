import React, { useState } from 'react';
import classNames from 'classnames';
import './style/index.scss';

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  children?: React.ReactNode;
}

export interface CheckboxGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: (string | number)[];
  defaultValue?: (string | number)[];
  disabled?: boolean;
  onChange?: (values: (string | number)[]) => void;
  children?: React.ReactNode;
}

export const Checkbox: React.FC<CheckboxProps> = ({
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

  const checkboxClass = classNames('lyf-checkbox', {
    'lyf-checkbox-disabled': disabled,
  }, className);

  return (
    <label className={checkboxClass}>
      <input
        type="checkbox"
        checked={checked !== undefined ? checked : isChecked}
        disabled={disabled}
        onChange={handleChange}
        {...props}
      />
      <span className="lyf-checkbox-inner"></span>
      {children && <span className="lyf-checkbox-label">{children}</span>}
    </label>
  );
};

export const CheckboxGroup: React.FC<CheckboxGroupProps> = ({
  value,
  defaultValue = [],
  disabled = false,
  onChange,
  children,
  className,
  ...props
}) => {
  const [values, setValues] = useState(value !== undefined ? value : defaultValue);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checkboxValue = e.target.value;
    let newValues: (string | number)[];
    
    if (e.target.checked) {
      newValues = [...values, checkboxValue];
    } else {
      newValues = values.filter(v => v !== checkboxValue);
    }
    
    setValues(newValues);
    onChange?.(newValues);
  };

  const groupClass = classNames('lyf-checkbox-group', className);

  return (
    <div className={groupClass} {...props}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && (child.type as any) === Checkbox) {
          return React.cloneElement(child as React.ReactElement, {
            disabled: disabled || (child.props as CheckboxProps).disabled,
            checked: values.includes((child.props as any).value),
            onChange: handleChange,
          });
        }
        return child;
      })}
    </div>
  );
};

Checkbox.Group = CheckboxGroup;

export default Checkbox;
