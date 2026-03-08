import React, { useState, useRef } from 'react';
import classNames from 'classnames';
import { useClickOutside } from '../../../hooks/useClickOutside';
import './style/index.scss';

export interface CascaderOption {
  value: string | number;
  label: React.ReactNode;
  children?: CascaderOption[];
  disabled?: boolean;
}

export interface CascaderProps extends React.HTMLAttributes<HTMLDivElement> {
  options: CascaderOption[];
  value?: (string | number)[];
  defaultValue?: (string | number)[];
  placeholder?: string;
  disabled?: boolean;
  onChange?: (value: (string | number)[]) => void;
}

export const Cascader: React.FC<CascaderProps> = ({
  options,
  value,
  defaultValue,
  placeholder,
  disabled = false,
  onChange,
  className,
  ...props
}) => {
  const [currentValue, setCurrentValue] = useState<(string | number)[]>(value !== undefined ? value : defaultValue || []);
  const [visible, setVisible] = useState(false);
  const [activePath, setActivePath] = useState<(string | number)[]>([]);
  const cascaderRef = useRef<HTMLDivElement>(null);

  // 使用 useClickOutside hook 处理点击外部关闭
  useClickOutside<HTMLDivElement>(() => {
    setVisible(false);
  }, visible);

  const handleSelect = (option: CascaderOption, level: number) => {
    const newPath = [...activePath.slice(0, level), option.value];
    
    if (option.children && option.children.length > 0) {
      setActivePath(newPath);
    } else {
      setCurrentValue(newPath);
      setVisible(false);
      onChange?.(newPath);
    }
  };

  const getOptionsByPath = (path: (string | number)[]): CascaderOption[] => {
    let currentOptions = options;
    for (const value of path) {
      const option = currentOptions.find(opt => opt.value === value);
      if (option && option.children) {
        currentOptions = option.children;
      } else {
        break;
      }
    }
    return currentOptions;
  };

  const cascaderClass = classNames('lyf-cascader', {
    'lyf-cascader-disabled': disabled,
  }, className);

  return (
    <div ref={cascaderRef} className={cascaderClass} {...props}>
      <div
        className={classNames('lyf-cascader-select', {
          'lyf-cascader-select-has-value': currentValue.length > 0,
        })}
        onClick={() => !disabled && setVisible(!visible)}
      >
        {currentValue.length > 0 ? (
          <span className="lyf-cascader-value">{currentValue.join(' / ')}</span>
        ) : (
          <span className="lyf-cascader-placeholder">{placeholder}</span>
        )}
        <span className="lyf-cascader-arrow">▼</span>
      </div>
      {visible && (
        <div className="lyf-cascader-dropdown">
          <div className="lyf-cascader-panels">
            {activePath.map((_, index) => {
              const panelOptions = getOptionsByPath(activePath.slice(0, index));
              return (
                <div key={index} className="lyf-cascader-panel">
                  <ul className="lyf-cascader-options">
                    {panelOptions.map(option => (
                      <li
                        key={option.value}
                        className={classNames('lyf-cascader-option', {
                          'lyf-cascader-option-active': activePath[index] === option.value,
                          'lyf-cascader-option-disabled': option.disabled,
                        })}
                        onClick={() => !option.disabled && handleSelect(option, index)}
                      >
                        {option.label}
                        {option.children && option.children.length > 0 && (
                          <span className="lyf-cascader-option-arrow">▶</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
            {/* 当前面板 */}
            <div className="lyf-cascader-panel">
              <ul className="lyf-cascader-options">
                {getOptionsByPath(activePath).map(option => (
                  <li
                    key={option.value}
                    className={classNames('lyf-cascader-option', {
                      'lyf-cascader-option-disabled': option.disabled,
                    })}
                    onClick={() => !option.disabled && handleSelect(option, activePath.length)}
                  >
                    {option.label}
                    {option.children && option.children.length > 0 && (
                      <span className="lyf-cascader-option-arrow">▶</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cascader;
