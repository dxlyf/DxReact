<!-- <template>
  <t-menu
   theme="light"
    :value="activeMenu"
    :expanded="expanded"
    @change="handleMenuChange"
    @expand="handleExpand"
    class="h-full"
  >
  <template v-if="hasLogo" #logo>
  <slot name="logo"></slot>
    </template>
  <nav-menu-item v-for="item in menuItems" :key="item.key" :item="item"></nav-menu-item>
  </t-menu>
</template> -->
<template></template>
<script lang="ts">
import { ref, watch, h,watchEffect, useSlots, renderSlot,Fragment, shallowRef, defineComponent, toRefs, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { MenuItem as MenuItemType } from 'src/stores/menu'
// import NavMenuItem from './NavMenuItem.vue'
import { Menu, MenuItem, Submenu,Icon } from 'tdesign-vue-next'
interface Props {
  menuItems: MenuItemType[]
}

 export default defineComponent<Props>({
  name: 'SideNavMenu',
  props: {
    menuItems: {
      type: Array,
      default: () => [] as MenuItemType[],
    }
  },
  setup(props,ctx) {
    const route = useRoute()
    const router = useRouter()
    const activeMenu = ref(route.path)
    const expanded = shallowRef([])
    const {menuItems}=toRefs(props)

    const getExpandedKeys = (path:string) => {
      const p=path.split('/')
      const keys:string[]=[]
      for(let i=1;i<p.length-1;i++){
        keys.push('/'+p.slice(1,i+1).join('/'))
      }
      return keys
    }
    watch(()=>route.path, (newPath) => {
      activeMenu.value = newPath
      expanded.value=getExpandedKeys(newPath)
      //console.log('expanded.value',getExpandedKeys(newPath))
    },{
      immediate:true
    })
    
    const handleMenuChange = (value: any) => {
      router.push(value)
    }
    const handleExpand = (value: any[]) => {
      expanded.value = value
      console.log('ss', JSON.stringify(value))
    }
    const renderMenuItem = (item: MenuItemType) => {
      
      if (item.children) {
        return h(Submenu, {
          key: item.path,
          value: item.path,
        }, {
          icon: () => h(Icon, {
            name: item.icon,
          }),
          title: () => item.title,
          content: () => renderMenuItems(item.children),
        })
      }

      return h(MenuItem, {
        key: item.path,
        value: item.path,
        to: item.path,
      }, {
        icon: () => h(Icon, {
            name: item.icon,
        }),
        default: () => item.title
      })
    }
    const renderMenuItems = (menuItems: MenuItemType[]) => {
      return menuItems.map((item) => renderMenuItem(item))
    }
    return ()=>{
       return h(Menu,{
        value: activeMenu.value,
        expanded: expanded.value,
        theme: 'light',
        onChange: handleMenuChange,
        onExpand: handleExpand,
       }, {
            logo: () => renderSlot(ctx.slots, 'logo'),
            default: () => renderMenuItems(menuItems.value),
        })
    }
  }
})
</script>

<style scoped>
/* 自定义样式 */
</style>
