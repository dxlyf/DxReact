import React, { useState, ReactNode } from 'react';
import classNames from 'classnames';
import './style/index.scss';

export interface CollapsePanelProps {
  title: ReactNode;
  key: string | number;
  disabled?: boolean;
  children?: ReactNode;
}

export interface CollapseProps extends React.HTMLAttributes<HTMLDivElement> {
  activeKey?: (string | number) | (string | number)[];
  defaultActiveKey?: (string | number) | (string | number)[];
  accordion?: boolean;
  onChange?: (key: (string | number) | (string | number)[]) => void;
  children?: ReactNode;
  className?: string;
}

export const Panel: React.FC<CollapsePanelProps> = () => {
  return null;
};

export const Collapse: React.FC<CollapseProps> = ({
  activeKey,
  defaultActiveKey = [],
  accordion = false,
  onChange,
  children,
  className,
  ...props
}) => {
  const [expandedKeys, setExpandedKeys] = useState<Set<string | number>>(
    new Set(Array.isArray(defaultActiveKey) ? defaultActiveKey : [defaultActiveKey])
  );

  const handleToggle = (key: string | number, disabled: boolean) => {
    if (disabled) return;

    let newExpandedKeys: Set<string | number>;
    if (accordion) {
      newExpandedKeys = expandedKeys.has(key) ? new Set() : new Set([key]);
    } else {
      newExpandedKeys = new Set(expandedKeys);
      if (newExpandedKeys.has(key)) {
        newExpandedKeys.delete(key);
      } else {
        newExpandedKeys.add(key);
      }
    }
    setExpandedKeys(newExpandedKeys);
    onChange?.(accordion ? Array.from(newExpandedKeys)[0] : Array.from(newExpandedKeys));
  };

  const panels = React.Children.toArray(children).filter(child => (child as any).type === Panel) as React.ReactElement<CollapsePanelProps>[];

  const collapseClass = classNames('lyf-collapse', className);

  return (
    <div className={collapseClass} {...props}>
      {panels.map((panel) => {
        const { title, key, disabled, children } = panel.props;
        const isActive = expandedKeys.has(key);

        return (
          <div
            key={key}
            className={classNames('lyf-collapse-panel', {
              'lyf-collapse-panel-active': isActive,
              'lyf-collapse-panel-disabled': disabled,
            })}
          >
            <div
              className="lyf-collapse-panel-header"
              onClick={() => handleToggle(key, disabled || false)}
            >
              <span className="lyf-collapse-panel-title">{title}</span>
              <span className={classNames('lyf-collapse-panel-arrow', {
                'lyf-collapse-panel-arrow-active': isActive,
              })}>
                ▼
              </span>
            </div>
            <div
              className={classNames('lyf-collapse-panel-content', {
                'lyf-collapse-panel-content-active': isActive,
              })}
            >
              <div className="lyf-collapse-panel-content-inner">
                {children}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

Collapse.Panel = Panel;

export default Collapse;
