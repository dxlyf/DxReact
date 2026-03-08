import React, { useState } from 'react';
import classNames from 'classnames';
import './style/index.scss';

export interface RateProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  defaultValue?: number;
  count?: number;
  disabled?: boolean;
  allowHalf?: boolean;
  onChange?: (value: number) => void;
}

export const Rate: React.FC<RateProps> = ({
  value,
  defaultValue = 0,
  count = 5,
  disabled = false,
  allowHalf = false,
  onChange,
  className,
  ...props
}) => {
  const [currentValue, setCurrentValue] = useState<number>(value !== undefined ? value : defaultValue);
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const handleClick = (index: number) => {
    if (disabled) return;
    
    const newValue = index + 1;
    setCurrentValue(newValue);
    onChange?.(newValue);
  };

  const handleMouseEnter = (index: number, event: React.MouseEvent) => {
    if (disabled) return;
    
    if (allowHalf) {
      const rect = (event.target as HTMLElement).getBoundingClientRect();
      const position = event.clientX - rect.left;
      const halfWidth = rect.width / 2;
      const newValue = position < halfWidth ? index + 0.5 : index + 1;
      setHoverValue(newValue);
    } else {
      setHoverValue(index + 1);
    }
  };

  const handleMouseLeave = () => {
    setHoverValue(null);
  };

  const displayValue = hoverValue !== null ? hoverValue : currentValue;

  const rateClass = classNames('lyf-rate', {
    'lyf-rate-disabled': disabled,
  }, className);

  return (
    <div className={rateClass} {...props}>
      {Array.from({ length: count }).map((_, index) => {
        const isFull = displayValue >= index + 1;
        const isHalf = allowHalf && displayValue >= index + 0.5 && displayValue < index + 1;
        
        return (
          <div
            key={index}
            className="lyf-rate-item"
            onClick={() => handleClick(index)}
            onMouseEnter={(e) => handleMouseEnter(index, e)}
            onMouseLeave={handleMouseLeave}
          >
            <div className="lyf-rate-star">
              <div className={classNames('lyf-rate-star-filled', {
                'lyf-rate-star-half': isHalf,
              })}>
                ★
              </div>
              <div className="lyf-rate-star-empty">
                ★
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Rate;
