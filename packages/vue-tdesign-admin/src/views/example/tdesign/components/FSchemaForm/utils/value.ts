// ============================================================================
// 值工具：路径读写、默认值构建、深拷贝、类型判断
// ============================================================================

import { markRaw } from 'vue';
import type {
  FieldPath,
  FieldSchema,
  ArrayField,
  ObjectField,
  StringArrayField,
  TableColumn,
  TableField,
} from '../types';

/** 是否为普通对象（排除数组 / null / Date 等） */
export function isPlainObject(val: unknown): val is Record<string, any> {
  return Object.prototype.toString.call(val) === '[object Object]';
}

/**
 * 判断是否为 Vue 组件（函数组件或选项对象）。
 * 自定义字段可传入组件对象，此类值不可深拷贝、也不应转为响应式，
 * 否则会触发 "made a reactive object" 警告甚至渲染异常。
 */
function isComponent(val: unknown): boolean {
  if (typeof val === 'function') return true;
  if (isPlainObject(val)) {
    const o = val as Record<string, any>;
    return '__name' in o || 'setup' in o || 'render' in o || '__file' in o;
  }
  return false;
}

/** 把字段路径序列化为隐藏值 key，数组用索引：['list',0,'name'] -> 'list.0.name' */
export function pathToKey(path: FieldPath): string {
  return path.join('.');
}

/**
 * 深拷贝：保留函数引用（如 getItemLabel），仅递归克隆普通对象与数组。
 * 组件对象直接 markRaw 后原样返回，不作为普通对象克隆。
 * 注意：不处理 Date / Map / Set 等特殊类型，schema 场景不涉及。
 */
export function deepClone<T>(val: T): T {
  if (val === null || typeof val !== 'object') return val;
  if (isComponent(val)) return markRaw(val as object) as T;
  if (Array.isArray(val)) return val.map((item) => deepClone(item)) as unknown as T;
  const out: Record<string, any> = {};
  for (const key of Object.keys(val as Record<string, any>)) {
    out[key] = deepClone((val as Record<string, any>)[key]);
  }
  return out as T;
}

/** 按路径读取值；任一中间节点不存在则返回 undefined */
export function getByPath(target: any, path: FieldPath): any {
  let cur = target;
  for (const seg of path) {
    if (cur === null || cur === undefined) return undefined;
    cur = cur[seg];
  }
  return cur;
}

/** 按路径写入值；中间节点不存在时按后续段类型自动创建数组或对象 */
export function setByPath(target: any, path: FieldPath, value: any): void {
  if (path.length === 0) return;
  let cur = target;
  for (let i = 0; i < path.length - 1; i++) {
    const seg = path[i];
    const nextSeg = path[i + 1];
    if (cur[seg] === null || cur[seg] === undefined || typeof cur[seg] !== 'object') {
      cur[seg] = typeof nextSeg === 'number' ? [] : {};
    }
    cur = cur[seg];
  }
  cur[path[path.length - 1]] = value;
}

/** 按路径删除值 */
export function deleteByPath(target: any, path: FieldPath): void {
  if (path.length === 0) return;
  const parent = getByPath(target, path.slice(0, -1));
  if (parent === null || parent === undefined || typeof parent !== 'object') return;
  delete parent[path[path.length - 1]];
}

/** 根据单个字段的 schema 构建其默认值 */
export function buildFieldDefault(field: FieldSchema): any {
  switch (field.type) {
    case 'string':
      return field.defaultValue ?? '';
    case 'number':
      return field.defaultValue;
    case 'select':
      // 多选默认空数组，单选默认空字符串
      return field.defaultValue ?? (field.props?.multiple ? [] : '');
    case 'textarea':
    case 'date':
      return field.defaultValue ?? '';
    case 'custom':
      return field.defaultValue;
    case 'object':
      return buildFieldsDefault((field as ObjectField).fields);
    case 'array':
      return buildArrayItemsDefault(field as ArrayField);
    case 'array<string>':
      return buildStringArrayDefault(field as StringArrayField);
    case 'table':
      return buildTableItemsDefault(field as TableField);
    default:
      return undefined;
  }
}

/** 由一组字段构建对象默认值 */
export function buildFieldsDefault(fields: FieldSchema[]): Record<string, any> {
  const obj: Record<string, any> = {};
  for (const field of fields) obj[field.key] = buildFieldDefault(field);
  return obj;
}

/** 根据数组字段的 defaultValueCount 构建初始项数组 */
export function buildArrayItemsDefault(field: ArrayField): Record<string, any>[] {
  const count = field.defaultValueCount ?? 0;
  const items: Record<string, any>[] = [];
  for (let i = 0; i < count; i++) items.push(buildFieldsDefault(field.itemFields));
  return items;
}

/** 根据字符串数组字段的 defaultValue / defaultValueCount 构建初始项数组 */
export function buildStringArrayDefault(field: StringArrayField): string[] {
  if (field.defaultValue) return [...field.defaultValue];
  const count = field.defaultValueCount ?? 0;
  return Array.from({ length: count }, () => '');
}

/** 根据表格列配置构建一行默认值 */
export function buildTableRowDefault(columns: TableColumn[]): Record<string, any> {
  const row: Record<string, any> = {};
  for (const col of columns) {
    const field = {
      key: col.key,
      label: col.title,
      type: col.type ?? 'string',
      props: col.props,
      defaultValue: col.defaultValue,
    } as unknown as FieldSchema;
    row[col.key] = buildFieldDefault(field);
  }
  return row;
}

/** 根据表格字段的 defaultValueCount 构建初始行数组 */
export function buildTableItemsDefault(field: TableField): Record<string, any>[] {
  const count = field.defaultValueCount ?? 0;
  const items: Record<string, any>[] = [];
  for (let i = 0; i < count; i++) items.push(buildTableRowDefault(field.columns));
  return items;
}
