import React, { useState, ReactNode } from 'react';
import classNames from 'classnames';
import './style/index.scss';

export type AlertType = 'info' | 'success' | 'warning' | 'error';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: AlertType;
  message?: ReactNode;
  description?: ReactNode;
  showIcon?: boolean;
  closable?: boolean;
  onClose?: () => void;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  type = 'info',
  message,
  description,
  showIcon = false,
  closable = true,
  onClose,
  className,
  ...props
}) => {
  const [visible, setVisible] = useState(true);

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    setVisible(false);
    onClose?.();
  };

  if (!visible) {
    return null;
  }

  const alertClass = classNames('lyf-alert', {
    [`lyf-alert-${type}`]: true,
    'lyf-alert-with-icon': showIcon,
    'lyf-alert-closable': closable,
  }, className);

  return (
    <div className={alertClass} {...props}>
      {showIcon && (
        <div className="lyf-alert-icon">
          {type === 'info' && 'ℹ'}
          {type === 'success' && '✓'}
          {type === 'warning' && '⚠'}
          {type === 'error' && '✕'}
        </div>
      )}
      <div className="lyf-alert-content">
        {message && <div className="lyf-alert-message">{message}</div>}
        {description && <div className="lyf-alert-description">{description}</div>}
      </div>
      {closable && (
        <button className="lyf-alert-close" onClick={handleClose}>
          ×
        </button>
      )}
    </div>
  );
};

export default Alert;
