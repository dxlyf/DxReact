import { ref, toRef, shallowReadonly, isReactive, type ShallowReactive, type MaybeRef, computed, shallowReactive, type MaybeRefOrGetter, unref, toValue } from "vue";
import type { MenuProps } from 'tdesign-vue-next'
import { useRoute, matchedRouteKey } from 'vue-router'
import {type MenuDataItem,menuData as RouteMenuData} from '@/router'
export type {
  MenuDataItem
}
export type UseMenuProps = {
  menuProps?: Partial<MenuProps>
}
// const defaultMenuData: MenuDataItem[] = [
//   {
//     key: 'dashboard',
//     path: '/dashboard',
//     icon: 'dashboard',
//     title: '仪表盘'
//   },
//   {
//     key: 'users',
//     path: '/users',
//     icon: 'user',
//     title: '用户管理'
//   },
//   {
//     key: 'example',
//     icon: 'table',
//     title: '示例',
//     children: [
//       {
//         key: 'components',
//         icon: 'table',
//         title: '组件',
//         children: [
//           {
//             key: 'comps',
//             path: '/example/components/comps',
//             icon: 'table',
//             title: '组件集合'
//           }, {
//             key: 'list',
//             path: '/example/components/list',
//             icon: 'table',
//             title: '列表'
//           }
//         ]
//       }
//     ]
//   },
//   {
//     path: '/system',
//     icon: 'setting',
//     title: '系统管理',
//     children: [
//       {
//         icon: 'usergroup',
//         title: '角色管理',
//         path: '/system/role'
//       },
//       {
//         path: '/system/permission',
//         icon: 'lock-on',
//         title: '权限管理'
//       }
//     ]
//   },
//   {
//     path: '/settings',
//     icon: 'setting',
//     title: '设置'
//   }
// ]
const normalizeMenuData = (menuData: MenuDataItem[], parent?: MenuDataItem) => {
  return menuData.map((item) => {
    const newItem = {
      key: item.path,
      menuKey: item.menuKey || item.path,
      ...item
    }
    if (parent) {
      newItem.menuKey = parent.menuKey + '_' + newItem.menuKey
      const parentKeys = parent.parentKeys?.concat(parent.menuKey) || [parent.menuKey]
     // const parentMenuKeys = parent.parentMenuKeys || [parent.key]
      newItem.parentKeys = parentKeys
      //newItem.parentMenuKeys = parentMenuKeys.concat(parentKeys.concat(newItem.key).join('_'))
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
export const useMenu = (props: MaybeRefOrGetter<UseMenuProps>={}) => {

  const propMenuProps = toRef(()=>toValue(props).menuProps)
  const route = useRoute()

  const getExpandedKeys = () => {
    const keys: string[] = []
    const menu = flatMenuData.find((item) => item.menuKey === route.meta.menuKey)
    console.log(menu)
    if (menu&&menu.parentKeys) {
      keys.push(...menu.parentKeys)
    }
    return keys
  }
  const flatMenuData = getFlatMenuData(RouteMenuData)
  const state = shallowReactive({
    collapsed: false,
    activeKey: route.meta.menuKey || '',
    expandedKeys: getExpandedKeys(),
    menuData: RouteMenuData,
    flatMenuData: flatMenuData
  })
  const handleChange: MenuProps['onChange'] = (value) => {
    state.activeKey = value as string
    console.log(state.activeKey)
  }
  const handleExpand: MenuProps['onExpand'] = (keys) => {
    state.expandedKeys = keys as string[]
  }
  const menuProps = computed(() => {
    return {
      collapsed: state.collapsed,
      value: state.activeKey,
      expanded: state.expandedKeys,
      onChange: handleChange,
      onExpand: handleExpand,
      ...(propMenuProps.value??{}),

    }
  })

  return [menuProps, state] as const
}
