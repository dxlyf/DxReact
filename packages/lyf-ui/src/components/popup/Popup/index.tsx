import React, { useState, useRef, useEffect, ReactNode, RefObject } from 'react';
import ReactDOM from 'react-dom';
import classNames from 'classnames';
import { useClickOutside } from '../../../hooks/useClickOutside';
import { useCombinedRefs } from '../../../hooks/useCombinedRefs';
import { useAnimate } from '../../../hooks/useAnimate';
import './style/index.scss';

export type PopupPlacement = 'top' | 'bottom' | 'left' | 'right';

export interface PopupProps extends React.HTMLAttributes<HTMLDivElement> {
  visible?: boolean;
  onVisibleChange?: (visible: boolean) => void;
  placement?: PopupPlacement;
  trigger?: 'hover' | 'click' | 'focus';
  children?: ReactNode;
  content?: ReactNode;
  className?: string;
  showArrow?: boolean;
  offset?: number;
}

export const Popup: React.FC<PopupProps> = ({
  visible: controlledVisible,
  onVisibleChange,
  placement = 'top',
  trigger = 'click',
  children,
  content,
  className,
  showArrow = true,
  offset = 8,
  ...props
}) => {
  const [internalVisible, setInternalVisible] = useState(false);
  const [animatingVisible, setAnimatingVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const visible = controlledVisible !== undefined ? controlledVisible : internalVisible;
  const setVisible = (newVisible: boolean) => {
    if (controlledVisible === undefined) {
      setInternalVisible(newVisible);
    }
    onVisibleChange?.(newVisible);
  };

  // 使用 useClickOutside hook 处理点击外部关闭
  const clickOutsideRef = useClickOutside<HTMLDivElement>(() => {
    setVisible(false);
  }, visible && trigger === 'click');

  // 合并 popupRef 和 clickOutsideRef
  const combinedPopupRef = useCombinedRefs(popupRef, clickOutsideRef);

  // 使用 useAnimate hook 处理动画
  const fadeInKeyframes = [
    { opacity: 0, transform: 'translateY(-5px)' },
    { opacity: 1, transform: 'translateY(0)' }
  ];

  const fadeOutKeyframes = [
    { opacity: 1, transform: 'translateY(0)' },
    { opacity: 0, transform: 'translateY(-5px)' }
  ];

  const { play: playFadeIn, reverse: playFadeOut } = useAnimate(
    popupRef,
    visible ? fadeInKeyframes : null,
    { duration: 300, easing: 'ease' }
  );

  const calculatePosition = () => {
    if (!triggerRef.current || !popupRef.current) return { top: 0, left: 0 };
    
    const rect = triggerRef.current.getBoundingClientRect();
    const popupRect = popupRef.current.getBoundingClientRect();
    
    let top = 0;
    let left = 0;

    switch (placement) {
      case 'top':
        top = rect.top - popupRect.height - offset;
        left = rect.left + (rect.width - popupRect.width) / 2;
        break;
      case 'bottom':
        top = rect.bottom + offset;
        left = rect.left + (rect.width - popupRect.width) / 2;
        break;
      case 'left':
        top = rect.top + (rect.height - popupRect.height) / 2;
        left = rect.left - popupRect.width - offset;
        break;
      case 'right':
        top = rect.top + (rect.height - popupRect.height) / 2;
        left = rect.right + offset;
        break;
    }

    return { top, left };
  };

  const showPopup = () => {
    if (triggerRef.current) {
      setVisible(true);
    }
  };

  const hidePopup = () => {
    setVisible(false);
    playFadeOut();
  };

  const handleTriggerClick = () => {
    if (trigger === 'click') {
      if (visible) {
        hidePopup();
      } else {
        showPopup();
      }
    }
  };

  // 当 popup 元素渲染到 DOM 后计算位置
  useEffect(() => {
    if (animatingVisible && popupRef.current && triggerRef.current) {
      const newPosition = calculatePosition();
      setPosition(newPosition);
      playFadeIn();
    }
  }, [animatingVisible]);

  // 处理动画状态
  useEffect(() => {
    if (visible) {
      setAnimatingVisible(true);
    } else {
      const timer = setTimeout(() => {
        setAnimatingVisible(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const popupClass = classNames('lyf-popup', {
    [`lyf-popup-${placement}`]: true,
  }, className);

  return (
    <>
      <div 
        className="lyf-popup-trigger"
        ref={triggerRef}
        onMouseEnter={trigger === 'hover' ? showPopup : undefined}
        onMouseLeave={trigger === 'hover' ? hidePopup : undefined}
        onClick={handleTriggerClick}
        onFocus={trigger === 'focus' ? showPopup : undefined}
        onBlur={trigger === 'focus' ? hidePopup : undefined}
      >
        {children}
      </div>
      {animatingVisible && content && ReactDOM.createPortal(
        <div 
          className={popupClass}
          style={{
            position: 'fixed',
            top: `${position.top}px`,
            left: `${position.left}px`,
            zIndex: 1000,
          }}
          ref={combinedPopupRef}
          {...props}
        >
          {content}
          {showArrow && <div className="lyf-popup-arrow"></div>}
        </div>,
        document.body
      )}
    </>
  );
};

export default Popup;
