/**
 * 创建一个带类型的 Symbol 键
 */
export function createHiddenKey<T>(description: string): symbol & { __type?: T } {
  return Symbol(description) as symbol & { __type?: T };
}

/**
 * 在对象上定义 Symbol 隐藏字段
 */
export function defineSymbolField<T extends object, V>(
  target: T,
  key: symbol,
  value: V,
): T & { [key: symbol]: V } {
  Object.defineProperty(target, key, {
    value,
    enumerable: false, // Symbol 默认就不枚举，这里显式写上
    writable: true,
    configurable: true,
  });
  return target as T & { [key: symbol]: V };
}

/**
 * 取出对象上所有不可枚举的自有属性（字符串 + Symbol）
 */
export function getHiddenKeys(obj: object): (string | symbol)[] {
  const allKeys = [
    ...Object.getOwnPropertyNames(obj),
    ...Object.getOwnPropertySymbols(obj),
  ];
  return allKeys.filter((key) => {
    const desc = Object.getOwnPropertyDescriptor(obj, key);
    return desc ? !desc.enumerable : false;
  });
}

/**
 * 读取单个隐藏字段（类型安全版）
 */
export function getHidden<T extends object, K extends keyof T>(
  obj: T,
  key: K,
): T[K] | undefined {
  const desc = Object.getOwnPropertyDescriptor(obj, key as string | symbol);
  if (!desc || desc.enumerable) return undefined;
  return desc.value as T[K];
}

export function defineHiddenReadonly<T extends object, K extends string, V>(
  target: T,
  key: K,
  value: V,
): Readonly<T & Record<K, V>> {
  Object.defineProperty(target, key, {
    value,
    enumerable: false,
    writable: false,
    configurable: false,
  });
  return target as Readonly<T & Record<K, V>>;
}

/**
 * 一次性给对象挂多个隐藏字段
 */
export function defineHiddenAll<T extends object, H extends Record<string, unknown>>(
  target: T,
  hidden: H,
  options: { writable?: boolean; configurable?: boolean } = {},
): T & H {
  for (const key of Object.keys(hidden) as (keyof H & string)[]) {
    Object.defineProperty(target, key, {
      value: hidden[key],
      enumerable: false,
      writable: options.writable ?? true,
      configurable: options.configurable ?? true,
    });
  }
  return target as T & H;
}

/**
 * 在对象上定义一个不可枚举属性（Object.keys / for...in / JSON.stringify 都看不到）
 * 返回同一个对象的类型
 */
export function defineHidden<T extends object, K extends string, V>(
  target: T,
  key: K,
  value: V,
  options: { writable?: boolean; configurable?: boolean } = {},
): T & Record<K, V> {
  Object.defineProperty(target, key, {
    value,
    enumerable: false, // 关键
    writable: options.writable ?? true,
    configurable: options.configurable ?? true,
  });
  return target as T & Record<K, V>;
}