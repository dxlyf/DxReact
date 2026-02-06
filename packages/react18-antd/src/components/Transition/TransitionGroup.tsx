// TransitionGroup.jsx
import React, { Children, cloneElement, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';

const TransitionGroup = ({
  children,
  tag: Tag = 'div',
  name = 'transition',
  className,
  appear = false,
  duration = 300,
  onBeforeEnter,
  onEnter,
  onAfterEnter,
  onBeforeLeave,
  onLeave,
  onAfterLeave,
  ...props
}) => {
  const [items, setItems] = useState(() => {
    const childArray = Children.toArray(children);
    return childArray.map(child => ({
      key: child.key,
      element: child,
      state: appear ? 'appearing' : 'entered',
      isLeaving: false
    }));
  });

  const prevChildrenRef = useRef(children);

  useEffect(() => {
    const prevChildren = prevChildrenRef.current;
    const currentChildren = children;

    if (prevChildren !== currentChildren) {
      const newItems = [...items];
      const newKeys = new Set();
      
      // 找出新增的元素
      Children.forEach(currentChildren, child => {
        newKeys.add(child.key);
        const existingItem = newItems.find(item => item.key === child.key);
        if (!existingItem) {
          // 新元素
          newItems.push({
            key: child.key,
            element: child,
            state: 'entering',
            isLeaving: false
          });
        }
      });

      // 标记需要移除的元素
      newItems.forEach(item => {
        if (!newKeys.has(item.key) && !item.isLeaving) {
          item.state = 'leaving';
          item.isLeaving = true;
          
          // 延迟移除元素
          setTimeout(() => {
            setItems(prev => prev.filter(i => i.key !== item.key));
          }, duration);
        }
      });

      setItems(newItems);
      prevChildrenRef.current = currentChildren;
    }
  }, [children]);

  const handleTransitionEnd = (key, type) => {
    setItems(prev => prev.map(item => {
      if (item.key === key) {
        return { ...item, state: type === 'enter' ? 'entered' : 'leaving' };
      }
      return item;
    }));
  };

  return (
    <Tag className={className} {...props}>
      {items.map(item => {
        const transitionProps = {
          key: item.key,
          show: item.state !== 'leaving',
          name,
          appear: item.state === 'appearing',
          duration,
          onBeforeEnter,
          onEnter: (el) => {
            onEnter?.(el);
            if (item.state === 'appearing') {
              // 初始渲染的动画
            }
          },
          onAfterEnter: (el) => {
            onAfterEnter?.(el);
            handleTransitionEnd(item.key, 'enter');
          },
          onBeforeLeave,
          onLeave,
          onAfterLeave: (el) => {
            onAfterLeave?.(el);
            handleTransitionEnd(item.key, 'leave');
          }
        };

        return cloneElement(item.element, {
          ...item.element.props,
          transitionProps
        });
      })}
    </Tag>
  );
};

TransitionGroup.propTypes = {
  tag: PropTypes.string,
  name: PropTypes.string,
  appear: PropTypes.bool,
  duration: PropTypes.number
};

export default TransitionGroup;