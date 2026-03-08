import React from 'react';
import classNames from 'classnames';
import './style/index.scss';

export type ProgressType = 'line' | 'circle';
export type ProgressStatus = 'normal' | 'success' | 'exception' | 'active';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  percent?: number;
  type?: ProgressType;
  status?: ProgressStatus;
  strokeWidth?: number;
  showInfo?: boolean;
  format?: (percent: number) => string;
  strokeColor?: string;
  className?: string;
}

export const Progress: React.FC<ProgressProps> = ({
  percent = 0,
  type = 'line',
  status = 'normal',
  strokeWidth = 8,
  showInfo = true,
  format = (p) => `${p}%`,
  strokeColor,
  className,
  ...props
}) => {
  const progressClass = classNames('lyf-progress', {
    [`lyf-progress-${type}`]: true,
    [`lyf-progress-${status}`]: true,
  }, className);

  const clampedPercent = Math.max(0, Math.min(100, percent));

  return (
    <div className={progressClass} {...props}>
      {type === 'line' ? (
        <>
          <div className="lyf-progress-line-container">
            <div 
              className="lyf-progress-line-track"
              style={{ height: `${strokeWidth}px` }}
            >
              <div 
                className="lyf-progress-line-progress"
                style={{
                  width: `${clampedPercent}%`,
                  height: `${strokeWidth}px`,
                  backgroundColor: strokeColor,
                }}
              ></div>
            </div>
            {showInfo && (
              <div className="lyf-progress-info">
                {format(clampedPercent)}
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="lyf-progress-circle-container">
            <svg className="lyf-progress-circle" width="100" height="100">
              <circle
                className="lyf-progress-circle-track"
                cx="50"
                cy="50"
                r="40"
                strokeWidth={strokeWidth}
              />
              <circle
                className="lyf-progress-circle-progress"
                cx="50"
                cy="50"
                r="40"
                strokeWidth={strokeWidth}
                stroke={strokeColor}
                strokeDasharray={2 * Math.PI * 40}
                strokeDashoffset={2 * Math.PI * 40 * (1 - clampedPercent / 100)}
                transform="rotate(-90 50 50)"
              />
            </svg>
            {showInfo && (
              <div className="lyf-progress-circle-info">
                {format(clampedPercent)}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Progress;
