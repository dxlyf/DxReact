<script setup lang="ts">
import { computed, ref, VNode,h, type Component } from 'vue'


export interface Column<T = any> {
    /** 唯一标识，对应 data 中的字段名 */
    key: string
    /** 表头文字 */
    title: string
    /** 列宽，如 '100px' | '20%'，不传则自适应 */
    width?: string|number
    /** 最小列宽 */
    minWidth?: string|number
    /** 冻结方向：left / right，不传则不冻结 */
    fixed?: 'left' | 'right' | false
    /** 对齐方式 */
    align?: 'left' | 'center' | 'right'
    /** 自定义组件 */
    type?: string|Component
    /** 自定义组件 props */
    props?: Record<string, any>
    /** 自定义单元格渲染函数 */
    render?: (h: any, row: T, index: number, col: Column) => VNode | string | number
    /** 自定义 class */
    className?: string
}

/* ---------- 计算冻结列 ---------- */
interface ComputedColumn extends Column {
    /** 左侧偏移量（px），左冻结列才有 */
    leftOffset: number
    /** 右侧偏移量（px），右冻结列才有 */
    rightOffset: number
    /** 是否左冻结 */
    isFixedLeft: boolean
    /** 是否右冻结 */
    isFixedRight: boolean
}

type TableAtomFieldProps<T = any> = {
    columns: Column<T>[]
    modelValue: T[]
    rowHeight?: number
    headerHeight?: number
    stripe?: boolean
    border?: boolean
}
const props = withDefaults(defineProps<TableAtomFieldProps>(), {
    columns: () => [],
    rowHeight: 44,
    headerHeight: 44,
    stripe: false,
    border: true
})
const emit = defineEmits(['update:modelValue'])

/** 按数据列生成一个空行 */
const createEmptyRow = () => {
  const row: Record<string, any> = {}
  props.columns.forEach((col) => {
    row[col.key] = ''
  })
  return row
}
/** 添加行 */
const handleAddRow = () => {
  emit('update:modelValue', [...props.modelValue, createEmptyRow()])
}
/** 删除指定行 */
const handleRemoveRow = (index: number) => {
  emit('update:modelValue', props.modelValue.filter((_row, i) => i !== index))
}


/** 解析列宽为像素（用于计算 sticky left 偏移） */
function parseWidth(width?: string|number): number {
    if(typeof width==='number'){
        return width
    }
    if (!width) return 100
    if (width.endsWith('px')) return parseFloat(width)
    // 百分比/auto 暂按默认值处理（冻结列建议用 px）
    return 100
}
const toCssWidth = (width?: string|number) => {
    if(typeof width==='number'){
        return `${width}px`
    }
    return width
}




const computedColumns = computed<ComputedColumn[]>(() => {
  // 末尾自动追加操作列，默认右冻结
  const columns = props.columns.concat([{
    key: 'operation',
    title: '操作',
    width: 100,
    align: 'center' as const,
    fixed: 'right' as const,
  }])
  // 左冻结列：从左往右累加偏移
  let left = 0
  const result = columns.map((col) => {
    const isFixedLeft = col.fixed === 'left'
    const width = parseWidth(col.width)
    const c: ComputedColumn = {
      ...col,
      isFixedLeft,
      isFixedRight: false,
      leftOffset: isFixedLeft ? left : 0,
      rightOffset: 0,
    }
    if (isFixedLeft) left += width
    return c
  })
  // 右冻结列：从右往左累加偏移
  let right = 0
  for (let i = result.length - 1; i >= 0; i--) {
    const col = result[i]
    if (col.fixed !== 'right') continue
    col.isFixedRight = true
    col.rightOffset = right
    right += parseWidth(col.width)
  }
  return result
})

/* ---------- 列宽（用 colgroup 统一控制） ---------- */
const colStyle = (col: ComputedColumn) => {
  if (col.width) {
    return {
      width: toCssWidth(col.width),
      minWidth: toCssWidth(col.minWidth || col.width),
      maxWidth: toCssWidth(col.width),
    }
  }
  return { minWidth: col.minWidth || '100px' }
}

/* ---------- 表头样式 ---------- */
const thStyle = (col: ComputedColumn) => {
  const s: Record<string, string> = {
    height: props.headerHeight + 'px',
    position: 'sticky',
    // 所有表头都固定 top
    top: '0',
    // 普通表头层级
    zIndex: '3',
  }
  if (col.isFixedLeft) {
    // 左冻结列：固定 left
    s.left = `${col.leftOffset}px`
    s.zIndex = '4'
  }
  if (col.isFixedRight) {
    // 右冻结列：固定 right
    s.right = `${col.rightOffset}px`
    s.zIndex = '4'
  }
  return s
}

/* ---------- 表体单元格样式 ---------- */
const tdStyle = (col: ComputedColumn) => {
  const s: Record<string, string> = {}
  if (col.isFixedLeft) {
    s.position = 'sticky'
    s.left = `${col.leftOffset}px`
    s.zIndex = '2'
  }
  if (col.isFixedRight) {
    s.position = 'sticky'
    s.right = `${col.rightOffset}px`
    s.zIndex = '2'
  }
  return s
}

const alignClass = (align?: string) =>
  align === 'center' ? 'is-center' : align === 'right' ? 'is-right' : 'is-left'

/* ---------- 滚动阴影 ---------- */
const scrollRef = ref<HTMLElement>()
const scrolledLeft = ref(false)
const scrolledRight = ref(false)

function onScroll() {
  const el = scrollRef.value
  if (!el) return
  scrolledLeft.value = el.scrollLeft > 0
  scrolledRight.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 1
}
/** 更新指定列的指定行的值 */
const handleUpdateColumbnValue = (index: number, col: ComputedColumn, value: any) => {
  props.modelValue[index][col.key]=value
  emit('update:modelValue',[...props.modelValue])
}
</script>

<template>
<div class="lt-wrapper" :class="{ 'is-border': border }">
    <div ref="scrollRef" class="lt-scroll" @scroll="onScroll">
      <table class="lt-table" :class="{ 'is-stripe': stripe }">
        <!-- 用 colgroup 统一声明列宽，表头表体天然对齐 -->
        <colgroup>
          <col
            v-for="col in computedColumns"
            :key="col.key"
            :style="colStyle(col)"
          />
        </colgroup>

        <thead>
          <tr>
            <th
              v-for="col in computedColumns"
              :key="col.key"
              :class="[alignClass(col.align), col.className]"
              :style="thStyle(col)"
            >
              <div class="lt-cell-inner">{{ col.title }}</div>
            </th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="(row, rowIndex) in modelValue"
            :key="rowIndex"
            :style="{ height: rowHeight + 'px' }"
            :class="{ 'is-stripe-row': stripe && rowIndex % 2 === 1 }"
          >
            <td
              v-for="col in computedColumns"
              :key="col.key"
              :class="[alignClass(col.align), col.className]"
              :style="tdStyle(col)"
            >
              <div class="lt-cell-inner">
                <template v-if="col.key === 'operation'">
                  <t-button theme="danger" variant="text" size="small" @click="handleRemoveRow(rowIndex)">删除</t-button>
                </template>
                <template v-else-if="col.type">
                  <component :is="col.type" :value="row[col.key]" @change="handleUpdateColumbnValue(rowIndex, col, $event)" v-bind="col.props||{}" />
                </template>
                <template v-else-if="col.render">
                  <component :is="() => col.render!(h,row, rowIndex,col)" />
                </template>
                <slot
                  v-else
                  :name="`cell-${col.key}`"
                  :row="row"
                  :column="col"
                  :index="rowIndex"
                  :value="row[col.key]"
                >
                  {{ row[col.key] }}
                </slot>
              </div>
            </td>
          </tr>

          <tr v-if="!modelValue.length">
            <td :colspan="computedColumns.length" class="lt-empty">
              <slot name="empty">暂无数据</slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="lt-footer">
      <t-button theme="primary" variant="outline" size="small" @click="handleAddRow">添加行</t-button>
    </div>

    <!-- <div v-if="scrolledLeft" class="lt-shadow lt-shadow--left" />
    <div v-if="scrolledRight" class="lt-shadow lt-shadow--right" /> -->
  </div>
</template>

<style scoped>
.lt-wrapper {
  position: relative;
  width: 100%;
  overflow: hidden;
  background: #fff;
}

.lt-scroll {
  width: 100%;
  max-height: 100%;
  overflow: auto;
  will-change: scroll-position;
  -webkit-overflow-scrolling: touch;
}

.lt-table {
  border-collapse: separate; /* ⚠️ 关键！必须 separate，否则 sticky 失效 */
  border-spacing: 0;
  table-layout: fixed;       /* ⚠️ 固定布局，配合 colgroup 精确控制列宽 */
  width: max-content;        /* 让表格按列宽撑开，支持横向滚动 */
  min-width: 100%;
}

/* 表头 */
.lt-table thead th {
  box-sizing: border-box;
  padding: 0 12px;
  font-weight: 600;
  color: #303133;
  background: #f5f7fa;
  border-bottom: 1px solid #ebeef5;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 表体单元格 */
.lt-table tbody td {
  box-sizing: border-box;
  padding: 0 12px;
  color: #606266;
  background: #fff;
  border-bottom: 1px solid #ebeef5;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  vertical-align: middle;
}

/* 冻结列背景：必须不透明，随斑马纹变化 */
.lt-table tbody td[style*="position: sticky"] {
  background: #fff;
}
.lt-table.is-stripe tbody tr.is-stripe-row td {
  background: #fafafa;
}
.lt-table.is-stripe tbody tr.is-stripe-row td[style*="position: sticky"] {
  background: #fafafa;
}

/* 单元格内容包裹层，负责对齐与省略号 */
.lt-cell-inner {
  display: flex;
  align-items: center;
  height: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 对齐 */
.is-left .lt-cell-inner { justify-content: flex-start; text-align: left; }
.is-center .lt-cell-inner { justify-content: center; text-align: center; }
.is-right .lt-cell-inner { justify-content: flex-end; text-align: right; }

/* 边框 */
.is-border .lt-table thead th,
.is-border .lt-table tbody td {
  border-right: 1px solid #ebeef5;
}

/* 空状态 */
.lt-empty {
  height: 176px;
  text-align: center;
  color: #909399;
  font-size: 14px;
}

/* 表格底部操作区 */
.lt-footer {
  display: flex;
  padding: 12px;
  border-top: 1px solid #ebeef5;
}

/* 滚动阴影 */
.lt-shadow {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 12px;
  pointer-events: none;
  z-index: 5;
}
.lt-shadow--left {
  left: 0;
  background: linear-gradient(to right, rgba(0, 0, 0, 0.12), transparent);
}
.lt-shadow--right {
  right: 0;
  background: linear-gradient(to left, rgba(0, 0, 0, 0.12), transparent);
}
</style>