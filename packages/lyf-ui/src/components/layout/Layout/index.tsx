import React from 'react';
import classNames from 'classnames';
import './style/index.scss';

export interface LayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

export interface HeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

export interface SiderProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  width?: number | string;
  collapsedWidth?: number | string;
  collapsed?: boolean;
  onCollapse?: (collapsed: boolean) => void;
}

export interface ContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

export interface FooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  className,
  ...props
}) => {
  const layoutClass = classNames('lyf-layout', className);

  return (
    <div className={layoutClass} {...props}>
      {children}
    </div>
  );
};

export const Header: React.FC<HeaderProps> = ({
  children,
  className,
  ...props
}) => {
  const headerClass = classNames('lyf-layout-header', className);

  return (
    <div className={headerClass} {...props}>
      {children}
    </div>
  );
};

export const Sider: React.FC<SiderProps> = ({
  children,
  width = 200,
  collapsedWidth = 80,
  collapsed = false,
  onCollapse,
  className,
  style,
  ...props
}) => {
  const siderClass = classNames('lyf-layout-sider', {
    'lyf-layout-sider-collapsed': collapsed,
  }, className);

  return (
    <div
      className={siderClass}
      style={{
        width: collapsed ? collapsedWidth : width,
        flexBasis: collapsed ? collapsedWidth : width,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
};

export const Content: React.FC<ContentProps> = ({
  children,
  className,
  ...props
}) => {
  const contentClass = classNames('lyf-layout-content', className);

  return (
    <div className={contentClass} {...props}>
      {children}
    </div>
  );
};

export const Footer: React.FC<FooterProps> = ({
  children,
  className,
  ...props
}) => {
  const footerClass = classNames('lyf-layout-footer', className);

  return (
    <div className={footerClass} {...props}>
      {children}
    </div>
  );
};

Layout.Header = Header;
Layout.Sider = Sider;
Layout.Content = Content;
Layout.Footer = Footer;

export default Layout;
