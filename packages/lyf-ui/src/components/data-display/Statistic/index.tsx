import React, { ReactNode } from 'react';
import classNames from 'classnames';
import './style/index.scss';

export interface StatisticProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: ReactNode;
  value?: number | string | ReactNode;
  prefix?: ReactNode;
  suffix?: ReactNode;
  precision?: number;
  decimalSeparator?: string;
  groupSeparator?: string;
  valueStyle?: React.CSSProperties;
  className?: string;
}

export const Statistic: React.FC<StatisticProps> = ({
  title,
  value,
  prefix,
  suffix,
  precision,
  decimalSeparator = '.',
  groupSeparator = ',',
  valueStyle,
  className,
  ...props
}) => {
  const formatValue = (val: any) => {
    if (typeof val === 'number') {
      if (precision !== undefined) {
        val = val.toFixed(precision);
      }
      return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, groupSeparator);
    }
    return val;
  };

  const statisticClass = classNames('lyf-statistic', className);

  return (
    <div className={statisticClass} {...props}>
      {title && <div className="lyf-statistic-title">{title}</div>}
      <div className="lyf-statistic-content">
        {prefix && <span className="lyf-statistic-prefix">{prefix}</span>}
        <span className="lyf-statistic-value" style={valueStyle}>
          {formatValue(value)}
        </span>
        {suffix && <span className="lyf-statistic-suffix">{suffix}</span>}
      </div>
    </div>
  );
};

export default Statistic;
