<script setup lang="ts">
// ============================================================================
// SchemaForm：顶层入口 / 递归渲染器
// - 顶层实例：持有值上下文，深拷贝 schema，遍历分发渲染
// - 嵌套实例（被 ObjectField / ArrayField 复用）：直接使用父级上下文
// ============================================================================
import { computed, inject, markRaw, provide, reactive, ref, type Component } from 'vue';
import CollapseCard from './components/CollapseCard.vue';
import { useSchemaForm } from './composables/useSchemaForm';
import ArrayField from './fields/ArrayField.vue';
import CustomField from './fields/CustomField.vue';
import DateField from './fields/DateField.vue';
import NumberField from './fields/NumberField.vue';
import ObjectField from './fields/ObjectField.vue';
import SelectField from './fields/SelectField.vue';
import StringArrayField from './fields/StringArrayField.vue';
import StringField from './fields/StringField.vue';
import TableField from './fields/TableField.vue';
import TextareaField from './fields/TextareaField.vue';
import {
  SCHEMA_FORM_KEY,
  type FieldPath,
  type FieldSchema,
  type FieldType,
  type HiddenValues,
  type LabelLayout,
  type SchemaFormContext,
  type SchemaFormEmits,
  type SchemaFormProps,
} from './types';
import { deepClone } from './utils/value';

interface Props {
  /** 字段数组，或单个字段（单字段等价于只含该字段的数组） */
  schema: FieldSchema | FieldSchema[];
  /** 当前渲染层级相对根节点的路径（嵌套时由父级传入） */
  path?: FieldPath;
  /** 顶层必传：表单值（受控）；schema 直接传单个 array 字段时直接传数组 */
  modelValue?: Record<string, any> | any[];
  /** 可选：隐藏值暂存区（受控） */
  hiddenValues?: HiddenValues;
  /** 基础字段标签与控件的排布方式，默认 'vertical' */
  labelLayout?: LabelLayout;
  /** 顶层标题：传入时用可折叠卡片（SchemaCollapseCard）包裹整个表单 */
  title?: string;
}
const props = withDefaults(defineProps<Props>(), {
  path: () => [],
  labelLayout: 'vertical',
});

const emit = defineEmits<SchemaFormEmits>();

// 类型 -> 组件 的分发映射
const FIELD_MAP = {
  string: markRaw(StringField),
  number: markRaw(NumberField),
  select: markRaw(SelectField),
  textarea: markRaw(TextareaField),
  date: markRaw(DateField),
  custom: markRaw(CustomField),
  object: markRaw(ObjectField),
  array: markRaw(ArrayField),
  'array<string>': markRaw(StringArrayField),
  table: markRaw(TableField),
} as const;
function fieldComponent(field: FieldSchema): Component {
  return FIELD_MAP[field.type] as Component;
}

// 通过 inject 判断是否嵌套：只有顶层实例才创建并 provide 上下文
const parentCtx = inject<SchemaFormContext | null>(SCHEMA_FORM_KEY, null);
const isRoot = parentCtx === null;

// schema 归一化为字段数组：允许外部直接传单个字段（等价于只含该字段的数组）
const schemaList = computed<FieldSchema[]>(() =>
  Array.isArray(props.schema) ? props.schema : [props.schema],
);

// 顶层持有的 schema 响应式副本（运行时新增字段会写入此处并回传）
const rootSchema = ref<FieldSchema[] | null>(null);
let ctx: SchemaFormContext;

if (isRoot) {
  const formSchema = reactive(deepClone(schemaList.value)) as FieldSchema[];
  rootSchema.value = formSchema;
  const result = useSchemaForm(
    props as unknown as SchemaFormProps,
    emit,
    () => formSchema,
  );
  ctx = result.ctx;
  provide(SCHEMA_FORM_KEY, ctx);
} else {
  ctx = parentCtx as SchemaFormContext;
}

// 顶层渲染响应式副本，嵌套直接渲染父级传入的 schema
const renderSchema = computed<FieldSchema[]>(() =>
  isRoot && rootSchema.value ? rootSchema.value : schemaList.value,
);

// 传入 title（且为顶层）时用可折叠卡片包裹，收起状态由组件内部持有
const collapsed = ref(false);
const showCard = computed(() => isRoot && !!props.title);

// array / object / array<string> / table 均为「块级」字段（自带卡片/表格结构），统一通过 CSS 设置上间距
const BLOCK_FIELD_TYPES: FieldType[] = ['array', 'object', 'array<string>', 'table'];
function isBlockField(field: FieldSchema): boolean {
  return BLOCK_FIELD_TYPES.includes(field.type);
}
</script>

<template>
  <CollapseCard v-if="showCard" v-model:collapsed="collapsed" :title="title">
    <div class="schema-form">
      <template v-if="renderSchema.length">
        <component
          :is="fieldComponent(field)"
          v-for="field in renderSchema"
          :key="field.key"
          :field="field"
          :path="[...path, field.key]"
          :class="{ 'schema-field-block': isBlockField(field) }"
        />
      </template>
      <div v-else-if="isRoot" class="text-center text-gray-400 py-6 text-sm">暂无字段</div>
    </div>
  </CollapseCard>

  <div v-else class="schema-form">
    <template v-if="renderSchema.length">
      <component
        :is="fieldComponent(field)"
        v-for="field in renderSchema"
        :key="field.key"
        :field="field"
        :path="[...path, field.key]"
        :class="{ 'schema-field-block': isBlockField(field) }"
      />
    </template>
    <div v-else-if="isRoot" class="text-center text-gray-400 py-6 text-sm">暂无字段</div>
  </div>
</template>

<style scoped>
/* array / object / array<string> / table 字段统一上间距 16px */
.schema-field-block {
  margin-top: 16px;
}
</style>
