<script setup lang="ts">
import { computed, onMounted, ref, shallowRef, watch } from 'vue'
import { useRoute } from 'vue-router'
import SideSubMenu from './SideSubMenu.vue'
import { MenuItem } from './types'
import { TdMenuProps } from 'tdesign-vue-next'
// const props=withDefaults(defineProps<{
//     items: MenuItem[]
//     expandedKeys: string[]
//     showCollapse: boolean
// }>(),{
//     items: ()=>[],
//     expandedKeys: ()=>[],
//     showCollapse: false
// })
const route = useRoute()
const props=defineProps<{
    modelCollapsed?:boolean
}>()
const emit=defineEmits(['update:collapsed'])
const collapsed = defineModel('collapsed', {
    default: false,
    type: Boolean,
}) // 是否折叠
const menuData = shallowRef<MenuItem[]>([])
const activeKey = ref<string | number>('')
const expandedKeys = ref<(string | number)[]>([])
const searchKeyword = shallowRef('') // 搜索关键词


// 递归添加菜单项的父键值
const assignMenuItemProperties = (data: MenuItem[], parentKeys?: string[]) => {
    return data.map(item => {
        const newItem = { ...item, parentKeys: parentKeys ? parentKeys.slice() : [] } as MenuItem
        if (newItem.children && newItem.children.length > 0) {
            newItem.children = assignMenuItemProperties(newItem.children, newItem.parentKeys.concat(newItem.menuKey))
        }
        return newItem
    })
}
// 递归遍历菜单项并执行回调
const traverseMenuItems = <T extends { children?: T[] }>(data: T[], callback: (item: T, index: number, depth: number) => void, depth = 0) => {
    data.forEach((item, index) => {
        callback(item, index, depth)
        if (item.children && item.children.length > 0) {
            traverseMenuItems(item.children, callback, depth + 1)
        }
    })
}


// 递归扁平化菜单项
const flatDeepMap = <T>(data: T[], callback: (item: T) => T[]) => {
    return data.reduce((prev, cur) => {
        return prev.concat(callback(cur))
    }, [])
}
// 深度过滤菜单项
const filterDeepMap = <T extends { children?: T[] }>(data: T[], callback: (item: T) => boolean): T[] => {
   
    const filterDeep = (items: T[]) => {
        const result: T[] = []
        items.forEach(item => {
            if (callback(item)) {
                const newItem = { ...item }
                if (item.children && item.children.length > 0) {
                    const filteredChildren = filterDeep(item.children)
                    if (filteredChildren.length > 0) {
                        newItem.children = filteredChildren
                        result.push(newItem)
                    }
                } else {
                    result.push(newItem)
                }
            } else if (item.children && item.children.length > 0) {
                const filteredChildren = filterDeep(item.children)
                if (filteredChildren.length > 0) {
                    const newItem = { ...item, children: filteredChildren }
                    result.push(newItem)
                }
            }
        })
        return result
    }
     return filterDeep(data)
}
// 扁平化菜单项
const flatMenuItems = computed<MenuItem[]>(() => {
    return flatDeepMap(menuData.value, item => Array.isArray(item.children) ? [item].concat(item.children) : [item])
})
// 最终显示的菜单项
const filterMenuItems = computed(() => {
    if (searchKeyword.value !== '') {
        return filterDeepMap(menuData.value, item => item.name.includes(searchKeyword.value))
    } else {
        return menuData.value
    }
})
// 当前展示的菜单项
const currentExpandedKeys = computed(() => {
    if(searchKeyword.value !== ''){
        const keys:any[]=[]
        traverseMenuItems(filterMenuItems.value, (item, index, depth) => {
            if(Array.isArray(item.children)&&item.children.length>0||!item.path){
                keys.push(item.menuKey)
            }
        })
        return keys
    }
    return expandedKeys.value
})
/**
 * 处理菜单点击事件
 * @param value 选的菜单键值
 */
const handleMenuChange: TdMenuProps['onChange'] = (value) => {
    activeKey.value = value
}
/**
 * 处理菜单展开事件
 * @param value 展开的菜单键值
 */
const handleExpand: TdMenuProps['onExpand'] = (value) => {
    expandedKeys.value = value
    console.log('value', value)

}
// 切换菜单折叠状态
const handleCollaspe = () => {
    collapsed.value = !collapsed.value
}
/**
 * 同步当前路由的菜单选中状态和展开状态
 */
const syncActiveMenu = () => {
    const path = route.path
    console.log('path', path)
    const item = flatMenuItems.value.find(item => item.path === path)
    if (item) {
        activeKey.value = item.menuKey
        expandedKeys.value = item.parentKeys
    } else {
        const relativeItem = flatMenuItems.value.find(item => item.relativePath?.includes(path))
        if (relativeItem) {
            activeKey.value = relativeItem.menuKey
            expandedKeys.value = relativeItem.parentKeys
        }
    }
}

watch(menuData, () => {
    syncActiveMenu()
}, { immediate: true })

onMounted(() => {
    const mockMenuData: MenuItem[] = [
        {
            menuKey: 'download',
            name: '下载中心',
            icon: 'download',
            children: [
                {
                    menuKey: 'download-app',
                    name: '应用',
                    icon: 'download',
                    path: '/example/tdesign/download/apps',
                    relativePath: [ '/example/tdesign/download/apps/edit']
                }
            ]
        }
    ].concat(Array.from({ length: 20 }, (item, index) => {
        return [{
            menuKey: `download-${index}`,
            name: `下载${index}`,
            icon: 'download',
            children: [
                {
                    menuKey: `download-app-${index}`,
                    name: `应用${index}`,
                    icon: 'download',
                    path: `example/tdesign/download/apps`
                }
            ]
        }]
    }).flat(1))
    menuData.value = assignMenuItemProperties(mockMenuData)
 
})
</script>

<template>
    <div class="f2-sidemenu" :class="{ 'f2-sidemenu-collapsed': collapsed }">
        <div class="f2-sidemenu-search">
            <t-input v-model.trim="searchKeyword" placeholder="搜索">
                <template #prefix-icon>
                    <t-icon name="search" />
                </template>
            </t-input>
        </div>
        <div class="f2-sidemenu-menu">
            <t-menu theme="light" @expand="handleExpand" @change="handleMenuChange" :value="activeKey"
                :collapsed="collapsed" :expand-mutex="false" :expanded="currentExpandedKeys">
                <SideSubMenu :items="filterMenuItems" />
            </t-menu>
        </div>
        <div class="f2-collapse">
            <div class="f2-collapse-btn" @click="handleCollaspe">
                <div class="f2-collapse-icon">
                </div>
            </div>
        </div>
    </div>
</template>
<style>
.f2-sidemenu {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    position: relative;
}

.f2-sidemenu-menu {
    flex: 1;
    min-height: 0;
}

.f2-sidemenu-collapsed .f2-sidemenu-search {
    opacity: 0;
}

.f2-sidemenu-search {
    flex: none;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px 8px;
}

.f2-sidemenu .t-default-menu {
    width: 100% !important;
}

.f2-collapse {
    position: absolute;
    top: 0;
    right: -10px;
    bottom: 0;
    width: 10px;
    --f2-collapse-btn-bg: #ddd;
    --f2-collapse-btn-color: #000;
}

.f2-collapse-btn {
    display: inline;
    position: absolute;
    top: 50%;
    width: 100%;
    transform: translateY(-50%);
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.3s ease-in-out;
}

.f2-collapse:hover .f2-collapse-btn,
.f2-sidemenu:hover .f2-collapse-btn {
    opacity: 1;
}

.f2-collapse-btn:hover {
    --f2-collapse-btn-bg: #0000ff;
    --f2-collapse-btn-color: #fff;
}

.f2-collapse-btn::before {
    content: '';
    display: block;
    width: 100%;
    height: 20px;
    position: relative;
    top: 10px;
    background-color: var(--f2-collapse-btn-bg);
    transform: skewY(20deg);
}

.f2-collapse-btn::after {
    content: '';
    display: block;
    width: 100%;
    height: 20px;
    position: relative;
    top: -10px;
    background-color: var(--f2-collapse-btn-bg);
    transform: skewY(-20deg);
}

.f2-collapse-icon {
    height: 50px;
    background-color: var(--f2-collapse-btn-bg);
    position: relative;

}

.f2-sidemenu:not(.f2-sidemenu-collapsed) .f2-collapse-icon::before {
    content: '';
    display: block;
    width: 0;
    height: 0;
    position: absolute;
    top: 50%;
    right: 2px;

    border-color: transparent;
    border-width: 4px;
    border-style: solid;
    border-right-color: var(--f2-collapse-btn-color);
    transform: translateY(-50%);
}

.f2-sidemenu.f2-sidemenu-collapsed .f2-collapse-icon::after {
    content: '';
    display: block;
    width: 0;
    height: 0;
    position: absolute;
    top: 50%;
    left: 2px;
    border-color: transparent;
    border-width: 4px;
    border-style: solid;
    border-left-color: var(--f2-collapse-btn-color);
    transform: translateY(-50%);
}
.f2-sidemenu .t-menu--scroll::-webkit-scrollbar{
    width: 4px;
}

</style>