import { ref,toRef,shallowReadonly,isReactive,type ShallowReactive,type MaybeRef, computed, shallowReactive} from "vue";
import type {MenuProps} from 'tdesign-vue-next'
import {useRoute} from 'vue-router'

export type MenuDataItem={
    title:string,
    path:string,
    icon?:string,
    children?:MenuDataItem[]
}
export type UseMenuProps={
    menuProps?:ShallowReactive<MenuProps>|MenuProps
}
const defaultMenuData:MenuDataItem[]=[
{
    path: '/dashboard',
    icon: 'dashboard',
    title: '仪表盘'
  },
  {
    path: '/users',
    icon: 'user',
    title: '用户管理'
  },
  {
    path: '/example',
    icon: 'table',
    title: '示例',
    children: [
      {
        path: '/example/components',
        icon: 'table',
        title: '组件',
        children: [
          {
            path: '/example/components/comps',
            icon: 'table',
            title: '组件集合'
          },{
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
export const useMenu=(props:UseMenuProps={})=>{
    const {menuProps:propMenuProps}=props
    const route=useRoute()

    const getExpandedKeys=()=>{
        const keys: string[] = []
        const paths=route.path.split('/')
        for(let i=1;i<paths.length-1;i++){
            keys.push('/'+paths.slice(1,i+1).join('/'))
        }
        return keys
    }
    const state=shallowReactive({
        collapsed:false,
        activeKey:route.path,
        expandedKeys:getExpandedKeys(),
        menuData:defaultMenuData
    })
    const onChange:MenuProps['onChange']=(value)=>{
        state.activeKey=value as string
        console.log(state.activeKey)
    }
    const onExpand:MenuProps['onExpand']=(keys)=>{
        state.expandedKeys=keys as string[]
    }
    const menuProps=computed(()=>{
        return {
            collapsed:state.collapsed,
            value:state.activeKey,
            expanded:state.expandedKeys,
            onChange:onChange,
            onExpand:onExpand,
            ...propMenuProps,

        }
    })

    return [menuProps,state] as const
}
