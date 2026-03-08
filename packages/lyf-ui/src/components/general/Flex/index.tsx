import React from 'react';
import classNames from 'classnames';
import './style/index.scss';

export type FlexDirection = 'row' | 'row-reverse' | 'column' | 'column-reverse';
export type FlexJustify = 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
export type FlexAlign = 'flex-start' | 'flex-end' | 'center' | 'baseline' | 'stretch';
export type FlexWrap = 'nowrap' | 'wrap' | 'wrap-reverse';

export interface FlexProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: FlexDirection;
  justify?: FlexJustify;
  align?: FlexAlign;
  wrap?: FlexWrap;
  gap?: number | string;
  children?: React.ReactNode;
}

export const Flex: React.FC<FlexProps> = ({
  direction = 'row',
  justify = 'flex-start',
  align = 'stretch',
  wrap = 'nowrap',
  gap,
  children,
  className,
  style,
  ...props
}) => {
  const flexClass = classNames('lyf-flex', className);

  return (
    <div
      className={flexClass}
      style={{
        flexDirection: direction,
        justifyContent: justify,
        alignItems: align,
        flexWrap: wrap,
        gap,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
};

// 导出 Flex.Item 组件
export const Item: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  style,
  ...props
}) => {
  const itemClass = classNames('lyf-flex-item', className);

  return (
    <div
      className={itemClass}
      style={style}
      {...props}
    >
      {children}
    </div>
  );
};

Flex.Item = Item;

export default Flex;
