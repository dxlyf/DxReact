// Transition.jsx
import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';

const Transition = ({
  children,
  show,
  name = 'transition',
  enterFrom = '',
  enterTo = '',
  enterActive = '',
  leaveFrom = '',
  leaveTo = '',
  leaveActive = '',
  appear = false,
  duration = 300,
  mode = 'default', // 'in-out', 'out-in'
  onBeforeEnter,
  onEnter,
  onAfterEnter,
  onEnterCancelled,
  onBeforeLeave,
  onLeave,
  onAfterLeave,
  onLeaveCancelled
}) => {
  const [state, setState] = useState({
    stage: show ? (appear ? 'appear' : 'entered') : 'left',
    isMounted: show,
    isLeaving: false
  });

  const nodeRef = useRef(null);
  const timeoutRef = useRef(null);
  const firstRender = useRef(true);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // 处理进入动画
  const handleEnter = () => {
    const node = nodeRef.current;
    if (!node) return;

    onBeforeEnter?.(node);

    // 设置进入初始类
    if (enterFrom) {
      node.classList.add(enterFrom);
    } else {
      node.classList.add(`${name}-enter-from`);
    }
    if (enterActive) {
      node.classList.add(enterActive);
    } else {
      node.classList.add(`${name}-enter-active`);
    }

    onEnter?.(node);

    // 下一帧开始过渡
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // 移除初始类，添加结束类
        if (enterFrom) {
          node.classList.remove(enterFrom);
        } else {
          node.classList.remove(`${name}-enter-from`);
        }
        
        if (enterTo) {
          node.classList.add(enterTo);
        } else {
          node.classList.add(`${name}-enter-to`);
        }

        // 监听过渡结束
        const handleEnd = () => {
          // 清理类名
          if (enterActive) {
            node.classList.remove(enterActive);
          } else {
            node.classList.remove(`${name}-enter-active`);
          }
          if (enterTo) {
            node.classList.remove(enterTo);
          } else {
            node.classList.remove(`${name}-enter-to`);
          }

          onAfterEnter?.(node);
          setState(prev => ({ ...prev, stage: 'entered' }));
        };

        // 设置超时防止过渡事件不触发
        timeoutRef.current = setTimeout(() => {
          handleEnd();
        }, duration + 50);

        node.addEventListener('transitionend', handleEnd, { once: true });
        node.addEventListener('animationend', handleEnd, { once: true });
      });
    });
  };

  // 处理离开动画
  const handleLeave = () => {
    const node = nodeRef.current;
    if (!node) return;

    onBeforeLeave?.(node);

    // 设置离开初始类
    if (leaveFrom) {
      node.classList.add(leaveFrom);
    } else {
      node.classList.add(`${name}-leave-from`);
    }
    if (leaveActive) {
      node.classList.add(leaveActive);
    } else {
      node.classList.add(`${name}-leave-active`);
    }

    onLeave?.(node);

    // 下一帧开始过渡
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // 移除初始类，添加结束类
        if (leaveFrom) {
          node.classList.remove(leaveFrom);
        } else {
          node.classList.remove(`${name}-leave-from`);
        }
        
        if (leaveTo) {
          node.classList.add(leaveTo);
        } else {
          node.classList.add(`${name}-leave-to`);
        }

        // 监听过渡结束
        const handleEnd = () => {
          // 清理类名
          if (leaveActive) {
            node.classList.remove(leaveActive);
          } else {
            node.classList.remove(`${name}-leave-active`);
          }
          if (leaveTo) {
            node.classList.remove(leaveTo);
          } else {
            node.classList.remove(`${name}-leave-to`);
          }

          onAfterLeave?.(node);
          setState(prev => ({ ...prev, isMounted: false, isLeaving: false }));
        };

        // 设置超时防止过渡事件不触发
        timeoutRef.current = setTimeout(() => {
          handleEnd();
        }, duration + 50);

        node.addEventListener('transitionend', handleEnd, { once: true });
        node.addEventListener('animationend', handleEnd, { once: true });
      });
    });
  };

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      if (appear && show) {
        handleEnter();
      }
      return;
    }

    if (show) {
      // 进入
      if (state.stage === 'left' || state.isLeaving) {
        setState(prev => ({ ...prev, isMounted: true, stage: 'entering' }));
        
        if (mode === 'out-in' && state.isLeaving) {
          // 等待离开完成再进入
          const timer = setTimeout(() => {
            handleEnter();
          }, duration);
          return () => clearTimeout(timer);
        } else {
          handleEnter();
        }
      }
    } else {
      // 离开
      if (state.stage === 'entered') {
        setState(prev => ({ ...prev, stage: 'leaving', isLeaving: true }));
        
        if (mode === 'in-out') {
          // 先进入新的，再离开旧的
          handleLeave();
        } else {
          handleLeave();
        }
      }
    }
  }, [show]);

  // 如果不显示且未挂载，返回 null
  if (!state.isMounted && !show) {
    return null;
  }

  // 克隆子元素并添加 ref
  const child = React.Children.only(children);
  return React.cloneElement(child, {
    ref: (el) => {
      nodeRef.current = el;
      // 处理子元素原有的 ref
      if (typeof child.ref === 'function') {
        child.ref(el);
      } else if (child.ref) {
        child.ref.current = el;
      }
    }
  });
};

Transition.propTypes = {
  show: PropTypes.bool.isRequired,
  name: PropTypes.string,
  appear: PropTypes.bool,
  duration: PropTypes.number,
  mode: PropTypes.oneOf(['default', 'in-out', 'out-in']),
  onBeforeEnter: PropTypes.func,
  onEnter: PropTypes.func,
  onAfterEnter: PropTypes.func,
  onEnterCancelled: PropTypes.func,
  onBeforeLeave: PropTypes.func,
  onLeave: PropTypes.func,
  onAfterLeave: PropTypes.func,
  onLeaveCancelled: PropTypes.func
};

export default Transition;