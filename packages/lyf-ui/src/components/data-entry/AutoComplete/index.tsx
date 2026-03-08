import React, { useState, useRef } from 'react';
import classNames from 'classnames';
import { useClickOutside } from '../../../hooks/useClickOutside';
import './style/index.scss';

export interface AutoCompleteProps extends React.InputHTMLAttributes<HTMLInputElement> {
  options?: Array<{ value: string; label: string }>;
  onSelect?: (option: { value: string; label: string }) => void;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const AutoComplete: React.FC<AutoCompleteProps> = ({
  options = [],
  onSelect,
  onChange,
  placeholder,
  disabled = false,
  className,
  ...props
}) => {
  const [value, setValue] = useState(props.defaultValue || '');
  const [visible, setVisible] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState<Array<{ value: string; label: string }>>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 使用 useClickOutside hook 处理点击外部关闭
  useClickOutside<HTMLDivElement>(() => {
    setVisible(false);
  }, visible);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setValue(inputValue);
    onChange?.(e);

    // 过滤选项
    if (inputValue) {
      const filtered = options.filter(option =>
        option.label.toLowerCase().includes(inputValue.toLowerCase()) ||
        option.value.toLowerCase().includes(inputValue.toLowerCase())
      );
      setFilteredOptions(filtered);
      setVisible(filtered.length > 0);
    } else {
      setFilteredOptions([]);
      setVisible(false);
    }
  };

  const handleSelect = (option: { value: string; label: string }) => {
    setValue(option.label);
    setVisible(false);
    onSelect?.(option);
  };

  const autoCompleteClass = classNames('lyf-auto-complete', {
    'lyf-auto-complete-disabled': disabled,
  }, className);

  return (
    <div ref={containerRef} className={autoCompleteClass}>
      <input
        ref={inputRef}
        type="text"
        className="lyf-auto-complete-input"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        {...props}
      />
      {visible && filteredOptions.length > 0 && (
        <div className="lyf-auto-complete-dropdown">
          <ul className="lyf-auto-complete-options">
            {filteredOptions.map((option, index) => (
              <li
                key={index}
                className="lyf-auto-complete-option"
                onClick={() => handleSelect(option)}
              >
                {option.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AutoComplete;
