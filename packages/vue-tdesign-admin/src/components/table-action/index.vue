<template>
    <t-space :size="4">
        <t-link size="small" v-for="item in actions.normalItems" :key="item.key" hover="color" :theme="item.theme"
            @click="handleClick(item)">{{ item.label }}</t-link>
        <t-dropdown v-if="actions.moreItems.length"  @click="handleMoreClick" :options="actions.moreItems" trigger="click" position="bl">
            <t-link theme="primary" size="small">
                更多
                <template #suffix> <t-icon name="chevron-down" size="12" /></template>
            </t-link>
        </t-dropdown>
    </t-space>
</template>

<script lang="ts">
import type { DropdownOption } from 'tdesign-vue-next'
import { computed, toRef, type Component } from 'vue'
export type TableActionItem = {
    label: string
    key: string
    order?: number
    theme?: "default" | "primary" | "success" | "warning" | "danger";
    permission?: string | string[]
}
export type TableActionProps = {
    maxShowCount?: number
    items: TableActionItem[]
}
export const defaultTableActions: TableActionItem[] = [
    {
        label: '编辑',
        key: 'edit',
        order: 10
    },
    {
        label: '详情',
        key: 'detail',
        order: 30
    },
    {
        label: '复制',
        key: 'copy',
        order: 50,
    },
    {
        label: '提交',
        key: 'copy',
        order: 60,
    },
    {
        label: '删除',
        key: 'del',
        theme:'danger',
        order: 20
    }
]


export default {
    emits:['itemClick'],
    props: {
        maxShowCount: {
            type: Number,
            default: 3
        },
        items: {
            type: Array,
            default: () => defaultTableActions as TableActionItem[]
        }
    },
    setup(props:TableActionProps,{emit}) {
        const finalItems = computed<TableActionItem[]>(() => {
            const newItems = props.items.map((item, i) => ({ theme: 'primary', order: i, ...item }))
            newItems.sort((a, b) => a.order - b.order)
            return newItems as TableActionItem[]
        })
        const actions = computed(() => {
            const normalItems: TableActionItem[] = [], moreItems: DropdownOption[] = []
            const maxShowCount = props.maxShowCount
            const curMaxShowCount = finalItems.value.length > maxShowCount ? maxShowCount - 1 : maxShowCount
            finalItems.value.forEach((item, index) => {
                if (index < curMaxShowCount) {
                    normalItems.push(item)
                } else {
                    moreItems.push({
                        content: item.label,
                        value: item.key
                    })
                }
            })
            return {
                normalItems,
                moreItems
            }
        })
        const handleClick = (item: TableActionItem) => {
            //this.$emit('click',item)
            emit('itemClick',item)
        }
        const handleMoreClick = (item: DropdownOption) => {
            emit('itemClick',item)
        }
        return {
            actions,
            handleClick,
            handleMoreClick
        }
    }
} as Component
</script>