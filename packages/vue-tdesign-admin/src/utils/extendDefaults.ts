
/**
 * 深拷贝一个值
 */
function deepClone<T>(value: T): T {
  if (value === null || typeof value !== 'object') {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => deepClone(item)) as unknown as T;
  }
  const cloned: Record<string, any> = {};
  for (const key of Object.keys(value as Record<string, any>)) {
    cloned[key] = deepClone((value as Record<string, any>)[key]);
  }
  return cloned as T;
}

/**
 * 将 defaults 对象/数组中目标缺失或为 null/undefined 的属性填充到 target 中
 * @param target - 目标对象或数组
 * @param defaults - 默认值对象或数组
 * @returns 填充后的 target
 */
const extendDefaults = (target: any, defaults: any): any => {
  // 如果 target 为 null 或 undefined，返回 defaults 的深拷贝
  if (target === null || target === undefined) {
    return deepClone(defaults);
  }

  // 如果 defaults 为 null 或 undefined，直接返回 target
  if (defaults === null || defaults === undefined) {
    return target;
  }

  // 处理数组
  if (Array.isArray(target) && Array.isArray(defaults)) {
    for (let i = 0; i < defaults.length; i++) {
      if (i >= target.length || target[i] === null || target[i] === undefined) {
        target[i] = deepClone(defaults[i]);
      } else if (typeof target[i] === 'object' && typeof defaults[i] === 'object') {
        extendDefaults(target[i], defaults[i]);
      }
    }
    return target;
  }

  // 处理普通对象
  if (typeof target === 'object' && typeof defaults === 'object') {
    for (const key of Object.keys(defaults)) {
      if (!(key in target) || target[key] === null || target[key] === undefined) {
        target[key] = deepClone(defaults[key]);
      } else if (typeof target[key] === 'object' && typeof defaults[key] === 'object') {
        extendDefaults(target[key], defaults[key]);
      }
    }
    return target;
  }

  // 对于原始类型或类型不匹配的情况，直接返回 target
  return target;
};