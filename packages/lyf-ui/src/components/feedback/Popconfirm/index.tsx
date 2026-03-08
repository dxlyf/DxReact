import React, { ReactNode } from 'react';
import classNames from 'classnames';
import { Popup } from '../Popup';
import './style/index.scss';

export interface PopconfirmProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: ReactNode;
  description?: ReactNode;
  onConfirm?: () => void;
  onCancel?: () => void;
  okText?: string;
  cancelText?: string;
  children?: ReactNode;
  className?: string;
}

export const Popconfirm: React.FC<PopconfirmProps> = ({
  title,
  description,
  onConfirm,
  onCancel,
  okText = '确定',
  cancelText = '取消',
  children,
  className,
  ...props
}) => {
  const handleConfirm = () => {
    onConfirm?.();
  };

  const handleCancel = () => {
    onCancel?.();
  };

  const popconfirmClass = classNames('lyf-popconfirm', className);

  return (
    <Popup
      trigger="click"
      placement="bottom"
      content={
        <div className={popconfirmClass} {...props}>
          <div className="lyf-popconfirm-content">
            {title && <div className="lyf-popconfirm-title">{title}</div>}
            {description && <div className="lyf-popconfirm-description">{description}</div>}
            <div className="lyf-popconfirm-actions">
              <button className="lyf-popconfirm-button lyf-popconfirm-button-cancel" onClick={handleCancel}>
                {cancelText}
              </button>
              <button className="lyf-popconfirm-button lyf-popconfirm-button-confirm" onClick={handleConfirm}>
                {okText}
              </button>
            </div>
          </div>
        </div>
      }
    >
      {children}
    </Popup>
  );
};

export default Popconfirm;
