import React, { ReactNode } from 'react';
import classNames from 'classnames';
import { Popup, PopupPlacement } from '../Popup';
import './style/index.scss';

export interface PopoverProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: ReactNode;
  content?: ReactNode;
  placement?: PopupPlacement;
  trigger?: 'hover' | 'click' | 'focus';
  children?: ReactNode;
  className?: string;
}

export const Popover: React.FC<PopoverProps> = ({
  title,
  content,
  placement = 'top',
  trigger = 'click',
  children,
  className,
  ...props
}) => {
  const popoverClass = classNames('lyf-popover', {
    [`lyf-popover-${placement}`]: true,
  }, className);

  return (
    <Popup
      placement={placement}
      trigger={trigger}
      content={
        <div className={popoverClass} {...props}>
          <div className="lyf-popover-content">
            {title && <div className="lyf-popover-title">{title}</div>}
            {content && <div className="lyf-popover-body">{content}</div>}
          </div>
        </div>
      }
    >
      {children}
    </Popup>
  );
};

export default Popover;
