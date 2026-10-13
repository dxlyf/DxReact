<script setup lang="ts">
// ============================================================================
// SchemaForm 示例页：mock schema + 默认值，可直接运行
// 路由（自动生成）：/example/tdesign/schemaform
// ============================================================================
import { ref } from 'vue';
import { SchemaForm, type FieldSchema, type LabelLayout } from '../components/FSchemaForm';

// ---- mock schema ----
const schema: FieldSchema[] = [
  { key: 'title', label: '标题', type: 'string', placeholder: '请输入标题', defaultValue: '' },
  { key: 'count', label: '数量', type: 'number', placeholder: '请输入数量', min: 0, max: 100, defaultValue: 1 },

  // 下拉：选项通过 props 透传给 t-select
  {
    key: 'category',
    label: '分类',
    type: 'select',
    placeholder: '请选择分类',
    defaultValue: 'fruit',
    props: {
      options: [
        { label: '水果', value: 'fruit' },
        { label: '蔬菜', value: 'vegetable' },
        { label: '肉类', value: 'meat' },
      ],
    },
  },

  // 下拉（多选）：multiple / filterable 通过 props 配置
  {
    key: 'tags',
    label: '标签',
    type: 'select',
    placeholder: '可多选',
    props: {
      multiple: true,
      filterable: true,
      options: [
        { label: '热销', value: 'hot' },
        { label: '新品', value: 'new' },
        { label: '推荐', value: 'recommend' },
      ],
    },
  },

  // 文本域：autosize / maxlength 通过 props 配置
  {
    key: 'description',
    label: '描述',
    type: 'textarea',
    placeholder: '请输入描述',
    defaultValue: '',
    props: { autosize: { minRows: 2, maxRows: 4 }, maxlength: 200 },
  },

  // 日期：enableTimePicker / format 通过 props 配置
  {
    key: 'publishDate',
    label: '发布时间',
    type: 'date',
    placeholder: '请选择日期',
    props: { enableTimePicker: true, format: 'YYYY-MM-DD HH:mm' },
  },

  // 自定义：渲染全局注册组件 t-input，默认与表单值双向绑定
  {
    key: 'customInput',
    label: '自定义组件（t-input）',
    type: 'custom',
    component: 't-input',
    defaultValue: '',
    props: { placeholder: '通过 custom 类型渲染的 t-input', clearable: true },
  },

  // 自定义：t-table 只读展示，bindValue 关闭，data / columns 通过 props 传入
  {
    key: 'customTable',
    label: '自定义组件（t-table，只读）',
    type: 'custom',
    component: 't-table',
    bindValue: false,
    props: {
      rowKey: 'id',
      data: [
        { id: 1, name: '苹果', qty: 2 },
        { id: 2, name: '香蕉', qty: 5 },
      ],
      columns: [
        { colKey: 'name', title: '名称' },
        { colKey: 'qty', title: '数量' },
      ],
    },
  },

  // 对象：默认仅显示 name / age，address 被预设隐藏（值会被剥离到暂存区）
  {
    key: 'user',
    label: '用户信息',
    type: 'object',
    defaultVisible: ['name', 'age'],
    fields: [
      { key: 'name', label: '姓名', type: 'string', defaultValue: '' },
      { key: 'age', label: '年龄', type: 'number', min: 0, max: 200, defaultValue: 18 },
      {
        key: 'address',
        label: '地址',
        type: 'object',
        defaultCollapsed: true,
        fields: [
          { key: 'city', label: '城市', type: 'string', defaultValue: '' },
          { key: 'zip', label: '邮编', type: 'string', defaultValue: '' },
        ],
      },
    ],
  },

  // 数组：可拖拽排序、最多 5 项、tab 标题取自 name
  {
    key: 'items',
    label: '技术规格（Tech Specs）',
    type: 'array',
    defaultValueCount: 2,
    maxItems: 5,
    sortable: true,
    getItemLabel: (index, item) => (item?.name ? `${index + 1}. ${item.name}` : `项 ${index + 1}`),
    itemFields: [
      { key: 'name', label: '名称', type: 'string', defaultValue: '' },
      { key: 'qty', label: '数量', type: 'number', min: 1, max: 999, defaultValue: 1 },
      // 数组项内再嵌套对象，验证多层递归
      {
        key: 'extra',
        label: '附加信息',
        type: 'object',
        fields: [{ key: 'note', label: '备注', type: 'string', defaultValue: '' }],
      },
    ],
  },

  // 表格：可配置列（列名/标题/宽度/单元格控件类型），最右操作列删除行，
  // 下方「添加行」，sortable 时最左侧显示拖拽列支持拖拽排序
  {
    key: 'specTable',
    label: '规格表格',
    type: 'table',
    sortable: true,
    defaultValueCount: 2,
    maxItems: 5,
    columns: [
      { key: 'name', title: '名称', type: 'string', width: 160, placeholder: '请输入名称' },
      { key: 'qty', title: '数量', type: 'number', width: 120, defaultValue: 1 },
      {
        key: 'unit',
        title: '单位',
        type: 'select',
        width: 120,
        props: {
          options: [
            { label: '个', value: 'pcs' },
            { label: '件', value: 'box' },
          ],
        },
      },
      // custom 列：渲染任意全局注册组件
      {
        key: 'note',
        title: '备注（custom）',
        type: 'custom',
        component: 't-input',
        props: { placeholder: '自定义控件' },
      },
    ],
  },

  // 字符串数组：每项为一个文本域（默认），可拖拽排序、最多 5 项，props 透传给每项控件
  {
    key: 'keywords',
    label: '关键词（字符串数组 - 文本域）',
    type: 'array<string>',
    defaultValueCount: 2,
    maxItems: 5,
    sortable: true,
    placeholder: '请输入关键词',
    props: { autosize: { minRows: 1, maxRows: 3 }, maxlength: 100 },
  },

  // 字符串数组：itemType='text' 时每项为单行文本输入框
  {
    key: 'aliases',
    label: '别名（字符串数组 - 单行输入）',
    type: 'array<string>',
    itemType: 'text',
    defaultValueCount: 1,
    placeholder: '请输入别名',
  },
];

// ---- 表单值（受控）；故意带上隐藏字段 address 的值，验证首次挂载剥离 ----
const formValue = ref<Record<string, any>>({
  title: '示例标题',
  count: 3,
  category: 'fruit',
  tags: ['hot'],
  description: '',
  publishDate: '',
  customInput: '初始值（自定义组件）',
  user: {
    name: '张三',
    age: 28,
    address: { city: '北京', zip: '100000' }, // 默认隐藏 → 应被剥离到 hiddenValues
  },
  items: [
    { name: '苹果', qty: 2, extra: { note: '红色' } },
    { name: '香蕉', qty: 5, extra: { note: '黄色' } },
  ],
  specTable: [
    { name: '苹果', qty: 2, unit: 'pcs', note: '红色' },
    { name: '香蕉', qty: 5, unit: 'box', note: '黄色' },
  ],
  keywords: ['品牌', '热销'],
  aliases: ['别名A'],
});

// ---- 隐藏值暂存区（受控）----
const hiddenValues = ref<Record<string, any>>({});

// ---- 基础字段标签布局（默认垂直）----
const labelLayout = ref<LabelLayout>('vertical');

function onSchemaChange(next: FieldSchema[]) {
  console.log('[schema-change]', next);
}

function reset() {
  formValue.value = {
    title: '示例标题',
    count: 3,
    category: 'fruit',
    tags: ['hot'],
    description: '',
    publishDate: '',
    customInput: '初始值（自定义组件）',
    user: { name: '张三', age: 28, address: { city: '北京', zip: '100000' } },
    items: [
      { name: '苹果', qty: 2, extra: { note: '红色' } },
      { name: '香蕉', qty: 5, extra: { note: '黄色' } },
    ],
    specTable: [
      { name: '苹果', qty: 2, unit: 'pcs', note: '红色' },
      { name: '香蕉', qty: 5, unit: 'box', note: '黄色' },
    ],
    keywords: ['品牌', '热销'],
    aliases: ['别名A'],
  };
  hiddenValues.value = {};
}
</script>

<template>
  <div class="p-6 max-w-4xl mx-auto flex flex-col gap-6">
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-semibold text-gray-800">SchemaForm 示例</h2>
      <div class="flex items-center gap-3">
        <t-radio-group v-model="labelLayout" variant="default-filled" size="small">
          <t-radio-button value="vertical">标签垂直</t-radio-button>
          <t-radio-button value="horizontal">标签水平</t-radio-button>
        </t-radio-group>
        <t-button theme="primary" variant="outline" size="small" @click="reset">重置</t-button>
      </div>
    </div>

    <div class="border border-solid border-gray-200 rounded-md p-4 bg-white">
      <SchemaForm
        v-model="formValue"
        v-model:hidden-values="hiddenValues"
        :schema="schema"
        :label-layout="labelLayout"
        @schema-change="onSchemaChange"
      />
    </div>

    <div class="grid grid-cols-2 gap-4">
      <div>
        <div class="text-sm font-medium text-gray-600 mb-1">modelValue（可见值）</div>
        <pre class="text-xs bg-[#f5f6f8] p-3 rounded overflow-auto max-h-80">{{
          JSON.stringify(formValue, null, 2)
        }}</pre>
      </div>
      <div>
        <div class="text-sm font-medium text-gray-600 mb-1">hiddenValues（隐藏值暂存区）</div>
        <pre class="text-xs bg-[#f5f6f8] p-3 rounded overflow-auto max-h-80">{{
          JSON.stringify(hiddenValues, null, 2)
        }}</pre>
      </div>
    </div>
  </div>
</template>
