import React from 'react';
import classNames from 'classnames';
import './style/index.scss';

export interface RowProps extends React.HTMLAttributes<HTMLDivElement> {
  gutter?: number;
  type?: 'flex';
  justify?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around';
  align?: 'top' | 'middle' | 'bottom';
  children?: React.ReactNode;
}

export interface ColProps extends React.HTMLAttributes<HTMLDivElement> {
  span?: number;
  offset?: number;
  push?: number;
  pull?: number;
  xs?: number | { span?: number; offset?: number };
  sm?: number | { span?: number; offset?: number };
  md?: number | { span?: number; offset?: number };
  lg?: number | { span?: number; offset?: number };
  xl?: number | { span?: number; offset?: number };
  children?: React.ReactNode;
}

export const Row: React.FC<RowProps> = ({
  gutter = 0,
  type,
  justify = 'flex-start',
  align = 'top',
  children,
  className,
  style,
  ...props
}) => {
  const rowClass = classNames('lyf-row', {
    'lyf-row-flex': type === 'flex',
    [`lyf-row-justify-${justify}`]: type === 'flex',
    [`lyf-row-align-${align}`]: type === 'flex',
  }, className);

  return (
    <div
      className={rowClass}
      style={{
        marginLeft: gutter < 0 ? 0 : -gutter / 2,
        marginRight: gutter < 0 ? 0 : -gutter / 2,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
};

export const Col: React.FC<ColProps> = ({
  span,
  offset,
  push,
  pull,
  xs,
  sm,
  md,
  lg,
  xl,
  children,
  className,
  style,
  ...props
}) => {
  const colClass = classNames('lyf-col', {
    [`lyf-col-${span}`]: span,
    [`lyf-col-offset-${offset}`]: offset,
    [`lyf-col-push-${push}`]: push,
    [`lyf-col-pull-${pull}`]: pull,
  }, className);

  // 处理响应式 props
  const responsiveProps = {
    xs,
    sm,
    md,
    lg,
    xl,
  };

  const responsiveClass = Object.entries(responsiveProps)
    .filter(([_, value]) => value !== undefined)
    .map(([key, value]) => {
      if (typeof value === 'number') {
        return `lyf-col-${key}-${value}`;
      }
      if (typeof value === 'object') {
        const { span: valueSpan, offset: valueOffset } = value;
        return [
          valueSpan ? `lyf-col-${key}-${valueSpan}` : '',
          valueOffset ? `lyf-col-${key}-offset-${valueOffset}` : '',
        ].filter(Boolean).join(' ');
      }
      return '';
    })
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={`${colClass} ${responsiveClass}`}
      style={style}
      {...props}
    >
      {children}
    </div>
  );
};

Row.Col = Col;

export default Row;
