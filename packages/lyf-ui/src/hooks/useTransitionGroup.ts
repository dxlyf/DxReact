import { useRef, useEffect, useState, useCallback, ReactNode, Key } from 'react';

export interface UseTransitionGroupOptions {
  name?: string;
  duration?: number;
  appear?: boolean;
  tag?: string;
}

export interface TransitionGroupItem {
  key: Key;
  children: ReactNode;
}

export function useTransitionGroup(
  items: TransitionGroupItem[],
  options: UseTransitionGroupOptions = {}
) {
  const {
    name = 'transition',
    duration = 300,
    appear = false,
    tag = 'div',
  } = options;

  const [mountedItems, setMountedItems] = useState<Set<Key>>(new Set(
    appear ? items.map(item => item.key) : []
  ));
  const [leavingItems, setLeavingItems] = useState<Set<Key>>(new Set());
  const containerRef = useRef<HTMLElement>(null);

  // 处理新增和删除的项
  useEffect(() => {
    const currentKeys = new Set(items.map(item => item.key));
    const prevKeys = new Set(mountedItems);

    // 处理新增的项
    currentKeys.forEach(key => {
      if (!prevKeys.has(key)) {
        setMountedItems(prev => new Set([...prev, key]));
      }
    });

    // 处理删除的项
    prevKeys.forEach(key => {
      if (!currentKeys.has(key)) {
        setLeavingItems(prev => new Set([...prev, key]));
        setTimeout(() => {
          setLeavingItems(prev => {
            const newSet = new Set(prev);
            newSet.delete(key);
            return newSet;
          });
          setMountedItems(prev => {
            const newSet = new Set(prev);
            newSet.delete(key);
            return newSet;
          });
        }, duration);
      }
    });
  }, [items, mountedItems, duration]);

  const getItemClassNames = useCallback((key: Key) => {
    const isLeaving = leavingItems.has(key);
    return {
      className: isLeaving
        ? `${name}-leave ${name}-leave-active`
        : `${name}-enter ${name}-enter-active`,
    };
  }, [leavingItems, name]);

  const renderItems = useCallback(() => {
    return items
      .filter(item => mountedItems.has(item.key))
      .map(item => {
        const { className } = getItemClassNames(item.key);
        return (
          <div
            key={item.key}
            className={className}
            style={{
              transition: `all ${duration}ms ease`,
            }}
          >
            {item.children}
          </div>
        );
      });
  }, [items, mountedItems, getItemClassNames, duration]);

  return {
    ref: containerRef,
    tag,
    children: renderItems(),
  };
}

// 示例用法
/*
function TransitionGroupExample() {
  const [items, setItems] = useState<TransitionGroupItem[]>([
    { key: 1, children: 'Item 1' },
    { key: 2, children: 'Item 2' },
    { key: 3, children: 'Item 3' },
  ]);

  const { ref, tag, children } = useTransitionGroup(items, {
    name: 'list',
    duration: 300,
  });

  const addItem = () => {
    const newKey = items.length + 1;
    setItems([...items, { key: newKey, children: `Item ${newKey}` }]);
  };

  const removeItem = () => {
    setItems(items.slice(0, -1));
  };

  return (
    <div>
      <button onClick={addItem}>Add Item</button>
      <button onClick={removeItem}>Remove Item</button>
      <div ref={ref}>
        {children}
      </div>
    </div>
  );
}
*/
