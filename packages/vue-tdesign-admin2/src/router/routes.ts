// src/router/fileRoutes.ts
import type { RouteRecordRaw } from 'vue-router';
import type { Component } from 'vue';

// -------------------- 元信息类型 --------------------
interface RouteMeta {
  /** 相对于 pages 目录的文件路径，如 'users/[id].vue' */
  relativePath: string;
  /** 组件异步加载函数 */
  loader: () => Promise<{ default: Component }>;
  /** 所在目录，根目录用 '' 表示，如 'users' */
  dir: string;
  /** 文件名，不含路径，如 '[id].vue' */
  fileName: string;
  /** 是否为布局文件 _layout.vue */
  isLayout: boolean;
  /** 是否为索引文件 index.vue */
  isIndex: boolean;
  /** 转换后的绝对路由路径，如 '/users/:id' */
  absoluteRoutePath: string;
}

// -------------------- 工具函数 --------------------
/**
 * 将文件路径片段转换为路由路径片段
 * 例如 'users/[id].vue' → 'users/:id'
 * 但注意：这里只转换“相对自身目录”的部分，最终拼接成绝对路径。
 */
function segmentToRoutePath(segment: string): string {
  return segment
    .replace(/\.vue$/, '')
    .replace(/\[\.{3}(\w+)\]/g, ':$1(.*)*')   // [...slug] → :slug(.*)*
    .replace(/\[(\w+)\]/g, ':$1');             // [id] → :id
}

// -------------------- 路由生成 --------------------
export function generateRoutes(): RouteRecordRaw[] {
  // 1. 获取所有页面模块（懒加载）
  const modules = import.meta.glob('../pages/**/*.vue');

  // 2. 解析为 RouteMeta 数组，并预先计算所有必要信息
  const records: RouteMeta[] = [];

  for (const [fullPath, importer] of Object.entries(modules)) {
    // 提取相对于 pages 的路径： '../pages/users/[id].vue' → 'users/[id].vue'
    const relativePath = fullPath.replace('../pages/', '');
    const parts = relativePath.split('/');
    const fileName = parts.pop()!;              // 文件名
    const dir = parts.join('/');                // 目录（可能为 ''）

    const isLayout = fileName === '_layout.vue';
    const isIndex = fileName === 'index.vue';

    // 根据所在目录 + 文件名计算绝对路由路径
    const dirPath = dir ? `/${segmentToRoutePath(dir)}` : '';
    let routePath = dirPath;
    if (!isIndex) {
      // 非索引文件追加自己的路径片段
      routePath += `/${segmentToRoutePath(fileName)}`;
    } else {
      // 如果是索引文件，路径即目录本身（如果目录为空则为 '/'）
      if (!dir) routePath = '/';
    }

    records.push({
      relativePath,
      loader: importer,
      dir,
      fileName,
      isLayout,
      isIndex,
      absoluteRoutePath: routePath,
    });
  }

  // 3. 按目录分组（建立目录 -> 文件列表的映射）
  const dirMap = new Map<string, RouteMeta[]>();
  for (const record of records) {
    const dir = record.dir;
    if (!dirMap.has(dir)) dirMap.set(dir, []);
    dirMap.get(dir)!.push(record);
  }

  // 4. 递归构建路由树
  function buildRoutes(currentDir: string, parentLayoutRoutePath?: string): RouteRecordRaw[] {
    const entries = dirMap.get(currentDir) || [];

    // 分离布局和普通页面
    const layout = entries.find(r => r.isLayout);
    const pages = entries.filter(r => !r.isLayout);

    // 当前目录下的叶子路由（不含子目录）
    const leafRoutes: RouteRecordRaw[] = pages.map(r => {
      // 计算该路由在父布局下的相对路径
      let relativePath = r.absoluteRoutePath;
      if (parentLayoutRoutePath) {
        // 去掉父布局的路径前缀，得到相对路径
        // 例如 absoluteRoutePath = '/blog/post/:postId', parentLayoutRoutePath = '/blog'
        // 相对路径 = '/post/:postId' → 去掉首斜杠 'post/:postId'
        relativePath = r.absoluteRoutePath.slice(parentLayoutRoutePath.length);
        if (relativePath.startsWith('/')) relativePath = relativePath.slice(1);
      } else {
        // 没有父布局，直接使用绝对路径并去掉首斜杠（作为顶级路径）
        relativePath = r.absoluteRoutePath.slice(1);  // 去掉开头的 '/'
      }
      // 如果是索引文件且 relativePath 为空，则设为 ''（用于 children 的索引路由）
      if (r.isIndex && relativePath === '') {
        relativePath = ''; // 保持空字符串
      }

      return {
        path: relativePath,
        component: r.loader,
        // 你可以在这里添加 meta 等
      };
    });

    // 获取当前目录的所有子目录（只找直接子目录）
    const subDirs = new Set<string>();
    for (const [dir] of dirMap) {
      if (dir === currentDir) continue;
      // 例如 currentDir = ''，dir = 'users' 或 'blog/post'，
      // 我们需要只取紧邻的下一级目录
      const prefix = currentDir ? currentDir + '/' : '';
      if (dir.startsWith(prefix) && dir !== currentDir) {
        const subDir = dir.slice(prefix.length).split('/')[0];
        subDirs.add(subDir);
      }
    }

    // 递归处理每个子目录
    for (const subDir of subDirs) {
      const subDirFullPath = currentDir ? `${currentDir}/${subDir}` : subDir;
      // 子目录可能也有自己的 _layout.vue
      const subLayout = (dirMap.get(subDirFullPath) || []).find(r => r.isLayout);
      const childRoutes = buildRoutes(subDirFullPath, subLayout ? `/${subDirFullPath}` : parentLayoutRoutePath);

      if (subLayout) {
        // 使用布局组件包裹子路由
        leafRoutes.push({
          path: subDir,
          component: subLayout.loader,
          children: childRoutes,
        });
      } else {
        // 没有布局，直接展开子路由（但需要确保路径正确）
        // 注意：此时子路由的 relativePath 已经是相对于父布局或顶级路径的
        // 由于没有布局，直接将子路由提升到当前层级，需要调整路径前缀
        const promotedRoutes = childRoutes.map(r => ({
          ...r,
          //path: `${subDir}/${r.path}`,  // 补上目录前缀
        }));
        leafRoutes.push(...promotedRoutes);
      }
    }

    return leafRoutes;
  }

  const routeTree = buildRoutes('');

  // 5. 处理根布局（src/pages/_layout.vue）的情况
  const rootLayout = records.find(r => r.dir === '' && r.isLayout);
  if (rootLayout) {
    return [
      {
        path: '/',
        component: rootLayout.loader,
        children: routeTree,
      },
    ];
  }

  // 没有根布局，直接返回顶级路由，并将 path 补全为 '/xxx'
  return routeTree.map(r => ({
    ...r,
    path: '/' + r.path,
  }));
}