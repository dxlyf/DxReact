import React, { useState, useRef } from 'react';
import classNames from 'classnames';
import { useClickOutside } from '../../../hooks/useClickOutside';
import './style/index.scss';

export interface ColorPickerProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string;
  defaultValue?: string;
  disabled?: boolean;
  onChange?: (color: string) => void;
  className?: string;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  value,
  defaultValue = '#1890ff',
  disabled = false,
  onChange,
  className,
  ...props
}) => {
  const [currentValue, setCurrentValue] = useState<string>(value !== undefined ? value : defaultValue);
  const [visible, setVisible] = useState(false);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  // 使用 useClickOutside hook 处理点击外部关闭
  useClickOutside<HTMLDivElement>(() => {
    setVisible(false);
  }, visible && !disabled);

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentValue(e.target.value);
    onChange?.(e.target.value);
  };

  const handleColorClick = (color: string) => {
    setCurrentValue(color);
    setVisible(false);
    onChange?.(color);
  };

  const colorPickerClass = classNames('lyf-color-picker', {
    'lyf-color-picker-disabled': disabled,
  }, className);

  const presetColors = [
    '#1890ff', '#52c41a', '#faad14', '#f5222d',
    '#722ed1', '#13c2c2', '#eb2f96', '#fa8c16',
    '#a0d911', '#2f54eb', '#fa541c', '#1890ff',
  ];

  return (
    <div ref={colorPickerRef} className={colorPickerClass} {...props}>
      <div
        className="lyf-color-picker-trigger"
        onClick={() => !disabled && setVisible(!visible)}
      >
        <div 
          className="lyf-color-picker-color" 
          style={{ backgroundColor: currentValue }}
        ></div>
        <input
          type="text"
          className="lyf-color-picker-input"
          value={currentValue}
          onChange={handleColorChange}
          disabled={disabled}
        />
      </div>
      {visible && !disabled && (
        <div className="lyf-color-picker-panel">
          <div className="lyf-color-picker-colors">
            {presetColors.map((color, index) => (
              <div
                key={index}
                className={classNames('lyf-color-picker-color-item', {
                  'lyf-color-picker-color-item-active': currentValue === color,
                })}
                style={{ backgroundColor: color }}
                onClick={() => handleColorClick(color)}
              ></div>
            ))}
          </div>
          <div className="lyf-color-picker-custom">
            <input
              type="color"
              className="lyf-color-picker-color-input"
              value={currentValue}
              onChange={handleColorChange}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ColorPicker;
