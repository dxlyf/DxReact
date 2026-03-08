import React, { useState, useEffect, ReactNode, useRef } from 'react';
import ReactDOM from 'react-dom';
import classNames from 'classnames';
import './style/index.scss';

export type DrawerPlacement = 'left' | 'right' | 'top' | 'bottom';

export interface DrawerProps extends React.HTMLAttributes<HTMLDivElement> {
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
  height?: string | number;
  placement?: DrawerPlacement;
  className?: string;
}

export const Drawer: React.FC<DrawerProps> = ({
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
  width = 320,
  height = 320,
  placement = 'right',
  className,
  ...props
}) => {
  const drawerRef = useRef<HTMLDivElement>(null);

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

  const drawerClass = classNames('lyf-drawer', `lyf-drawer-${placement}`, className);

  return ReactDOM.createPortal(
    <div className="lyf-drawer-wrapper">
      {mask && (
        <div className="lyf-drawer-mask" onClick={handleMaskClick}></div>
      )}
      <div 
        className={drawerClass} 
        style={{
          width: placement === 'left' || placement === 'right' ? width : '100%',
          height: placement === 'top' || placement === 'bottom' ? height : '100%'
        }} 
        ref={drawerRef}
        {...props}
      >
        <div className="lyf-drawer-header">
          <div className="lyf-drawer-title">{title}</div>
          <button className="lyf-drawer-close" onClick={handleCancel}>
            ×
          </button>
        </div>
        <div className="lyf-drawer-body">
          {children}
        </div>
        <div className="lyf-drawer-footer">
          {footer ? (
            footer
          ) : (
            <>
              <button className="lyf-drawer-button lyf-drawer-button-cancel" onClick={handleCancel}>
                {cancelText}
              </button>
              <button className="lyf-drawer-button lyf-drawer-button-ok" onClick={handleOk}>
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

export default Drawer;
