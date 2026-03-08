import React, { useState } from 'react';
import classNames from 'classnames';
import './style/index.scss';

export interface SwitchProps extends React.HTMLAttributes<HTMLDivElement> {
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
  size?: 'small' | 'default' | 'large';
  checkedChildren?: React.ReactNode;
  unCheckedChildren?: React.ReactNode;
}

export const Switch: React.FC<SwitchProps> = ({
  checked,
  defaultChecked = false,
  disabled = false,
  onChange,
  size = 'default',
  checkedChildren,
  unCheckedChildren,
  className,
  ...props
}) => {
  const [isChecked, setIsChecked] = useState(checked !== undefined ? checked : defaultChecked);

  const handleClick = () => {
    if (disabled) return;
    
    const newChecked = !isChecked;
    setIsChecked(newChecked);
    onChange?.(newChecked);
  };

  const switchClass = classNames('lyf-switch', {
    [`lyf-switch-${size}`]: true,
    'lyf-switch-checked': isChecked,
    'lyf-switch-disabled': disabled,
  }, className);

  return (
    <div
      className={switchClass}
      onClick={handleClick}
      {...props}
    >
      <div className="lyf-switch-inner">
        {isChecked ? checkedChildren : unCheckedChildren}
      </div>
      <div className="lyf-switch-handle"></div>
    </div>
  );
};

export default Switch;
