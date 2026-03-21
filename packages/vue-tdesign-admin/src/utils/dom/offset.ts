// 获取元素尺寸相关工具函数

/**
 * 获取元素的宽度（不包含内边距、边框、外边距）
 * 类似 jQuery 的 width()
 */
export function width(element: HTMLElement | null): number {
  if (!element) return 0;
  const rect = element.getBoundingClientRect();
  const styles = window.getComputedStyle(element);
  const paddingLeft = parseFloat(styles.paddingLeft) || 0;
  const paddingRight = parseFloat(styles.paddingRight) || 0;
  const borderLeft = parseFloat(styles.borderLeftWidth) || 0;
  const borderRight = parseFloat(styles.borderRightWidth) || 0;
  return rect.width - paddingLeft - paddingRight - borderLeft - borderRight;
}

/**
 * 获取元素的内部宽度（包含内边距，不包含边框、外边距）
 * 类似 jQuery 的 innerWidth()
 */
export function innerWidth(element: HTMLElement | null): number {
  if (!element) return 0;
  const rect = element.getBoundingClientRect();
  const styles = window.getComputedStyle(element);
  const borderLeft = parseFloat(styles.borderLeftWidth) || 0;
  const borderRight = parseFloat(styles.borderRightWidth) || 0;
  return rect.width - borderLeft - borderRight;
}

/**
 * 获取元素的外部宽度（包含内边距和边框，不包含外边距）
 * 类似 jQuery 的 outerWidth()
 */
export function outerWidth(element: HTMLElement | null): number {
  if (!element) return 0;
  const rect = element.getBoundingClientRect();
  return rect.width;
}

/**
 * 获取元素的外部宽度（包含内边距、边框和外边距）
 * 类似 jQuery 的 outerWidth(true)
 */
export function outerWidthWithMargin(element: HTMLElement | null): number {
  if (!element) return 0;
  const rect = element.getBoundingClientRect();
  const styles = window.getComputedStyle(element);
  const marginLeft = parseFloat(styles.marginLeft) || 0;
  const marginRight = parseFloat(styles.marginRight) || 0;
  return rect.width + marginLeft + marginRight;
}

/**
 * 获取元素的高度（不包含内边距、边框、外边距）
 * 类似 jQuery 的 height()
 */
export function height(element: HTMLElement | null): number {
  if (!element) return 0;
  const rect = element.getBoundingClientRect();
  const styles = window.getComputedStyle(element);
  const paddingTop = parseFloat(styles.paddingTop) || 0;
  const paddingBottom = parseFloat(styles.paddingBottom) || 0;
  const borderTop = parseFloat(styles.borderTopWidth) || 0;
  const borderBottom = parseFloat(styles.borderBottomWidth) || 0;
  return rect.height - paddingTop - paddingBottom - borderTop - borderBottom;
}

/**
 * 获取元素的内部高度（包含内边距，不包含边框、外边距）
 * 类似 jQuery 的 innerHeight()
 */
export function innerHeight(element: HTMLElement | null): number {
  if (!element) return 0;
  const rect = element.getBoundingClientRect();
  const styles = window.getComputedStyle(element);
  const borderTop = parseFloat(styles.borderTopWidth) || 0;
  const borderBottom = parseFloat(styles.borderBottomWidth) || 0;
  return rect.height - borderTop - borderBottom;
}

/**
 * 获取元素的外部高度（包含内边距和边框，不包含外边距）
 * 类似 jQuery 的 outerHeight()
 */
export function outerHeight(element: HTMLElement | null): number {
  if (!element) return 0;
  const rect = element.getBoundingClientRect();
  return rect.height;
}

/**
 * 获取元素的外部高度（包含内边距、边框和外边距）
 * 类似 jQuery 的 outerHeight(true)
 */
export function outerHeightWithMargin(element: HTMLElement | null): number {
  if (!element) return 0;
  const rect = element.getBoundingClientRect();
  const styles = window.getComputedStyle(element);
  const marginTop = parseFloat(styles.marginTop) || 0;
  const marginBottom = parseFloat(styles.marginBottom) || 0;
  return rect.height + marginTop + marginBottom;
}
/**
 * 获取元素相对于文档的偏移位置
 * 类似 jQuery 的 offset()
 */
export function offset(element: HTMLElement | null): { top: number; left: number } {
  if (!element) return { top: 0, left: 0 };
  const rect = element.getBoundingClientRect();
  return {
    top: rect.top + window.scrollY,
    left: rect.left + window.scrollX,
  };
}

/**
 * 设置元素相对于文档的偏移位置
 * 类似 jQuery 的 offset({ top, left })
 */
export function setOffset(
  element: HTMLElement | null,
  position: { top?: number; left?: number }
): void {
  if (!element) return;
  
  const currentOffset = offset(element);
  const parent = element.offsetParent as HTMLElement;
  
  let parentOffset = { top: 0, left: 0 };
  if (parent) {
    parentOffset = offset(parent);
    parentOffset.top += parseFloat(window.getComputedStyle(parent).borderTopWidth) || 0;
    parentOffset.left += parseFloat(window.getComputedStyle(parent).borderLeftWidth) || 0;
  }
  
  const styles = window.getComputedStyle(element);
  const marginTop = parseFloat(styles.marginTop) || 0;
  const marginLeft = parseFloat(styles.marginLeft) || 0;
  
  if (position.top !== undefined) {
    const newTop = position.top - parentOffset.top - marginTop;
    element.style.top = `${newTop}px`;
  }
  if (position.left !== undefined) {
    const newLeft = position.left - parentOffset.left - marginLeft;
    element.style.left = `${newLeft}px`;
  }
}

/**
 * 获取元素相对于父元素的偏移位置
 * 类似 jQuery 的 position()
 */
export function position(element: HTMLElement | null): { top: number; left: number } {
  if (!element) return { top: 0, left: 0 };
  return {
    top: element.offsetTop,
    left: element.offsetLeft,
  };
}

/**
 * 获取元素的滚动位置
 * 类似 jQuery 的 scrollTop() / scrollLeft()
 */
export function scroll(element: HTMLElement | Window | null): { top: number; left: number } {
  if (!element) return { top: 0, left: 0 };
  
  if (element === window) {
    return {
      top: window.scrollY || window.pageYOffset,
      left: window.scrollX || window.pageXOffset,
    };
  }
  
  const el = element as HTMLElement;
  return {
    top: el.scrollTop,
    left: el.scrollLeft,
  };
}

/**
 * 设置元素的滚动位置
 * 类似 jQuery 的 scrollTop(value) / scrollLeft(value)
 */
export function setScroll(
  element: HTMLElement | Window | null,
  scrollPos: { top?: number; left?: number }
): void {
  if (!element) return;
  
  if (element === window) {
    if (scrollPos.top !== undefined) {
      window.scrollTo(window.scrollX, scrollPos.top);
    }
    if (scrollPos.left !== undefined) {
      window.scrollTo(scrollPos.left, window.scrollY);
    }
    return;
  }
  
  const el = element as HTMLElement;
  if (scrollPos.top !== undefined) {
    el.scrollTop = scrollPos.top;
  }
  if (scrollPos.left !== undefined) {
    el.scrollLeft = scrollPos.left;
  }
}

/**
 * 获取元素的 offsetParent
 * 类似 jQuery 的 offsetParent()
 */
export function offsetParent(element: HTMLElement | null): HTMLElement | null {
  if (!element) return null;
  
  let parent = element.offsetParent;
  
  // 如果没有定位的父元素，返回 body 或 html
  if (!parent) {
    parent = document.body;
  }
  
  // 处理 fixed 定位的元素
  const position = window.getComputedStyle(element).position;
  if (position === 'fixed') {
    return document.documentElement;
  }
  
  return parent;
}

/**
 * 统一的尺寸获取接口
 */
export const dimensions = {
  width,
  innerWidth,
  outerWidth,
  outerWidthWithMargin,
  height,
  innerHeight,
  outerHeight,
  outerHeightWithMargin,
};
