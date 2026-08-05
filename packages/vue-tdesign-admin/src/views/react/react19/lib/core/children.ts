// ============================================================
// children 工具（对齐 React flattenChildren 语义）
// 在 createElement / jsx 运行时层统一扁平化，reconciler 只处理一维数组
// ============================================================

/** 扁平化 children：递归展开嵌套数组，过滤 null/undefined/boolean */
export function flattenChildren(children: any, result: any[] = []): any[] {
  if (Array.isArray(children)) {
    for (const child of children) {
      flattenChildren(child, result)
    }
  } else if (children !== null && children !== undefined && typeof children !== 'boolean') {
    result.push(children)
  }
  return result
}
