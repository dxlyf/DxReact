import { ref, toRef, shallowReadonly, isReactive, type ShallowReactive, type MaybeRef, computed, shallowReactive } from "vue";
import type { MenuProps } from 'tdesign-vue-next'
import { useRoute, matchedRouteKey } from 'vue-router'

export type MenuDataItem = {
  key?: string,
  title: string,
  path?: string,
  icon?: string,
  menuKey?: string,
  parentKeys?: string[],
  parentMenuKeys?: string[],
  children?: MenuDataItem[]
}
export type UseMenuProps = {
  menuProps?: ShallowReactive<MenuProps> | MenuProps
}
const defaultMenuData: MenuDataItem[] = [
  {
    key: 'dashboard',
    path: '/dashboard',
    icon: 'dashboard',
    title: '仪表盘'
  },
  {
    key: 'users',
    path: '/users',
    icon: 'user',
    title: '用户管理'
  },
  {
    key: 'example',
    icon: 'table',
    title: '示例',
    children: [
      {
        key: 'components',
        icon: 'table',
        title: '组件',
        children: [
          {
            key: 'comps',
            path: '/example/components/comps',
            icon: 'table',
            title: '组件集合'
          }, {
            key: 'list',
            path: '/example/components/list',
            icon: 'table',
            title: '列表'
          }
        ]
      }
    ]
  },
  {
    path: '/system',
    icon: 'setting',
    title: '系统管理',
    children: [
      {
        icon: 'usergroup',
        title: '角色管理',
        path: '/system/role'
      },
      {
        path: '/system/permission',
        icon: 'lock-on',
        title: '权限管理'
      }
    ]
  },
  {
    path: '/settings',
    icon: 'setting',
    title: '设置'
  }
]
const normalizeMenuData = (menuData: MenuDataItem[], parent?: MenuDataItem) => {
  return menuData.map((item) => {
    const newItem = {
      key: item.path,
      menuKey: item.key || item.path,
      ...item
    }
    if (parent) {
      newItem.menuKey = parent.menuKey + '_' + newItem.menuKey
      const parentKeys = parent.parentKeys?.concat(parent.key) || [parent.key]
      const parentMenuKeys = parent.parentMenuKeys || [parent.key]
      newItem.parentKeys = parentKeys
      newItem.parentMenuKeys = parentMenuKeys.concat(parentMenuKeys.concat(newItem.key))
    }
    if (newItem.children) {
      newItem.children = normalizeMenuData(newItem.children, newItem)
    }
    return newItem
  })
}
const getFlatMenuData = (menuData: MenuDataItem[]) => {
  const flatMenuData: MenuDataItem[] = []
  menuData.forEach((item) => {
    flatMenuData.push(item)
    if (item.children) {
      flatMenuData.push(...getFlatMenuData(item.children))
    }
  })
  return flatMenuData
}
export const useMenu = (props: UseMenuProps = {}) => {
  const { menuProps: propMenuProps } = props
  const route = useRoute()

  const getExpandedKeys = () => {
    const keys: string[] = []
    const menu = flatMenuData.find((item) => item.menuKey === route.meta.menuKey)
    console.log('menu',menu)
    if (menu) {
      keys.push(...menu.parentMenuKeys)
    }
    return keys
  }
  const menuData = normalizeMenuData(defaultMenuData)
  const flatMenuData = getFlatMenuData(menuData)
  const state = shallowReactive({
    collapsed: false,
    activeKey: route.meta,
    expandedKeys: getExpandedKeys(),
    menuData: menuData,
    flatMenuData: flatMenuData
  })
  const onChange: MenuProps['onChange'] = (value) => {
    state.activeKey = value as string
    console.log(state.activeKey)
  }
  const onExpand: MenuProps['onExpand'] = (keys) => {
    state.expandedKeys = keys as string[]
  }
  const menuProps = computed(() => {
    return {
      collapsed: state.collapsed,
      value: state.activeKey,
      expanded: state.expandedKeys,
      onChange: onChange,
      onExpand: onExpand,
      ...propMenuProps,

    }
  })

  return [menuProps, state] as const
}
