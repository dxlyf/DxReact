import React, { ReactNode } from 'react';
import classNames from 'classnames';

export interface TabPaneProps extends React.HTMLAttributes<HTMLDivElement> {
  key: string;
  tab: ReactNode;
  disabled?: boolean;
  children?: ReactNode;
  className?: string;
}

export const TabPane: React.FC<TabPaneProps> = ({
  key,
  tab,
  disabled = false,
  children,
  className,
  ...props
}) => {
  const paneClass = classNames('lyf-tabs-tabpane', className);

  return (
    <div className={paneClass} {...props}>
      {children}
    </div>
  );
};

export default TabPane;
