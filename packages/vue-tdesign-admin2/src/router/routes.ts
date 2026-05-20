import type { RouteRecordRaw } from 'vue-router'

export const publicRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    name:"Login",
    component: () => import('@/views/login/LoginPage.vue'),
    meta: { public:true },
  }
]

const excludePaths = new Set<string>([
  '../views/login/index.vue'
])

const pageModules = import.meta.glob(
  ['../views/**/*.vue', '!../views/**/components/**', '!../views/**/_*.vue'],
  { eager: false },
)

function kebabCase(str: string): string {
  return str.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '')
}

const autoChildren: RouteRecordRaw[] = []

for (const [filePath, loader] of Object.entries(pageModules)) {
  if (excludePaths.has(filePath)) continue

  const normalized = filePath.replace(/\\/g, '/')
  const match = normalized.match(/\.\.\/views\/(.+)\.vue$/)
  if (!match) continue

  const relative = match[1]
  const segments = relative.split('/')
  const fileName = segments[segments.length - 1]
  if (fileName.toLowerCase() === 'index') {
    const parentDir = segments[segments.length - 2]
    if (!parentDir) continue
    autoChildren.push({
      path:segments.slice(0,-1).join('/'),
    //  name: parentDir,
      component: loader as () => Promise<any>,
    })
  } else {
    const dirPrefix = segments.slice(0, -1).map(s => s.toLowerCase()).join('/')
    const fileKebab = kebabCase(fileName)
    const childPath = dirPrefix ? `${dirPrefix}/${fileKebab}` : fileKebab
    autoChildren.push({
      path: childPath,
     // name: fileName,
      component: loader as () => Promise<any>,
    })
  }
}

export const constantRoutes: RouteRecordRaw[] = [
  ...publicRoutes,
  {
    path: '/',
    component: () => import('@/layouts/DefaultLayout.vue'),
    redirect: '/dashboard',
    meta: { requiresAuth: true },
    children: autoChildren,
  },
]
