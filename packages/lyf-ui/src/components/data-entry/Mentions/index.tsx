import React, { useState, useRef } from 'react';
import classNames from 'classnames';
import { useClickOutside } from '../../../hooks/useClickOutside';
import './style/index.scss';

export interface MentionsProps extends React.InputHTMLAttributes<HTMLInputElement> {
  options?: Array<{ value: string; label: string }>;
  onSelect?: (option: { value: string; label: string }) => void;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const Mentions: React.FC<MentionsProps> = ({
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
  const [mentionText, setMentionText] = useState('');
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

    // 检测 @ 符号
    const lastAtIndex = inputValue.lastIndexOf('@');
    if (lastAtIndex !== -1) {
      const textAfterAt = inputValue.substring(lastAtIndex + 1);
      setMentionText(textAfterAt);
      
      // 过滤选项
      const filtered = options.filter(option =>
        option.label.toLowerCase().includes(textAfterAt.toLowerCase()) ||
        option.value.toLowerCase().includes(textAfterAt.toLowerCase())
      );
      setFilteredOptions(filtered);
      setVisible(filtered.length > 0);
    } else {
      setVisible(false);
    }
  };

  const handleSelect = (option: { value: string; label: string }) => {
    const lastAtIndex = value.lastIndexOf('@');
    if (lastAtIndex !== -1) {
      const newValue = value.substring(0, lastAtIndex) + `@${option.label} `;
      setValue(newValue);
      setVisible(false);
      onSelect?.(option);
    }
  };

  const mentionsClass = classNames('lyf-mentions', {
    'lyf-mentions-disabled': disabled,
  }, className);

  return (
    <div ref={containerRef} className={mentionsClass}>
      <input
        ref={inputRef}
        type="text"
        className="lyf-mentions-input"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        {...props}
      />
      {visible && filteredOptions.length > 0 && (
        <div className="lyf-mentions-dropdown">
          <ul className="lyf-mentions-options">
            {filteredOptions.map((option, index) => (
              <li
                key={index}
                className="lyf-mentions-option"
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

export default Mentions;
