import { useState, useRef, useEffect, ReactNode } from 'react';

export type PopupPlacement = 'top' | 'bottom' | 'left' | 'right';

export interface UsePopupOptions {
  placement?: PopupPlacement;
  trigger?: 'hover' | 'click' | 'focus';
}

export const usePopup = (options: UsePopupOptions = {}) => {
  const { placement = 'top', trigger = 'hover' } = options;
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLElement>(null);
  const popupRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node) &&
          triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        setVisible(false);
      }
    };

    if (visible && trigger === 'click') {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [visible, trigger]);

  const calculatePosition = () => {
    if (!triggerRef.current) return { top: 0, left: 0 };
    
    const rect = triggerRef.current.getBoundingClientRect();
    const popupRect = popupRef.current?.getBoundingClientRect();
    
    if (!popupRect) return { top: 0, left: 0 };

    let top = 0;
    let left = 0;

    switch (placement) {
      case 'top':
        top = rect.top - popupRect.height - 8;
        left = rect.left + (rect.width - popupRect.width) / 2;
        break;
      case 'bottom':
        top = rect.bottom + 8;
        left = rect.left + (rect.width - popupRect.width) / 2;
        break;
      case 'left':
        top = rect.top + (rect.height - popupRect.height) / 2;
        left = rect.left - popupRect.width - 8;
        break;
      case 'right':
        top = rect.top + (rect.height - popupRect.height) / 2;
        left = rect.right + 8;
        break;
    }

    return { top, left };
  };

  const showPopup = () => {
    if (triggerRef.current) {
      setVisible(true);
      setTimeout(() => {
        setPosition(calculatePosition());
      }, 0);
    }
  };

  const hidePopup = () => {
    setVisible(false);
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

  return {
    visible,
    position,
    triggerRef,
    popupRef,
    showPopup,
    hidePopup,
    handleTriggerClick,
  };
};
