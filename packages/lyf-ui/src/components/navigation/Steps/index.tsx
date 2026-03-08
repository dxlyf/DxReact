import React from 'react';
import classNames from 'classnames';
import './style/index.scss';

export type StepsDirection = 'horizontal' | 'vertical';
export type StepsStatus = 'wait' | 'process' | 'finish' | 'error';

export interface StepsProps extends React.HTMLAttributes<HTMLDivElement> {
  current?: number;
  direction?: StepsDirection;
  status?: StepsStatus;
  size?: 'small' | 'default';
  children?: React.ReactNode;
}

export interface StepProps extends React.HTMLAttributes<HTMLLIElement> {
  title?: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  status?: StepsStatus;
}

export const Steps: React.FC<StepsProps> = ({
  current = 0,
  direction = 'horizontal',
  status = 'process',
  size = 'default',
  children,
  className,
  ...props
}) => {
  const stepsClass = classNames('lyf-steps', {
    [`lyf-steps-${direction}`]: true,
    [`lyf-steps-${size}`]: true,
  }, className);

  return (
    <div className={stepsClass} {...props}>
      <ul className="lyf-steps-list">
        {React.Children.map(children, (child, index) => {
          if (!React.isValidElement(child)) return null;
          
          const childProps = child.props as StepProps;
          let stepStatus: StepsStatus = 'wait';
          
          if (index < current) {
            stepStatus = 'finish';
          } else if (index === current) {
            stepStatus = status;
          } else {
            stepStatus = 'wait';
          }

          return React.cloneElement(child, {
            status: childProps.status || stepStatus,
            index,
          });
        })}
      </ul>
    </div>
  );
};

export const Step: React.FC<StepProps & { index?: number }> = ({
  title,
  description,
  icon,
  status = 'wait',
  className,
  ...props
}) => {
  const stepClass = classNames('lyf-step', {
    [`lyf-step-${status}`]: true,
  }, className);

  return (
    <li className={stepClass} {...props}>
      <div className="lyf-step-item">
        <div className="lyf-step-icon">
          {icon ? (
            icon
          ) : (
            <span className="lyf-step-icon-content">
              {status === 'finish' ? '✓' : props.index! + 1}
            </span>
          )}
        </div>
        <div className="lyf-step-content">
          {title && <div className="lyf-step-title">{title}</div>}
          {description && <div className="lyf-step-description">{description}</div>}
        </div>
      </div>
      <div className="lyf-step-line"></div>
    </li>
  );
};

Steps.Step = Step;

export default Steps;
