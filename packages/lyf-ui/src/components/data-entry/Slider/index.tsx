import React, { useState, useRef, useEffect } from 'react';
import classNames from 'classnames';
import './style/index.scss';

export interface SliderProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number | [number, number];
  defaultValue?: number | [number, number];
  min?: number;
  max?: number;
  step?: number;
  range?: boolean;
  vertical?: boolean;
  disabled?: boolean;
  onChange?: (value: number | [number, number]) => void;
  showTooltip?: boolean;
}

export const Slider: React.FC<SliderProps> = ({
  value,
  defaultValue = 0,
  min = 0,
  max = 100,
  step = 1,
  range = false,
  vertical = false,
  disabled = false,
  onChange,
  showTooltip = true,
  className,
  ...props
}) => {
  const [currentValue, setCurrentValue] = useState<number | [number, number]>(value !== undefined ? value : defaultValue);
  const [dragging, setDragging] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value !== undefined) {
      setCurrentValue(value);
    }
  }, [value]);

  const handleMouseDown = (e: React.MouseEvent, index: number) => {
    if (disabled) return;
    setDragging(true);
    setActiveIndex(index);
    handleMouseMove(e);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging || disabled) return;

    if (sliderRef.current) {
      const rect = sliderRef.current.getBoundingClientRect();
      let percentage;
      if (vertical) {
        percentage = 1 - (e.clientY - rect.top) / rect.height;
      } else {
        percentage = (e.clientX - rect.left) / rect.width;
      }
      
      percentage = Math.max(0, Math.min(1, percentage));
      const newValue = Math.round((min + percentage * (max - min)) / step) * step;

      if (range) {
        const values = [...(currentValue as [number, number])];
        values[activeIndex] = newValue;
        // 确保值的顺序正确
        if (values[0] > values[1]) {
          [values[0], values[1]] = [values[1], values[0]];
          setActiveIndex(activeIndex === 0 ? 1 : 0);
        }
        setCurrentValue(values);
        onChange?.(values);
      } else {
        setCurrentValue(newValue);
        onChange?.(newValue);
      }
    }
  };

  const handleMouseUp = () => {
    setDragging(false);
  };

  useEffect(() => {
    if (dragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, currentValue, activeIndex]);

  const getPercentage = (val: number) => {
    return ((val - min) / (max - min)) * 100;
  };

  const sliderClass = classNames('lyf-slider', {
    'lyf-slider-vertical': vertical,
    'lyf-slider-disabled': disabled,
  }, className);

  return (
    <div className={sliderClass} {...props}>
      <div className="lyf-slider-track" ref={sliderRef}>
        <div
          className="lyf-slider-track-filled"
          style={{
            [vertical ? 'height' : 'width']: range
              ? `${getPercentage((currentValue as [number, number])[1]) - getPercentage((currentValue as [number, number])[0])}%`
              : `${getPercentage(currentValue as number)}%`,
            [vertical ? 'bottom' : 'left']: range
              ? `${getPercentage((currentValue as [number, number])[0])}%`
              : '0%',
          }}
        ></div>
        {range ? (
          [0, 1].map((index) => (
            <div
              key={index}
              className="lyf-slider-handle"
              style={{
                [vertical ? 'bottom' : 'left']: `${getPercentage((currentValue as [number, number])[index])}%`,
              }}
              onMouseDown={(e) => handleMouseDown(e, index)}
            >
              {showTooltip && (
                <div className="lyf-slider-tooltip">
                  {(currentValue as [number, number])[index]}
                </div>
              )}
            </div>
          ))
        ) : (
          <div
            className="lyf-slider-handle"
            style={{
              [vertical ? 'bottom' : 'left']: `${getPercentage(currentValue as number)}%`,
            }}
            onMouseDown={(e) => handleMouseDown(e, 0)}
          >
            {showTooltip && (
              <div className="lyf-slider-tooltip">
                {currentValue}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Slider;
