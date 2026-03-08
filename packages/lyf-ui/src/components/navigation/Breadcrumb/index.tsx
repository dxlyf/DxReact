import React from 'react';
import classNames from 'classnames';
import './style/index.scss';

export interface BreadcrumbProps extends React.HTMLAttributes<HTMLDivElement> {
  separator?: React.ReactNode;
  children?: React.ReactNode;
}

export interface BreadcrumbItemProps extends React.HTMLAttributes<HTMLLIElement> {
  href?: string;
  children?: React.ReactNode;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  separator = '/',
  children,
  className,
  ...props
}) => {
  const breadcrumbClass = classNames('lyf-breadcrumb', className);

  return (
    <div className={breadcrumbClass} {...props}>
      <ol className="lyf-breadcrumb-list">
        {React.Children.map(children, (child, index) => {
          if (!React.isValidElement(child)) return null;
          
          return (
            <React.Fragment key={index}>
              {child}
              {index < React.Children.count(children) - 1 && (
                <li className="lyf-breadcrumb-separator">{separator}</li>
              )}
            </React.Fragment>
          );
        })}
      </ol>
    </div>
  );
};

export const BreadcrumbItem: React.FC<BreadcrumbItemProps> = ({
  href,
  children,
  className,
  ...props
}) => {
  const itemClass = classNames('lyf-breadcrumb-item', className);

  if (href) {
    return (
      <li className={itemClass} {...props}>
        <a href={href}>{children}</a>
      </li>
    );
  }

  return (
    <li className={itemClass} {...props}>
      {children}
    </li>
  );
};

Breadcrumb.Item = BreadcrumbItem;

export default Breadcrumb;
