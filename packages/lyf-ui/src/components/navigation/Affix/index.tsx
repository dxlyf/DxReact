import React, { useState, useRef, useEffect } from 'react';
import classNames from 'classnames';
import './style/index.scss';

export interface AffixProps extends React.HTMLAttributes<HTMLDivElement> {
  offsetTop?: number;
  offsetBottom?: number;
  target?: () => HTMLElement | null;
  onChange?: (fixed: boolean) => void;
  children?: React.ReactNode;
}

export const Affix: React.FC<AffixProps> = ({
  offsetTop = 0,
  offsetBottom,
  target,
  onChange,
  children,
  className,
  style,
  ...props
}) => {
  const [fixed, setFixed] = useState(false);
  const [affixStyle, setAffixStyle] = useState({});
  const affixRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<HTMLElement | null>(null);
  const stateRef = useRef({});

  useEffect(() => {
    // 获取目标元素
    if (target) {
      targetRef.current = target();
    } else {
      targetRef.current = window.document.documentElement;
    }

    // 初始化状态
    updateState();

    // 监听滚动事件
    const handleScroll = () => {
      updateState();
    };

    targetRef.current.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);

    return () => {
      targetRef.current?.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [offsetTop, offsetBottom, target, onChange]);

  const updateState = () => {
    if (!affixRef.current || !targetRef.current) return;

    const rect = affixRef.current.getBoundingClientRect();
    const targetRect = targetRef.current.getBoundingClientRect();
    const scrollTop = targetRef.current.scrollTop || window.pageYOffset;
    const scrollLeft = targetRef.current.scrollLeft || window.pageXOffset;

    let newFixed = false;
    let newStyle = {};

    if (offsetTop !== undefined) {
      if (scrollTop >= rect.top + scrollTop - offsetTop) {
        newFixed = true;
        newStyle = {
          position: 'fixed',
          top: `${offsetTop}px`,
          left: `${rect.left + scrollLeft}px`,
          width: `${rect.width}px`,
          zIndex: 100,
        };
      }
    } else if (offsetBottom !== undefined) {
      if (scrollTop + targetRect.height <= rect.bottom + scrollTop + offsetBottom) {
        newFixed = true;
        newStyle = {
          position: 'fixed',
          bottom: `${offsetBottom}px`,
          left: `${rect.left + scrollLeft}px`,
          width: `${rect.width}px`,
          zIndex: 100,
        };
      }
    }

    if (newFixed !== fixed) {
      setFixed(newFixed);
      onChange?.(newFixed);
    }

    setAffixStyle(newStyle);
  };

  const affixClass = classNames('lyf-affix', {
    'lyf-affix-fixed': fixed,
  }, className);

  return (
    <div
      ref={affixRef}
      className={affixClass}
      style={{
        ...affixStyle,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
};

export default Affix;
