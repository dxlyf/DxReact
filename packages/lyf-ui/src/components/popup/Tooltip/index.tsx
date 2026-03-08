import React, { ReactNode } from 'react';
import classNames from 'classnames';
import { Popup, PopupPlacement } from '../Popup';
import './style/index.scss';

export interface TooltipProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: ReactNode;
  placement?: PopupPlacement;
  trigger?: 'hover' | 'click' | 'focus';
  children?: ReactNode;
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  title,
  placement = 'top',
  trigger = 'hover',
  children,
  className,
  ...props
}) => {
  const tooltipClass = classNames('lyf-tooltip-content', className);

  return (
    <Popup
      placement={placement}
      trigger={trigger}
      content={
        <div className={tooltipClass} {...props}>
          {title}
        </div>
      }
      className="lyf-tooltip"
    >
      {children}
    </Popup>
  );
};

export default Tooltip;
