import React, { ReactNode } from 'react';
import classNames from 'classnames';
import './style/index.scss';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: ReactNode;
  extra?: ReactNode;
  bordered?: boolean;
  hoverable?: boolean;
  children?: ReactNode;
  className?: string;
}

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  className?: string;
}

export interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  className?: string;
}

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  title,
  extra,
  bordered = true,
  hoverable = false,
  children,
  className,
  ...props
}) => {
  const cardClass = classNames('lyf-card', {
    'lyf-card-bordered': bordered,
    'lyf-card-hoverable': hoverable,
  }, className);

  return (
    <div className={cardClass} {...props}>
      {(title || extra) && (
        <div className="lyf-card-header">
          {title && <div className="lyf-card-title">{title}</div>}
          {extra && <div className="lyf-card-extra">{extra}</div>}
        </div>
      )}
      <div className="lyf-card-body">
        {children}
      </div>
    </div>
  );
};

export const CardHeader: React.FC<CardHeaderProps> = ({
  children,
  className,
  ...props
}) => {
  const headerClass = classNames('lyf-card-header', className);

  return (
    <div className={headerClass} {...props}>
      {children}
    </div>
  );
};

export const CardBody: React.FC<CardBodyProps> = ({
  children,
  className,
  ...props
}) => {
  const bodyClass = classNames('lyf-card-body', className);

  return (
    <div className={bodyClass} {...props}>
      {children}
    </div>
  );
};

export const CardFooter: React.FC<CardFooterProps> = ({
  children,
  className,
  ...props
}) => {
  const footerClass = classNames('lyf-card-footer', className);

  return (
    <div className={footerClass} {...props}>
      {children}
    </div>
  );
};

Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;

export default Card;
