import React, { useState } from 'react';
import classNames from 'classnames';
import './style/index.scss';

export type InputSize = 'small' | 'default' | 'large';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  size?: InputSize;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  addonBefore?: React.ReactNode;
  addonAfter?: React.ReactNode;
  disabled?: boolean;
  error?: boolean;
}

export interface PasswordProps extends InputProps {
  visibilityToggle?: boolean;
}

export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  size?: InputSize;
  rows?: number;
  disabled?: boolean;
  error?: boolean;
}

export interface SearchProps extends InputProps {
  onSearch?: (value: string) => void;
  enterButton?: boolean | React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  size = 'default',
  prefix,
  suffix,
  addonBefore,
  addonAfter,
  disabled = false,
  error = false,
  className,
  ...props
}) => {
  const inputClass = classNames('lyf-input-wrapper', {
    [`lyf-input-wrapper-${size}`]: true,
    'lyf-input-wrapper-disabled': disabled,
    'lyf-input-wrapper-error': error,
  }, className);

  return (
    <div className={inputClass}>
      {addonBefore && <div className="lyf-input-addon lyf-input-addon-before">{addonBefore}</div>}
      <div className="lyf-input-inner">
        {prefix && <div className="lyf-input-prefix">{prefix}</div>}
        <input
          className="lyf-input"
          disabled={disabled}
          {...props}
        />
        {suffix && <div className="lyf-input-suffix">{suffix}</div>}
      </div>
      {addonAfter && <div className="lyf-input-addon lyf-input-addon-after">{addonAfter}</div>}
    </div>
  );
};

export const Password: React.FC<PasswordProps> = ({
  visibilityToggle = true,
  className,
  ...props
}) => {
  const [visible, setVisible] = useState(false);

  const handleToggleVisibility = () => {
    setVisible(!visible);
  };

  const suffix = visibilityToggle ? (
    <div className="lyf-input-password-icon" onClick={handleToggleVisibility}>
      {visible ? '👁️' : '👁️‍🗨️'}
    </div>
  ) : props.suffix;

  return (
    <Input
      {...props}
      type={visible ? 'text' : 'password'}
      suffix={suffix}
      className={className}
    />
  );
};

export const TextArea: React.FC<TextAreaProps> = ({
  size = 'default',
  rows = 3,
  disabled = false,
  error = false,
  className,
  ...props
}) => {
  const textAreaClass = classNames('lyf-textarea-wrapper', {
    [`lyf-textarea-wrapper-${size}`]: true,
    'lyf-textarea-wrapper-disabled': disabled,
    'lyf-textarea-wrapper-error': error,
  }, className);

  return (
    <div className={textAreaClass}>
      <textarea
        className="lyf-textarea"
        rows={rows}
        disabled={disabled}
        {...props}
      />
    </div>
  );
};

export const Search: React.FC<SearchProps> = ({
  onSearch,
  enterButton = false,
  className,
  ...props
}) => {
  const [value, setValue] = useState(props.defaultValue || '');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    props.onChange?.(e);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearch?.(value);
    }
  };

  const handleSearchClick = () => {
    onSearch?.(value);
  };

  const addonAfter = enterButton ? (
    <button className="lyf-input-search-button" onClick={handleSearchClick}>
      {typeof enterButton === 'boolean' ? '搜索' : enterButton}
    </button>
  ) : props.addonAfter;

  return (
    <Input
      {...props}
      value={props.value || value}
      onChange={handleChange}
      onKeyPress={handleKeyPress}
      addonAfter={addonAfter}
      className={className}
    />
  );
};

Input.Password = Password;
Input.TextArea = TextArea;
Input.Search = Search;

export default Input;
