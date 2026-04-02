// 类型定义
type Path = string | number | symbol;
type PathValue<T, P extends Path> = any; // 简化的类型，实际会更复杂

// 辅助函数：将路径字符串转换为路径数组
function toPath(path: Path | readonly Path[]): Path[] {
  if (Array.isArray(path)) {
    return path;
  }
  
  // 处理字符串路径，支持点号和数组索引
  // 例如: 'a.b[0].c' -> ['a', 'b', '0', 'c']
  const stringPath = String(path);
  const result: Path[] = [];
  
  let i = 0;
  let j = 0;
  let inBracket = false;
  
  while (i < stringPath.length) {
    const char = stringPath[i];
    
    if (char === '[') {
      if (i > j) {
        result.push(stringPath.slice(j, i));
      }
      j = i + 1;
      inBracket = true;
    } else if (char === ']') {
      if (i > j) {
        const bracketValue = stringPath.slice(j, i);
        // 处理数字索引
        result.push(/^\d+$/.test(bracketValue) ? Number(bracketValue) : bracketValue);
      }
      j = i + 1;
      inBracket = false;
    } else if (char === '.' && !inBracket) {
      if (i > j) {
        result.push(stringPath.slice(j, i));
      }
      j = i + 1;
    }
    
    i++;
  }
  
  if (j < stringPath.length && !inBracket) {
    result.push(stringPath.slice(j));
  }
  
  return result;
}

// 辅助函数：检查值是否为对象
function isObject(value: any): value is object {
  return value !== null && typeof value === 'object';
}

/**
 * 获取对象路径的值
 * @param object 源对象
 * @param path 路径（字符串、数组或符号）
 * @param defaultValue 默认值
 * @returns 路径对应的值或默认值
 */
function get<T = any>(
  object: any,
  path: Path | readonly Path[],
  defaultValue?: T
): T {
  if (!isObject(object)) {
    return defaultValue as T;
  }
  
  const pathArray = toPath(path);
  let current = object;
  
  for (let i = 0; i < pathArray.length; i++) {
    const key = pathArray[i];
    
    if (current == null || !isObject(current)) {
      return defaultValue as T;
    }
    
    current = current[key];
  }
  
  return current !== undefined ? current : (defaultValue as T);
}

/**
 * 设置对象路径的值
 * @param object 目标对象
 * @param path 路径（字符串、数组或符号）
 * @param value 要设置的值
 * @returns 修改后的对象
 */
function set<T extends object>(
  object: T,
  path: Path | readonly Path[],
  value: any
): T {
  if (!isObject(object)) {
    return object;
  }
  
  const pathArray = toPath(path);
  let current = object;
  
  for (let i = 0; i < pathArray.length - 1; i++) {
    const key = pathArray[i];
    const nextKey = pathArray[i + 1];
    
    // 如果当前路径不存在，创建对象或数组
    if (current[key] == null || typeof current[key] !== 'object') {
      // 判断下一个键是否为数字索引，决定创建数组还是对象
      current[key] = typeof nextKey === 'number' || /^\d+$/.test(String(nextKey)) 
        ? [] 
        : {};
    }
    
    current = current[key];
  }
  
  // 设置最后一个路径的值
  const lastKey = pathArray[pathArray.length - 1];
  current[lastKey] = value;
  
  return object;
}

/**
 * 检查对象路径是否存在
 * @param object 源对象
 * @param path 路径
 * @returns 是否存在
 */
function has(object: any, path: Path | readonly Path[]): boolean {
  if (!isObject(object)) {
    return false;
  }
  
  const pathArray = toPath(path);
  let current = object;
  
  for (let i = 0; i < pathArray.length; i++) {
    const key = pathArray[i];
    
    if (current == null || !Object.prototype.hasOwnProperty.call(current, key)) {
      return false;
    }
    
    current = current[key];
  }
  
  return true;
}

/**
 * 删除对象路径的值
 * @param object 源对象
 * @param path 路径
 * @returns 是否删除成功
 */
function unset(object: any, path: Path | readonly Path[]): boolean {
  if (!isObject(object)) {
    return false;
  }
  
  const pathArray = toPath(path);
  let current = object;
  
  for (let i = 0; i < pathArray.length - 1; i++) {
    const key = pathArray[i];
    
    if (current[key] == null || !isObject(current[key])) {
      return false;
    }
    
    current = current[key];
  }
  
  const lastKey = pathArray[pathArray.length - 1];
  
  if (Object.prototype.hasOwnProperty.call(current, lastKey)) {
    delete current[lastKey];
    return true;
  }
  
  return false;
}

// 使用示例
const obj = {
  a: {
    b: {
      c: 42,
      d: [1, 2, 3]
    }
  },
  users: [
    { name: 'Alice', age: 30 },
    { name: 'Bob', age: 25 }
  ]
};

// Get 示例
console.log(get(obj, 'a.b.c'));              // 42
console.log(get(obj, ['a', 'b', 'c']));      // 42
console.log(get(obj, 'a.b.x', 'default'));   // 'default'
console.log(get(obj, 'users[0].name'));      // 'Alice'
console.log(get(obj, 'users.1.age'));        // 25

// Set 示例
set(obj, 'a.b.c', 100);
console.log(obj.a.b.c);                      // 100

set(obj, 'x.y.z', 'new value');
console.log(obj.x.y.z);                      // 'new value'

set(obj, 'arr[0]', 'first');
console.log(obj.arr[0]);                     // 'first'

// Has 示例
console.log(has(obj, 'a.b.c'));              // true
console.log(has(obj, 'a.b.x'));              // false

// Unset 示例
unset(obj, 'a.b.c');
console.log(has(obj, 'a.b.c'));              // false

// 更复杂的类型示例
interface User {
  name: string;
  age: number;
  address?: {
    city: string;
    street: string;
  };
}

const user: User = {
  name: 'John',
  age: 30,
  address: {
    city: 'New York',
    street: '5th Ave'
  }
};

