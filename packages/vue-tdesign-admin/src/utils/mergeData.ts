/**
 * 深度合并两个对象
 * @param target 目标对象
 * @param source 源对象
 * @param includePaths 需要合并的字段路径数组，如 ['data.list[0].name', 'data.obj.age']
 * @param excludePaths 不需要合并的字段路径数组，如 ['data.list[1]', 'data.extra']
 * @returns 合并后的新对象
 */
function deepMerge(
  target: any,
  source: any,
  includePaths?: string[],
  excludePaths?: string[]
): any {
  const shouldInclude = (path: string): boolean => {
    if (!includePaths || includePaths.length === 0) return true;
    return includePaths.some(p => path.startsWith(p) || p.startsWith(path));
  };

  const shouldExclude = (path: string): boolean => {
    if (!excludePaths || excludePaths.length === 0) return false;
    return excludePaths.some(p => path.startsWith(p) || p.startsWith(path));
  };

  const merge = (tgt: any, src: any, currentPath: string): any => {
    if (shouldExclude(currentPath)) return tgt;

    if (src === null || src === undefined) return tgt;
    if (tgt === null || tgt === undefined) return src;

    if (typeof src !== 'object' || typeof tgt !== 'object') {
      return shouldInclude(currentPath) ? src : tgt;
    }

    const result = Array.isArray(tgt) ? [...tgt] : { ...tgt };

    for (const key in src) {
      const newPath = currentPath ? `${currentPath}.${key}` : key;
      if (shouldExclude(newPath)) continue;

      if (Array.isArray(src[key]) && Array.isArray(tgt[key])) {
        const arr: any[] = [];
        for (let i = 0; i < Math.max(src[key].length, tgt[key].length); i++) {
          const itemPath = `${newPath}[${i}]`;
          if (i < tgt[key].length && i < src[key].length) {
            arr[i] = merge(tgt[key][i], src[key][i], itemPath);
          } else if (i < src[key].length) {
            arr[i] = shouldInclude(itemPath) ? src[key][i] : tgt[key][i];
          } else {
            arr[i] = shouldInclude(itemPath) ? tgt[key][i] : src[key][i];
          }
        }
        (result as any)[key] = arr;
      } else if (
        typeof src[key] === 'object' &&
        src[key] !== null &&
        typeof tgt[key] === 'object' &&
        tgt[key] !== null
      ) {
        (result as any)[key] = merge(tgt[key], src[key], newPath);
      } else {
        (result as any)[key] = shouldInclude(newPath) ? src[key] : tgt[key];
      }
    }

    return result;
  };

  return merge(target, source, '');
}
