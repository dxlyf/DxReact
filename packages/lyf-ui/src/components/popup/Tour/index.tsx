import React, { useState, useEffect, ReactNode } from 'react';
import ReactDOM from 'react-dom';
import classNames from 'classnames';
import './style/index.scss';

export interface TourStep {
  target: string;
  title?: ReactNode;
  description?: ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

export interface TourProps extends React.HTMLAttributes<HTMLDivElement> {
  steps: TourStep[];
  visible?: boolean;
  onClose?: () => void;
  onFinish?: () => void;
  onChange?: (current: number) => void;
  className?: string;
}

export const Tour: React.FC<TourProps> = ({
  steps,
  visible = false,
  onClose,
  onFinish,
  onChange,
  className,
  ...props
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (visible && steps.length > 0) {
      const step = steps[currentStep];
      const targetElement = document.querySelector(step.target);
      
      if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        const placement = step.placement || 'bottom';
        
        let top = 0;
        let left = 0;
        
        switch (placement) {
          case 'top':
            top = rect.top - 200;
            left = rect.left + rect.width / 2 - 150;
            break;
          case 'bottom':
            top = rect.bottom + 20;
            left = rect.left + rect.width / 2 - 150;
            break;
          case 'left':
            top = rect.top + rect.height / 2 - 100;
            left = rect.left - 320;
            break;
          case 'right':
            top = rect.top + rect.height / 2 - 100;
            left = rect.right + 20;
            break;
        }
        
        setPosition({ top, left });
      }
    }
  }, [visible, currentStep, steps]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      onChange?.(currentStep + 1);
    } else {
      onFinish?.();
      onClose?.();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      onChange?.(currentStep - 1);
    }
  };

  const handleClose = () => {
    onClose?.();
  };

  if (!visible || steps.length === 0) {
    return null;
  }

  const step = steps[currentStep];
  const tourClass = classNames('lyf-tour', className);

  return ReactDOM.createPortal(
    <>
      <div className="lyf-tour-mask"></div>
      <div 
        className={tourClass}
        style={{
          position: 'fixed',
          top: `${position.top}px`,
          left: `${position.left}px`,
          zIndex: 1000,
        }}
        {...props}
      >
        <div className="lyf-tour-content">
          <button className="lyf-tour-close" onClick={handleClose}>×</button>
          {step.title && <div className="lyf-tour-title">{step.title}</div>}
          {step.description && <div className="lyf-tour-description">{step.description}</div>}
          <div className="lyf-tour-footer">
            <div className="lyf-tour-dots">
              {steps.map((_, index) => (
                <span 
                  key={index} 
                  className={classNames('lyf-tour-dot', {
                    'lyf-tour-dot-active': index === currentStep
                  })}
                ></span>
              ))}
            </div>
            <div className="lyf-tour-actions">
              {currentStep > 0 && (
                <button className="lyf-tour-button lyf-tour-button-prev" onClick={handlePrev}>
                  上一步
                </button>
              )}
              <button className="lyf-tour-button lyf-tour-button-next" onClick={handleNext}>
                {currentStep === steps.length - 1 ? '完成' : '下一步'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};

export default Tour;
