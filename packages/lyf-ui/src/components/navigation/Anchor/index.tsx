import React, { useState, useEffect, useRef } from 'react';
import classNames from 'classnames';
import './style/index.scss';

export interface AnchorProps extends React.HTMLAttributes<HTMLDivElement> {
  affix?: boolean;
  offsetTop?: number;
  bounds?: number;
  onChange?: (current: string) => void;
  children?: React.ReactNode;
}

export interface AnchorLinkProps extends React.HTMLAttributes<HTMLAnchorElement> {
  href: string;
  title: React.ReactNode;
  children?: React.ReactNode;
}

export const Anchor: React.FC<AnchorProps> = ({
  affix = true,
  offsetTop = 0,
  bounds = 5,
  onChange,
  children,
  className,
  style,
  ...props
}) => {
  const [current, setCurrent] = useState('');
  const anchorRef = useRef<HTMLDivElement>(null);
  const linkRefs = useRef<Map<string, HTMLElement>>(new Map());

  useEffect(() => {
    // 初始化链接引用
    const links = React.Children.toArray(children).filter(child => 
      React.isValidElement(child) && (child as any).type === AnchorLink
    ) as React.ReactElement<AnchorLinkProps>[];

    links.forEach(link => {
      const href = link.props.href;
      const element = document.querySelector(href);
      if (element) {
        linkRefs.current.set(href, element as HTMLElement);
      }
    });

    // 监听滚动事件
    const handleScroll = () => {
      const scrollTop = window.pageYOffset + offsetTop;
      let currentHref = '';

      linkRefs.current.forEach((element, href) => {
        const rect = element.getBoundingClientRect();
        if (rect.top <= bounds && rect.bottom >= bounds) {
          currentHref = href;
        }
      });

      if (currentHref !== current) {
        setCurrent(currentHref);
        onChange?.(currentHref);
      }
    };

    window.addEventListener('scroll', handleScroll);
    // 初始化时触发一次
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [children, offsetTop, bounds, onChange, current]);

  const handleLinkClick = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    const element = linkRefs.current.get(href);
    if (element) {
      window.scrollTo({
        top: element.offsetTop - offsetTop,
        behavior: 'smooth',
      });
      setCurrent(href);
      onChange?.(href);
    }
  };

  const anchorClass = classNames('lyf-anchor', {
    'lyf-anchor-affix': affix,
  }, className);

  const affixStyle = affix ? {
    position: 'fixed',
    top: `${offsetTop}px`,
    zIndex: 100,
    ...style,
  } : style;

  return (
    <div ref={anchorRef} className={anchorClass} style={affixStyle} {...props}>
      <div className="lyf-anchor-content">
        <ul className="lyf-anchor-list">
          {React.Children.map(children, (child) => {
            if (!React.isValidElement(child)) return null;
            
            const linkProps = (child.props as AnchorLinkProps);
            const isActive = linkProps.href === current;
            
            return React.cloneElement(child, {
              isActive,
              onClick: (e: React.MouseEvent) => handleLinkClick(e, linkProps.href),
            });
          })}
        </ul>
      </div>
    </div>
  );
};

export const AnchorLink: React.FC<AnchorLinkProps & { isActive?: boolean; onClick?: (e: React.MouseEvent) => void }> = ({
  href,
  title,
  children,
  isActive = false,
  onClick,
  className,
  ...props
}) => {
  const linkClass = classNames('lyf-anchor-link', {
    'lyf-anchor-link-active': isActive,
  }, className);

  return (
    <li className="lyf-anchor-item">
      <a
        href={href}
        className={linkClass}
        onClick={onClick}
        {...props}
      >
        {title}
      </a>
      {children && (
        <ul className="lyf-anchor-sub-list">
          {children}
        </ul>
      )}
    </li>
  );
};

Anchor.Link = AnchorLink;

export default Anchor;
