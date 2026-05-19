<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { TreeInstanceFunctions } from 'tdesign-vue-next'

export type PermissionTreeNodeType = 'directory' | 'menu' | 'api' | 'button'

export type PermissionTreeNode = {
    id: string
    label: string
    type: PermissionTreeNodeType
    children?: PermissionTreeNode[]
    disabled?: boolean
    method?: string
    path?: string
}

export type PermissionTreeProps = {
    modelValue: string[]
    treeData?: PermissionTreeNode[]
}

const props = withDefaults(defineProps<PermissionTreeProps>(), {
    modelValue: () => [],
    treeData: () => []
})

const emit = defineEmits<{
    'update:modelValue': [value: string[]]
    change: [value: string[]]
}>()

const treeRef = ref<TreeInstanceFunctions>()

const methodTagThemeMap: Record<string, string> = {
    GET: 'success',
    POST: 'warning',
    PUT: 'primary',
    DELETE: 'danger',
    PATCH: 'default'
}

const nodeIconMap: Record<PermissionTreeNodeType, string> = {
    directory: 'folder-open',
    menu: 'menu',
    api: 'code',
    button: 'tool'
}

const defaultTreeData: PermissionTreeNode[] = [
    {
        id: 'system',
        label: '系统管理',
        type: 'directory',
        children: [
            {
                id: 'system:user',
                label: '用户管理',
                type: 'menu',
                children: [
                    { id: 'system:user:list', label: '查询', type: 'api', method: 'GET', path: '/api/system/user' },
                    { id: 'system:user:create', label: '新增', type: 'button' },
                    { id: 'system:user:edit', label: '编辑', type: 'button' },
                    { id: 'system:user:delete', label: '删除', type: 'button' }
                ]
            },
            {
                id: 'system:role',
                label: '角色管理',
                type: 'menu',
                children: [
                    { id: 'system:role:list', label: '查询', type: 'api', method: 'GET', path: '/api/system/role' },
                    { id: 'system:role:create', label: '新增', type: 'button' },
                    { id: 'system:role:edit', label: '编辑', type: 'button' },
                    { id: 'system:role:delete', label: '删除', type: 'button' }
                ]
            },
            {
                id: 'system:menu',
                label: '菜单管理',
                type: 'menu',
                children: [
                    { id: 'system:menu:list', label: '查询', type: 'api', method: 'GET', path: '/api/system/menu' },
                    { id: 'system:menu:create', label: '新增', type: 'button' },
                    { id: 'system:menu:edit', label: '编辑', type: 'button' },
                    { id: 'system:menu:delete', label: '删除', type: 'button' }
                ]
            },
            {
                id: 'system:dept',
                label: '部门管理',
                type: 'menu',
                children: [
                    { id: 'system:dept:list', label: '查询', type: 'api', method: 'GET', path: '/api/system/dept' },
                    { id: 'system:dept:create', label: '新增', type: 'button' },
                    { id: 'system:dept:edit', label: '编辑', type: 'button' },
                    { id: 'system:dept:delete', label: '删除', type: 'button' }
                ]
            },
            {
                id: 'system:dict',
                label: '字典管理',
                type: 'menu',
                children: [
                    { id: 'system:dict:list', label: '查询', type: 'api', method: 'GET', path: '/api/system/dict' },
                    { id: 'system:dict:create', label: '新增', type: 'button' },
                    { id: 'system:dict:edit', label: '编辑', type: 'button' },
                    { id: 'system:dict:delete', label: '删除', type: 'button' }
                ]
            },
            {
                id: 'system:log',
                label: '日志管理',
                type: 'menu',
                children: [
                    { id: 'system:log:list', label: '查询', type: 'api', method: 'GET', path: '/api/system/log' },
                    { id: 'system:log:delete', label: '删除', type: 'button' }
                ]
            }
        ]
    },
    {
        id: 'content',
        label: '内容管理',
        type: 'directory',
        children: [
            {
                id: 'content:article',
                label: '文章管理',
                type: 'menu',
                children: [
                    { id: 'content:article:list', label: '查询', type: 'api', method: 'GET', path: '/api/content/article' },
                    { id: 'content:article:create', label: '新增', type: 'button' },
                    { id: 'content:article:edit', label: '编辑', type: 'button' },
                    { id: 'content:article:delete', label: '删除', type: 'button' },
                    { id: 'content:article:publish', label: '发布', type: 'api', method: 'POST', path: '/api/content/article/publish' }
                ]
            },
            {
                id: 'content:category',
                label: '分类管理',
                type: 'menu',
                children: [
                    { id: 'content:category:list', label: '查询', type: 'api', method: 'GET', path: '/api/content/category' },
                    { id: 'content:category:create', label: '新增', type: 'button' },
                    { id: 'content:category:edit', label: '编辑', type: 'button' },
                    { id: 'content:category:delete', label: '删除', type: 'button' }
                ]
            },
            {
                id: 'content:tag',
                label: '标签管理',
                type: 'menu',
                children: [
                    { id: 'content:tag:list', label: '查询', type: 'api', method: 'GET', path: '/api/content/tag' },
                    { id: 'content:tag:create', label: '新增', type: 'button' },
                    { id: 'content:tag:edit', label: '编辑', type: 'button' },
                    { id: 'content:tag:delete', label: '删除', type: 'button' }
                ]
            }
        ]
    },
    {
        id: 'product',
        label: '产品管理',
        type: 'directory',
        children: [
            {
                id: 'product:manage',
                label: '产品管理',
                type: 'menu',
                children: [
                    { id: 'product:manage:list', label: '查询', type: 'api', method: 'GET', path: '/api/product/manage' },
                    { id: 'product:manage:create', label: '新增', type: 'button' },
                    { id: 'product:manage:edit', label: '编辑', type: 'button' },
                    { id: 'product:manage:delete', label: '删除', type: 'button' }
                ]
            },
            {
                id: 'product:category',
                label: '产品分类',
                type: 'menu',
                children: [
                    { id: 'product:category:list', label: '查询', type: 'api', method: 'GET', path: '/api/product/category' },
                    { id: 'product:category:create', label: '新增', type: 'button' },
                    { id: 'product:category:edit', label: '编辑', type: 'button' },
                    { id: 'product:category:delete', label: '删除', type: 'button' }
                ]
            }
        ]
    },
    {
        id: 'statistics',
        label: '统计报表',
        type: 'directory',
        children: [
            { id: 'statistics:view', label: '查看', type: 'api', method: 'GET', path: '/api/statistics/view' },
            { id: 'statistics:export', label: '导出', type: 'api', method: 'POST', path: '/api/statistics/export' }
        ]
    }
]

const treeData = ref<PermissionTreeNode[]>(props.treeData.length ? props.treeData : defaultTreeData)

const checkedKeys = ref<string[]>(props.modelValue)

function flattenTree(nodes: PermissionTreeNode[]): PermissionTreeNode[] {
    const result: PermissionTreeNode[] = []
    for (const node of nodes) {
        result.push(node)
        if (node.children) {
            result.push(...flattenTree(node.children))
        }
    }
    return result
}

const allNodes = computed(() => flattenTree(treeData.value))

const allMenuTypeIds = computed(() => allNodes.value.filter(n => n.type === 'directory' || n.type === 'menu').map(n => n.id))

const allOperationTypeIds = computed(() => allNodes.value.filter(n => n.type === 'api' || n.type === 'button').map(n => n.id))

const checkedMenuCount = computed(() => {
    return checkedKeys.value.filter(id => allMenuTypeIds.value.includes(id)).length
})

const checkedOperationCount = computed(() => {
    return checkedKeys.value.filter(id => allOperationTypeIds.value.includes(id)).length
})

const allNodeIds = computed(() => allNodes.value.map(n => n.id))

function emitChange(keys: string[]) {
    checkedKeys.value = keys
    emit('update:modelValue', checkedKeys.value)
    emit('change', checkedKeys.value)
}

function handleSelectAll() {
    emitChange([...allNodeIds.value])
}

function handleInvertSelect() {
    const allIds = allNodeIds.value
    const inverted = allIds.filter(id => !checkedKeys.value.includes(id))
    emitChange(inverted)
}

watch(() => props.modelValue, (val) => {
    checkedKeys.value = val
})

function getNodeById(nodes: PermissionTreeNode[], id: string): PermissionTreeNode | undefined {
    for (const node of nodes) {
        if (node.id === id) return node
        if (node.children) {
            const found = getNodeById(node.children, id)
            if (found) return found
        }
    }
    return undefined
}

function getDescendantIds(node: PermissionTreeNode): string[] {
    const ids: string[] = []
    if (node.children) {
        for (const child of node.children) {
            ids.push(child.id)
            ids.push(...getDescendantIds(child))
        }
    }
    return ids
}

function getParentId(nodes: PermissionTreeNode[], childId: string): string | undefined {
    for (const node of nodes) {
        if (node.children) {
            if (node.children.some(c => c.id === childId)) return node.id
            const found = getParentId(node.children, childId)
            if (found) return found
        }
    }
    return undefined
}

function getSiblingIds(nodes: PermissionTreeNode[], childId: string): string[] {
    for (const node of nodes) {
        if (node.children) {
            const sibling = node.children.find(c => c.id === childId)
            if (sibling) return node.children.filter(c => c.id !== childId).map(c => c.id)
            const found = getSiblingIds(node.children, childId)
            if (found.length > 0 || node.children.some(c => c.id === childId)) return found
        }
    }
    return []
}

function handleTreeChange(value: string[]) {
    const oldKeys = checkedKeys.value
    const newKeys = value

    const added = newKeys.filter(id => !oldKeys.includes(id))
    const removed = oldKeys.filter(id => !newKeys.includes(id))

    const result = new Set(newKeys)

    for (const id of added) {
        const node = getNodeById(treeData.value, id)
        if (node) {
            const descendantIds = getDescendantIds(node)
            for (const did of descendantIds) {
                result.add(did)
            }
        }
    }

    for (const id of removed) {
        const node = getNodeById(treeData.value, id)
        if (node) {
            const descendantIds = getDescendantIds(node)
            for (const did of descendantIds) {
                result.delete(did)
            }
        }
    }

    for (const id of added) {
        let childId = id
        let parentId = getParentId(treeData.value, childId)
        while (parentId) {
            result.add(parentId)
            childId = parentId
            parentId = getParentId(treeData.value, childId)
        }
    }

    for (const id of removed) {
        let childId = id
        let parentId = getParentId(treeData.value, childId)
        while (parentId) {
            const siblingIds = getSiblingIds(treeData.value, childId)
            const anySiblingChecked = siblingIds.some(sid => result.has(sid))
            if (!anySiblingChecked) {
                result.delete(parentId)
                childId = parentId
                parentId = getParentId(treeData.value, childId)
            } else {
                break
            }
        }
    }

    emitChange(Array.from(result))
}
</script>

<template>
    <div class="permission-tree-wrapper">
        <div class="permission-tree-header">
            <div class="text-sm text-gray-700">
                已选择<span class="text-blue-600 font-medium mx-1">{{ checkedMenuCount }}</span>个菜单,
                <span class="text-blue-600 font-medium mx-1">{{ checkedOperationCount }}</span>个操作
            </div>
            <t-space size="small">
                <t-link theme="primary" @click="handleSelectAll">全选</t-link>
                <t-link theme="primary" @click="handleInvertSelect">反选</t-link>
            </t-space>
        </div>
        <div class="text-xs text-gray-400 mb-2">
            统一配置权限树：勾选菜单授予访问权限，将统一应用到所有关联租户
        </div>
        <t-tree
            ref="treeRef"
            :data="treeData"
            :keys="{ label: 'label', value: 'id' }"
            :checkable="true"
            :check-strictly="true"
            :value="checkedKeys"
            :expand-on-click-node="true"
            expand-all
            @change="handleTreeChange"
            class="permission-tree"
        >
            <template #label="{ node }">
                <div class="flex items-center w-full gap-1">
                    <t-icon v-if="node.data.type === 'directory'" name="folder-open" class="text-yellow-600" />
                    <t-icon v-else-if="node.data.type === 'menu'" name="menu" class="text-blue-600" />
                    <t-icon v-else-if="node.data.type === 'api'" name="code" class="text-green-600" />
                    <t-icon v-else-if="node.data.type === 'button'" name="tool" class="text-purple-600" />
                    <span class="flex-1 min-w-0 truncate">{{ node.data.label }}</span>
                    <template v-if="node.data.type === 'directory'">
                        <t-tag variant="light" theme="warning" size="small">目录</t-tag>
                    </template>
                    <template v-else-if="node.data.type === 'menu'">
                        <t-tag variant="light" theme="success" size="small">菜单</t-tag>
                    </template>
                    <template v-else-if="node.data.type === 'api'">
                        <t-tag variant="light" :theme="(methodTagThemeMap[node.data.method||''] as any) || 'default'" size="small" class="font-mono">{{ node.data.method }}</t-tag>
                        <t-tag variant="light" theme="default" size="small" class="font-mono max-w-[200px] truncate">{{ node.data.path }}</t-tag>
                    </template>
                    <template v-else-if="node.data.type === 'button'">
                        <t-tag variant="light" theme="default" size="small">按钮</t-tag>
                    </template>
                </div>
            </template>
        </t-tree>
    </div>
</template>

<style scoped>
.permission-tree-wrapper {
    width: 100%;
}
.permission-tree-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
}
.permission-tree {
    border: 1px solid var(--td-border-level-2-color);
    border-radius: var(--td-radius-default);
    padding: 8px;
    overflow-y: auto;
    width: 100%;
}
:deep(.t-tree__item) {
    /* height: 42px;
    min-height: 36px;
    padding-top: 4px;
    padding-bottom: 4px; */
}
:deep(.t-tree__label) {
    display: flex;
    align-items: center;
    flex: 1;
    min-width: 0;
}
</style>
