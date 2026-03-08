import React, { useState, useEffect, useRef } from 'react';
import classNames from 'classnames';
import './style/index.scss';

export interface CarouselProps extends React.HTMLAttributes<HTMLDivElement> {
  autoplay?: boolean;
  autoplaySpeed?: number;
  dots?: boolean;
  arrows?: boolean;
  defaultActiveIndex?: number;
  onChange?: (current: number, previous: number) => void;
  children?: React.ReactNode;
  className?: string;
}

export const Carousel: React.FC<CarouselProps> = ({
  autoplay = false,
  autoplaySpeed = 3000,
  dots = true,
  arrows = true,
  defaultActiveIndex = 0,
  onChange,
  children,
  className,
  ...props
}) => {
  const [activeIndex, setActiveIndex] = useState(defaultActiveIndex);
  const carouselRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const slides = React.Children.toArray(children);

  useEffect(() => {
    if (autoplay) {
      intervalRef.current = setInterval(() => {
        setActiveIndex(prev => (prev + 1) % slides.length);
      }, autoplaySpeed);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoplay, autoplaySpeed, slides.length]);

  const handlePrev = () => {
    setActiveIndex(prev => (prev - 1 + slides.length) % slides.length);
  };

  const handleNext = () => {
    setActiveIndex(prev => (prev + 1) % slides.length);
  };

  const handleDotClick = (index: number) => {
    setActiveIndex(index);
  };

  useEffect(() => {
    onChange?.(activeIndex, (activeIndex - 1 + slides.length) % slides.length);
  }, [activeIndex, onChange, slides.length]);

  const carouselClass = classNames('lyf-carousel', className);

  return (
    <div className={carouselClass} {...props}>
      <div className="lyf-carousel-container" ref={carouselRef}>
        <div
          className="lyf-carousel-wrapper"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {slides.map((slide, index) => (
            <div key={index} className="lyf-carousel-slide">
              {slide}
            </div>
          ))}
        </div>
        {arrows && (
          <>
            <button className="lyf-carousel-arrow lyf-carousel-arrow-prev" onClick={handlePrev}>
              ‹
            </button>
            <button className="lyf-carousel-arrow lyf-carousel-arrow-next" onClick={handleNext}>
              ›
            </button>
          </>
        )}
      </div>
      {dots && (
        <div className="lyf-carousel-dots">
          {slides.map((_, index) => (
            <button
              key={index}
              className={classNames('lyf-carousel-dot', {
                'lyf-carousel-dot-active': index === activeIndex,
              })}
              onClick={() => handleDotClick(index)}
            ></button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Carousel;
