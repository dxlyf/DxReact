import React, { useState, useRef, useEffect } from 'react';
import classNames from 'classnames';
import './style/index.scss';

export type SplitterDirection = 'horizontal' | 'vertical';

export interface SplitterProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: SplitterDirection;
  defaultSize?: number;
  minSize?: number;
  maxSize?: number;
  onSizeChange?: (size: number) => void;
  children?: React.ReactNode;
}

export const Splitter: React.FC<SplitterProps> = ({
  direction = 'horizontal',
  defaultSize = 50,
  minSize = 10,
  maxSize = 90,
  onSizeChange,
  children,
  className,
  style,
  ...props
}) => {
  const [size, setSize] = useState(defaultSize);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      let newSize: number;

      if (direction === 'horizontal') {
        const delta = e.clientX - containerRect.left;
        newSize = (delta / containerRect.width) * 100;
      } else {
        const delta = e.clientY - containerRect.top;
        newSize = (delta / containerRect.height) * 100;
      }

      newSize = Math.max(minSize, Math.min(maxSize, newSize));
      setSize(newSize);
      onSizeChange?.(newSize);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, direction, minSize, maxSize, onSizeChange]);

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const splitterClass = classNames('lyf-splitter', {
    [`lyf-splitter-${direction}`]: true,
  }, className);

  const childrenArray = React.Children.toArray(children);
  if (childrenArray.length !== 2) {
    return <div className={splitterClass} {...props}>{children}</div>;
  }

  return (
    <div
      ref={containerRef}
      className={splitterClass}
      style={style}
      {...props}
    >
      <div className="lyf-splitter-panel lyf-splitter-panel-first" style={{
        [direction === 'horizontal' ? 'width' : 'height']: `${size}%`,
      }}>
        {childrenArray[0]}
      </div>
      <div
        ref={handleRef}
        className="lyf-splitter-handle"
        onMouseDown={handleMouseDown}
      />
      <div className="lyf-splitter-panel lyf-splitter-panel-second" style={{
        [direction === 'horizontal' ? 'width' : 'height']: `${100 - size}%`,
      }}>
        {childrenArray[1]}
      </div>
    </div>
  );
};

export default Splitter;
