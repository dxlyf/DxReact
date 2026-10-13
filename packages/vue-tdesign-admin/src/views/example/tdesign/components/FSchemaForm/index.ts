// ============================================================================
// FSchemaForm 对外导出
// ============================================================================

// 顶层入口组件
export { default as SchemaForm } from './SchemaForm.vue';

// 全部类型定义
export * from './types';

// 组合式函数（如需在外部复用）
export { useSchemaForm } from './composables/useSchemaForm';
export { useHiddenValues } from './composables/useHiddenValues';
export { useFieldLayout } from './composables/useFieldLayout';

// 通用子组件
export { default as SchemaCollapseCard } from './components/CollapseCard.vue';
export { default as SchemaFieldPopover } from './components/FieldPopover.vue';

// 字段渲染组件
export { default as SchemaStringField } from './fields/StringField.vue';
export { default as SchemaNumberField } from './fields/NumberField.vue';
export { default as SchemaSelectField } from './fields/SelectField.vue';
export { default as SchemaTextareaField } from './fields/TextareaField.vue';
export { default as SchemaDateField } from './fields/DateField.vue';
export { default as SchemaCustomField } from './fields/CustomField.vue';
export { default as SchemaObjectField } from './fields/ObjectField.vue';
export { default as SchemaArrayField } from './fields/ArrayField.vue';
export { default as SchemaStringArrayField } from './fields/StringArrayField.vue';
export { default as SchemaTableField } from './fields/TableField.vue';
