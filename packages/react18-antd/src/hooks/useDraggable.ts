import { useState, useRef, useCallback,useTransition,startTransition, type CSSProperties } from 'react';
import useMemoizedFn from './useMemoizedFn';

interface Position {
  x: number;
  y: number;
}

interface UseDraggableResult {
  position: Position;
  isDragging: boolean;
  dragHandlers: {
    onPointerDown: (e: React.PointerEvent) => void;
  };
  dragHandlerStyle:CSSProperties,
  style: CSSProperties;
}
type Bounds={ left?: number; top?: number; right?: number; bottom?: number }
type UseDraggableProps = {
  initialPosition?: Position;
  bounds?: Bounds|(()=>Bounds)
  onDragStart?: (e: PointerEvent) => void;
  onDrag?: (e: PointerEvent) => void;
  onDragEnd?: (e: PointerEvent) => void;
}

export const useDraggable = (props: UseDraggableProps={}): UseDraggableResult => {
  const { initialPosition = { x: 0, y: 0 },onDragEnd,onDragStart,onDrag } = props;
  const [position, setPosition] = useState<Position>(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const elementRef = useRef<HTMLElement | null>(null);

  const handlePointerDown = useMemoizedFn((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const element = e.currentTarget as HTMLElement;
    elementRef.current = element;
    element.setPointerCapture(e.pointerId);

    // 记录拖动起始位置
    dragStartRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };

    setIsDragging(true);
    onDragStart?.(e.nativeEvent);
    // 注册全局事件
    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
    document.addEventListener('pointercancel', handlePointerUp);
  });
  // 添加全局事件监听
  const handlePointerMove = useMemoizedFn((moveEvent: PointerEvent) => {
    if (!dragStartRef.current || !isDragging) return;

    const newX = moveEvent.clientX - dragStartRef.current.x;
    const newY = moveEvent.clientY - dragStartRef.current.y;

    startTransition(()=>{
      setPosition({ x: newX, y: newY });
      onDrag?.(moveEvent);
    })
  });

  const handlePointerUp = useMemoizedFn((e:PointerEvent) => {
    setIsDragging(false);
    dragStartRef.current = null;
    if (elementRef.current) {
      elementRef.current.releasePointerCapture(e.pointerId);
    }
    onDragEnd?.(e);
    // 清理全局事件
    document.removeEventListener('pointermove', handlePointerMove);
    document.removeEventListener('pointerup', handlePointerUp);
    document.removeEventListener('pointercancel', handlePointerUp);
  });
  return {
    position,
    isDragging,
    dragHandlers: {
      onPointerDown: handlePointerDown,
    },
    dragHandlerStyle:{
      cursor: isDragging ? 'grabbing' : 'move',

    },
    style: {
      transform: `translate(${position.x}px, ${position.y}px)`,
      //cursor: isDragging ? 'grabbing' : 'grab',
      userSelect: 'none',
      touchAction: 'none', // 防止触摸默认行为
      position: 'relative' as const
    }
  };
};