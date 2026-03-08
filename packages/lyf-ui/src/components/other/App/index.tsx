import React, { ReactNode } from 'react';
import classNames from 'classnames';
import './style/index.scss';

export interface AppProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  className?: string;
}

export const App: React.FC<AppProps> = ({
  children,
  className,
  ...props
}) => {
  const appClass = classNames('lyf-app', className);

  return (
    <div className={appClass} {...props}>
      {children}
    </div>
  );
};

export default App;
