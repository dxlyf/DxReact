// ============================================================================
// Schema 工具：默认值补全、字段查找、按默认显隐剥离隐藏值
// ============================================================================

import type { FieldPath, FieldSchema, ObjectField } from '../types';
import {
  isPlainObject,
  buildFieldDefault,
  buildFieldsDefault,
  buildArrayItemsDefault,
} from './value';

/**
 * 递归补全默认值：确保 schema 中每个字段在 value 中都存在。
 * 就地修改传入的 value（调用方需先深拷贝）。
 */
export function applyDefaults(schema: FieldSchema[], value: Record<string, any>): void {
  if (!isPlainObject(value)) return;
  for (const field of schema) {
    // 字段缺失（或显式 undefined）时补默认值
    if (!(field.key in value) || value[field.key] === undefined) {
      value[field.key] = buildFieldDefault(field);
    }
    if (field.type === 'object') {
      if (!isPlainObject(value[field.key])) {
        value[field.key] = buildFieldsDefault((field as ObjectField).fields);
      }
      applyDefaults((field as ObjectField).fields, value[field.key]);
    } else if (field.type === 'array') {
      if (!Array.isArray(value[field.key])) {
        value[field.key] = buildArrayItemsDefault(field as any);
      }
      for (const item of value[field.key]) {
        if (isPlainObject(item)) applyDefaults((field as any).itemFields, item);
      }
    }
  }
}

/** 在字段列表中按 key 查找字段 */
export function findField(schema: FieldSchema[], key: string): FieldSchema | undefined {
  return schema.find((f) => f.key === key);
}

/** 计算 object 字段当前「默认可见」的字段 key 列表（未配置 defaultVisible 则全部可见） */
export function getDefaultVisibleKeys(field: ObjectField): string[] {
  return field.defaultVisible ?? field.fields.map((f) => f.key);
}

/**
 * 首次挂载时，把 modelValue 中「默认隐藏字段」的值剥离到隐藏值暂存区。
 * 就地修改 value 与通过 setHidden 写入暂存区。
 *
 * @param schema  当前层级的字段列表
 * @param value   当前层级的对象值
 * @param path    当前层级相对根节点的路径
 * @param setHidden  写入隐藏值的回调
 */
export function stripHiddenByDefault(
  schema: FieldSchema[],
  value: Record<string, any>,
  path: FieldPath,
  setHidden: (path: FieldPath, val: any) => void,
): void {
  if (!isPlainObject(value)) return;
  for (const field of schema) {
    const childPath: FieldPath = [...path, field.key];
    if (field.type === 'object') {
      const obj = value[field.key];
      if (!isPlainObject(obj)) continue;
      const visibleKeys = getDefaultVisibleKeys(field as ObjectField);
      for (const sub of (field as ObjectField).fields) {
        if (!visibleKeys.includes(sub.key)) {
          // 隐藏字段：值移入暂存区，并从 modelValue 中删除
          if (sub.key in obj) {
            setHidden([...childPath, sub.key], obj[sub.key]);
            delete obj[sub.key];
          }
        }
      }
      // 递归处理可见子字段
      const visibleFields = (field as ObjectField).fields.filter((f) =>
        visibleKeys.includes(f.key),
      );
      stripHiddenByDefault(visibleFields, obj, childPath, setHidden);
    } else if (field.type === 'array') {
      const arr = value[field.key];
      if (!Array.isArray(arr)) continue;
      arr.forEach((item, index) => {
        if (isPlainObject(item)) {
          stripHiddenByDefault((field as any).itemFields, item, [...childPath, index], setHidden);
        }
      });
    }
  }
}
