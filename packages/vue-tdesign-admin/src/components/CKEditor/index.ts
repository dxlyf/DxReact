/**
 * CKEditor 组件统一出口：同时导出 v4 / v5 两套组件及其加载器与类型。
 */

export { default as CKEditor4 } from './v4/CKEditor4.vue'
export { default as CKEditor5 } from './v5/CKEditor5.vue'

export * from './v4'
export * from './v5'
