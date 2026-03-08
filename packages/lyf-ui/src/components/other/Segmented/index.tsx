import React, { useState, ReactNode } from 'react';
import classNames from 'classnames';
import './style/index.scss';

export interface SegmentedOption {
  label: ReactNode;
  value: string;
  disabled?: boolean;
}

export interface SegmentedProps extends React.HTMLAttributes<HTMLDivElement> {
  options: SegmentedOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  className?: string;
}

export const Segmented: React.FC<SegmentedProps> = ({
  options,
  value,
  defaultValue,
  onChange,
  className,
  ...props
}) => {
  const [selectedValue, setSelectedValue] = useState<string>(
    value !== undefined ? value : defaultValue || (options[0]?.value || '')
  );

  const handleSelect = (option: SegmentedOption) => {
    if (option.disabled) return;
    
    if (value === undefined) {
      setSelectedValue(option.value);
    }
    onChange?.(option.value);
  };

  const currentValue = value !== undefined ? value : selectedValue;

  const segmentedClass = classNames('lyf-segmented', className);

  return (
    <div className={segmentedClass} {...props}>
      {options.map(option => (
        <button
          key={option.value}
          className={classNames('lyf-segmented-item', {
            'lyf-segmented-item-active': currentValue === option.value,
            'lyf-segmented-item-disabled': option.disabled,
          })}
          onClick={() => handleSelect(option)}
          disabled={option.disabled}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

export default Segmented;
