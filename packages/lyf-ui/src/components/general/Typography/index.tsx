import React from 'react';
import classNames from 'classnames';
import './style/index.scss';

export type TypographyVariant = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'a';
export type TypographyLevel = '1' | '2' | '3' | '4' | '5' | '6';
export type TypographyAlign = 'left' | 'center' | 'right' | 'justify';
export type TypographyEllipsis = boolean | {
  rows?: number;
  expandable?: boolean;
  symbol?: React.ReactNode;
};

export interface TypographyProps extends React.HTMLAttributes<HTMLElement> {
  variant?: TypographyVariant;
  level?: TypographyLevel;
  align?: TypographyAlign;
  ellipsis?: TypographyEllipsis;
  disabled?: boolean;
  mark?: boolean;
  code?: boolean;
  underline?: boolean;
  delete?: boolean;
  strong?: boolean;
  children?: React.ReactNode;
}

export const Typography: React.FC<TypographyProps> = ({
  variant = 'p',
  level,
  align,
  ellipsis,
  disabled = false,
  mark = false,
  code = false,
  underline = false,
  delete: del = false,
  strong = false,
  children,
  className,
  ...props
}) => {
  const typographyClass = classNames('lyf-typography', {
    [`lyf-typography-${variant}`]: true,
    [`lyf-typography-level-${level}`]: level,
    [`lyf-typography-align-${align}`]: align,
    'lyf-typography-ellipsis': ellipsis,
    'lyf-typography-disabled': disabled,
    'lyf-typography-mark': mark,
    'lyf-typography-code': code,
    'lyf-typography-underline': underline,
    'lyf-typography-delete': del,
    'lyf-typography-strong': strong,
  }, className);

  const Tag = variant as keyof JSX.IntrinsicElements;

  return (
    <Tag className={typographyClass} {...props}>
      {children}
    </Tag>
  );
};

// 导出常用的 Typography 组件
export const Title: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="h1" {...props} />
);

export const Paragraph: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="p" {...props} />
);

export const Text: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="span" {...props} />
);

export const Link: React.FC<Omit<TypographyProps, 'variant'> & React.AnchorHTMLAttributes<HTMLAnchorElement>> = (props) => (
  <Typography variant="a" {...props} />
);

export default Typography;
