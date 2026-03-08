import React, { useState, useEffect, ReactNode, useRef } from 'react';
import ReactDOM from 'react-dom';
import classNames from 'classnames';
import './style/index.scss';

export interface ModalProps extends React.HTMLAttributes<HTMLDivElement> {
  visible?: boolean;
  title?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  onOk?: () => void;
  onCancel?: () => void;
  okText?: string;
  cancelText?: string;
  mask?: boolean;
  maskClosable?: boolean;
  keyboard?: boolean;
  width?: string | number;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  visible = false,
  title,
  children,
  footer,
  onOk,
  onCancel,
  okText = '确定',
  cancelText = '取消',
  mask = true,
  maskClosable = true,
  keyboard = true,
  width = 520,
  className,
  ...props
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (keyboard && e.key === 'Escape' && visible) {
        onCancel?.();
      }
    };

    if (visible) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [visible, keyboard, onCancel]);

  const handleMaskClick = () => {
    if (maskClosable) {
      onCancel?.();
    }
  };

  const handleOk = () => {
    onOk?.();
  };

  const handleCancel = () => {
    onCancel?.();
  };

  if (!visible) {
    return null;
  }

  const modalClass = classNames('lyf-modal', className);

  return ReactDOM.createPortal(
    <div className="lyf-modal-wrapper">
      {mask && (
        <div className="lyf-modal-mask" onClick={handleMaskClick}></div>
      )}
      <div 
        className={modalClass} 
        style={{ width }} 
        ref={modalRef}
        {...props}
      >
        <div className="lyf-modal-header">
          <div className="lyf-modal-title">{title}</div>
          <button className="lyf-modal-close" onClick={handleCancel}>
            ×
          </button>
        </div>
        <div className="lyf-modal-body">
          {children}
        </div>
        <div className="lyf-modal-footer">
          {footer ? (
            footer
          ) : (
            <>
              <button className="lyf-modal-button lyf-modal-button-cancel" onClick={handleCancel}>
                {cancelText}
              </button>
              <button className="lyf-modal-button lyf-modal-button-ok" onClick={handleOk}>
                {okText}
              </button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;
