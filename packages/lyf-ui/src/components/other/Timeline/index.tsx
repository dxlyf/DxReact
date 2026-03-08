import React, { ReactNode } from 'react';
import classNames from 'classnames';
import './style/index.scss';

export type TimelineItemColor = 'blue' | 'red' | 'green' | 'gray';

export interface TimelineItemProps extends React.HTMLAttributes<HTMLDivElement> {
  color?: TimelineItemColor;
  dot?: ReactNode;
  label?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export interface TimelineProps extends React.HTMLAttributes<HTMLDivElement> {
  mode?: 'left' | 'alternate' | 'right';
  children?: ReactNode;
  className?: string;
}

export const TimelineItem: React.FC<TimelineItemProps> = ({
  color = 'blue',
  dot,
  label,
  children,
  className,
  ...props
}) => {
  const itemClass = classNames('lyf-timeline-item', {
    [`lyf-timeline-item-${color}`]: true,
  }, className);

  return (
    <div className={itemClass} {...props}>
      <div className="lyf-timeline-item-tail"></div>
      <div className="lyf-timeline-item-head">
        {dot || <div className="lyf-timeline-item-dot"></div>}
      </div>
      <div className="lyf-timeline-item-content">
        {label && <div className="lyf-timeline-item-label">{label}</div>}
        <div className="lyf-timeline-item-body">{children}</div>
      </div>
    </div>
  );
};

export const Timeline: React.FC<TimelineProps> = ({
  mode = 'left',
  children,
  className,
  ...props
}) => {
  const timelineClass = classNames('lyf-timeline', {
    [`lyf-timeline-${mode}`]: true,
  }, className);

  return (
    <div className={timelineClass} {...props}>
      {children}
    </div>
  );
};

Timeline.Item = TimelineItem;

export default Timeline;
