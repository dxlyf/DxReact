// ============================================================================
// SchemaForm 全部类型定义
// ============================================================================

import type { Component } from 'vue';

/** 字段类型：字符串 / 数字 / 下拉 / 文本域 / 日期 / 对象 / 数组 / 字符串数组 / 自定义 / 表格 */
export type FieldType =
  | 'string'
  | 'number'
  | 'select'
  | 'textarea'
  | 'date'
  | 'object'
  | 'array'
  | 'array<string>'
  | 'custom'
  | 'table';

/** 下拉值：单选为 string | number，多选为数组 */
export type SelectValue = string | number | Array<string | number>;

/** 字段路径，形如 ['user','address','city'] 或 ['list', 0, 'name'] */
export type FieldPath = (string | number)[];

/**
 * 标签与控件的排布方式：
 * - vertical：标签在上、控件在下（默认）
 * - horizontal：标签在左、控件在右
 * 仅作用于基础字段（string / number / select / textarea / date / custom），
 * object / array 字段自带卡片结构，不受影响。
 */
export type LabelLayout = 'vertical' | 'horizontal';

/** 隐藏值暂存区：key 为路径点号连接（数组用索引），value 为被隐藏字段的值 */
export type HiddenValues = Record<string, any>;

/** 基础字段，所有字段类型的公共属性 */
export interface BaseField {
  /** 字段唯一标识，同时作为 value 中的属性名 */
  key: string;
  /** 显示名 */
  label: string;
  type: FieldType;
  /** 仅 object/array 有效，默认 false（展开） */
  defaultCollapsed?: boolean;
  /**
   * 透传给底层 TDesign 组件的 props（如 select 的 options / multiple / filterable，
   * textarea 的 autosize / maxlength，date 的 enableTimePicker / format 等）。
   * 优先级高于组件内置的显式绑定，可覆盖 placeholder 等。
   */
  props?: Record<string, any>;
}

/** 字符串字段 */
export interface StringField extends BaseField {
  type: 'string';
  placeholder?: string;
  defaultValue?: string;
}

/** 数字字段 */
export interface NumberField extends BaseField {
  type: 'number';
  placeholder?: string;
  min?: number;
  max?: number;
  defaultValue?: number;
}

/** 下拉字段：选项 / 多选等通过 props 配置（如 props: { options: [...], multiple: true }） */
export interface SelectField extends BaseField {
  type: 'select';
  placeholder?: string;
  defaultValue?: SelectValue;
}

/** 文本域字段 */
export interface TextareaField extends BaseField {
  type: 'textarea';
  placeholder?: string;
  defaultValue?: string;
}

/** 日期字段：日期 / 日期区间等通过 props 配置（如 props: { enableTimePicker: true }） */
export interface DateField extends BaseField {
  type: 'date';
  placeholder?: string;
  defaultValue?: string | string[];
}

/**
 * 自定义字段：渲染任意组件，不受内置类型限制。
 * - component：全局注册的组件名（如 't-input' / 't-select' / 't-table'）或组件对象
 * - 其余配置（options / data / columns / autosize 等）一律通过 props 透传
 */
export interface CustomField extends BaseField {
  type: 'custom';
  /** 组件名（需全局注册）或组件对象 */
  component: string | Component;
  /**
   * 是否与表单值双向绑定，默认 true。
   * t-input / t-select 等表单组件用默认值；t-table 等只读组件设为 false。
   */
  bindValue?: boolean;
  defaultValue?: any;
}

/** 对象字段：内部可嵌套任意子字段 */
export interface ObjectField extends BaseField {
  type: 'object';
  /** 预设字段列表 */
  fields: FieldSchema[];
  /** 默认显示的字段 key；不传 = 全部显示 */
  defaultVisible?: string[];
  /** 是否允许切换字段显隐，默认 true */
  togglable?: boolean;
  /** 是否允许手输新增字段，默认 true */
  allowAddField?: boolean;
}

/** 数组字段：每一项本质是一个固定结构的 object */
export interface ArrayField extends BaseField {
  type: 'array';
  /** 每一项的字段结构（每项本质是一个 object，固定不可增删） */
  itemFields: FieldSchema[];
  /** 初始项数，默认 0 */
  defaultValueCount?: number;
  /** 最大项数；不传 = 无限制 */
  maxItems?: number;
  /** tab 是否可拖拽排序，默认 false */
  sortable?: boolean;
  /** 是否可移除项，默认 true */
  removable?: boolean;
  /** tab 标题，默认「项 N」 */
  getItemLabel?: (index: number, item: any) => string;
}

/**
 * 字符串数组字段：每一项本质是一个字符串（非 object），
 * 结构与 ArrayField 类似（添加/删除/拖拽排序），但每项渲染一个文本域（默认）或单行文本输入框。
 */
export interface StringArrayField extends BaseField {
  type: 'array<string>';
  /** 每项控件类型：'textarea' 文本域（默认） | 'text' 单行文本输入框 */
  itemType?: 'textarea' | 'text';
  /** 每项控件的占位提示 */
  placeholder?: string;
  /** 初始项数，默认 0 */
  defaultValueCount?: number;
  /** 最大项数；不传 = 无限制 */
  maxItems?: number;
  /** tab 是否可拖拽排序，默认 false */
  sortable?: boolean;
  /** 是否可移除项，默认 true */
  removable?: boolean;
  /** 是否可添加项，默认 true */
  addable?: boolean;
  /** tab 标题，默认「序号. 值」或「项 N」 */
  getItemLabel?: (index: number, item: any) => string;
  /** 初始值（优先级高于 defaultValueCount） */
  defaultValue?: string[];
}

/** 表格列支持的单元格控件类型（与基础字段一致，另加 custom） */
export type TableColumnType = 'string' | 'number' | 'select' | 'textarea' | 'date' | 'custom';
/** 表格列配置 */
export interface TableColumn {
  /** 列 key，对应行对象属性名 */
  key: string;
  /** 列标题 */
  title: string;
  /** 列宽，数字按 px 处理，如 120 或 '120px' */
  width?: string | number;
  /** 单元格控件类型，默认 'string' */
  type?: TableColumnType;
  /** 控件透传 props（如 select 的 options、date 的 format 等） */
  props?: Record<string, any>;
  /** 仅 custom：组件名（需全局注册）或组件对象 */
  component?: string | Component;
  /** 仅 custom：是否与行值双向绑定，默认 true（t-table 等只读组件设为 false） */
  bindValue?: boolean;
  /** 单元格占位提示 */
  placeholder?: string;
  /** 该列默认值（新增行时使用） */
  defaultValue?: any;
}

/** 表格字段：以表格形式编辑「行对象数组」，每列可指定控件类型 */
export interface TableField extends BaseField {
  type: 'table';
  /** 列配置 */
  columns: TableColumn[];
  /** 初始行数，默认 0 */
  defaultValueCount?: number;
  /** 最大行数；不传 = 无限制 */
  maxItems?: number;
  /** 是否可拖拽排序（启用后最左侧显示拖拽列），默认 false */
  sortable?: boolean;
  /** 是否可删除行，默认 true（最右侧显示操作列） */
  removable?: boolean;
  /** 是否可添加行，默认 true（表格下方显示「添加行」） */
  addable?: boolean;
}

/** 字段联合类型 */
export type FieldSchema =
  | StringField
  | NumberField
  | SelectField
  | TextareaField
  | DateField
  | CustomField
  | ObjectField
  | ArrayField
  | StringArrayField
  | TableField;

/** 运行时通过手输新增的字段，第一版固定为 string 类型 */
export interface RuntimeAddedField extends StringField {
  __runtimeAdded: true;
}

/**
 * schema 入参：既可以是字段数组（多字段表单），
 * 也可以是单个字段（等价于只含该字段的数组）。
 * 仅当「直接传入单个 array 字段对象」时，modelValue 走数组根模式；
 * 若传入的是数组（含 [{ type: 'array' }] 形态），则仍为对象模式。
 */
export type SchemaFormSchema = FieldSchema | FieldSchema[];

/** 组件 Props */
export interface SchemaFormProps {
  /** 初始 schema：字段数组，或单个字段 */
  schema: SchemaFormSchema;
  /**
   * 表单值（受控），只放「可见字段」的值。
   * 通常为与 schema 同构的对象；仅当 schema 直接传入单个 array 字段时，
   * 直接传该字段的数组（数组根模式）。
   */
  modelValue: Record<string, any> | any[];
  /** 隐藏值暂存区（可选，受控）；不传则组件内部维护 */
  hiddenValues?: HiddenValues;
  /** 基础字段标签与控件的排布方式，默认 'vertical' */
  labelLayout?: LabelLayout;
}

/** 组件 Emits */
export interface SchemaFormEmits {
  /** 表单值变化（数组根模式下为数组） */
  (e: 'update:modelValue', value: Record<string, any> | any[]): void;
  /** 隐藏值暂存区变化（仅在传入 hiddenValues 时使用） */
  (e: 'update:hiddenValues', value: HiddenValues): void;
  /** 手输新增字段后回传最新 schema */
  (e: 'schema-change', schema: FieldSchema[]): void;
}

/**
 * 顶层实例向下提供的上下文：供所有嵌套子组件（ObjectField / ArrayField /
 * 递归的 SchemaForm）共享同一份值读写与隐藏值存储。
 */
export interface SchemaFormContext {
  /** 按路径读取表单值 */
  getValue: (path: FieldPath) => any;
  /** 按路径写入表单值 */
  setValue: (path: FieldPath, value: any) => void;
  /** 按路径删除表单值 */
  removeValue: (path: FieldPath) => void;
  /** 按路径读取隐藏值 */
  getHidden: (path: FieldPath) => any;
  /** 按路径写入隐藏值 */
  setHidden: (path: FieldPath, value: any) => void;
  /** 按路径删除隐藏值 */
  deleteHidden: (path: FieldPath) => void;
  /** 取出并删除隐藏值（取值同时清除） */
  takeHidden: (path: FieldPath) => any;
  /** 批量合并隐藏值 */
  mergeHidden: (values: HiddenValues) => void;
  /** 回传最新 schema（顶层持有 schema 副本） */
  emitSchemaChange: () => void;
  /** 基础字段标签与控件的排布方式（由顶层 SchemaForm 的 props 提供） */
  labelLayout: LabelLayout;
}

/** 提供 / 注入上下文的 key */
export const SCHEMA_FORM_KEY: symbol = Symbol('SCHEMA_FORM_KEY');
