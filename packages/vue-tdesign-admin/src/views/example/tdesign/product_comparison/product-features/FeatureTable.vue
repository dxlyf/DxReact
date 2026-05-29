<script setup lang="ts">
import { ref } from 'vue';
import { DialogPlugin, TableProps } from 'tdesign-vue-next';
import { useDrawer } from 'src/hooks/useDrawer';
import FUploadImage from 'src/views/example/tdesign/components/FUpload/FUploadImage.vue';
import type { FeatureItem } from './FeatureList.vue';
import { ceil } from 'lodash-es';

const features = defineModel<FeatureItem[]>({ required: true })

const props = withDefaults(defineProps<{
    showAdd?: boolean
    showDelete?: boolean
    showHeader?: boolean
    disabledTitle?: boolean
    disabledType?: boolean
    emptyText?: string
    removeItem?: (item: any) => Promise<void>
}>(), {
    showHeader: true,
    showDelete: true,
    disabledTitle: false,
    disabledType: false,
    emptyText: '暂无特性数据'
})

const editingIndex = ref(-1)
const featureFormRef = ref()
const editingFeatureCopy = ref<FeatureItem | null>(null)

const setEditingCopy = (item: FeatureItem | null) => {
    editingFeatureCopy.value = item ? { ...item } : null
}

const handleDrawerConfirm = async () => {
    const form = featureFormRef.value
    const result = await form.validate()
    if (result !== true) {
        return
    }
    if (editingIndex.value >= 0) {
        features.value[editingIndex.value] = editingFeatureCopy.value as FeatureItem
    }
    drawerInst.close()
}

const handleDrawerCancel = () => {
    drawerInst.close()
}

const [drawerProps, drawerInst] = useDrawer(() => ({
    size: '40%',
    footer: true,
    onConfirm: handleDrawerConfirm,
    onCancel: handleDrawerCancel,
}))

const openEditFeature = (index: number) => {
    editingIndex.value = index
    setEditingCopy(features.value[index])
    drawerInst.open()
}

const handleDelete = async (index: number) => {
    const item = features.value[index]

    if (props.removeItem) {
        try {
            await props.removeItem(item)
        } catch {
            return
        }
    }

    DialogPlugin.confirm({
        theme: 'danger',
        header: '确认删除',
        body: `确定删除「${item.title}」吗？`,
        onConfirm: () => {
            features.value.splice(index, 1)
        },
        onCancel: () => {
            console.log('取消删除')
        }
    })
}
const columns:TableProps['columns']=[
                { colKey: 'drag', title: '', width: 40 },
                { colKey: 'serial-number', title: '#', width: 60 },
                { colKey: 'title', title: '特性名称', width: 150, ellipsis: {attach:'body'} },
                { colKey: 'prefix', title: '参数前缀', width: 120, ellipsis: true },
                { colKey: 'content', title: '参数文案', width: 150, ellipsis: true },
                { colKey: 'description', title: '参数描述', width: 180, ellipsis: true },
                { colKey: 'floatComment', title: '浮动注释', width: 150,ellipsis:{
                    attach:'body',
                    overlayClassName:'f4-tooltip-overlay',
                    //overlayStyle:{maxHeight:300,overflowY:'auto'},
                }, cell:(h,props)=>{
                    return props.row.floatComment || '-'
                }},
                { colKey: 'image', title: '参数图片', width: 120 },
                { colKey: 'actions', title: '操作', width: 120, fixed: 'right' }
            ]

const onDragSort:TableProps['onDragSort'] = ({ currentIndex, targetIndex,newData,currentData}) => {
  const item = features.value.splice(currentIndex, 1)[0]
 // features.value.splice(targetIndex, 0, item)
  features.value = newData
}
</script>

<template>
    <div>
        <div v-if="showHeader" class="flex mb-2">
            <div class="flex-1">
                <span class="text-gray-400">共 {{ features.length }} 个特性</span>
            </div>
        </div>
        <t-table
            :data="features"
            :columns="columns"
            row-key="id"
            bordered
            hover
            size="small"
            drag-sort="row-handler"
            @drag-sort="onDragSort"
        >
            <template #drag>
                <t-icon name="move" style="cursor: grab; color: #999;" />
            </template>
            <template #title="{ row }">
                <t-link theme="primary" @click="openEditFeature(features.indexOf(row))">{{ row.title || '-' }}</t-link>
            </template>
            <template #prefix="{ row }">
                {{ row.prefix || '-' }}
            </template>
            <template #content="{ row }">
                {{ row.content || '-' }}
            </template>
            <template #description="{ row }">
                {{ row.description || '-' }}
            </template>
            <template #:floatComment="{ row }" >
                {{ row.floatComment || '-' }}
            </template>
            <template #image="{ row }">
                <template v-if="row.type === 'image' && row.imageUrl">
                    <t-image-viewer attach="body" :images="[row.imageUrl]" :z-index="1000">
                        <template #trigger="{ open }">
                            <t-image
                                style="width: 50px; height: 50px; cursor: pointer; border-radius: 4px;"
                                :src="row.imageUrl"
                                fit="cover"
                                @click="open"
                            />
                        </template>
                    </t-image-viewer>
                </template>
                <span v-else>-</span>
            </template>
            <template #actions="{ row }">
                <t-space>
                    <t-link theme="primary" @click="openEditFeature(features.indexOf(row))">编辑</t-link>
                    <t-link theme="danger" @click="handleDelete(features.indexOf(row))">删除</t-link>
                </t-space>
            </template>
        </t-table>
        <div v-if="features.length === 0" class="text-center text-gray-400 py-8">
            {{ props.emptyText }}
        </div>
    </div>

    <t-drawer v-bind="drawerProps">
        <template #header>
            <slot name="drawerHeader">
                <div class="flex items-center gap-2">
                    <span class="text-white text-xs min-w-6 py-1 shrink-0 rounded-sm bg-blue-800 text-center">{{
                        editingIndex >= 0 ? editingIndex + 1 : '+'
                    }}</span>
                </div>
            </slot>
        </template>
        <t-form ref="featureFormRef" v-if="editingFeatureCopy" :data="editingFeatureCopy" :label-width="120" class="w-full" label-align="top">
            <t-form-item label="特性名称" name="title">
                <t-input v-model.trim="editingFeatureCopy.title" :disabled="props.disabledTitle" />
            </t-form-item>
            <t-form-item>
                <template #label>
                    参数类型 <span class="text-xs text-gray-400">(全局)</span>
                </template>
                <t-radio-group v-model="editingFeatureCopy.type" :disabled="props.disabledType">
                    <t-radio value="image">图片</t-radio>
                    <t-radio value="text">文本</t-radio>
                </t-radio-group>
            </t-form-item>
            <t-form-item key="image" v-if="editingFeatureCopy.type === 'image'">
                <template #label>
                    参数图片 <span class="text-xs text-gray-400">(全局)</span>
                </template>
                <FUploadImage v-model="editingFeatureCopy.imageUrl" />
            </t-form-item>
            <t-form-item label="参数文案" key="text" v-if="editingFeatureCopy.type === 'text'">
                <t-input v-model.trim="editingFeatureCopy.content" placeholder="请输入参数文案" :maxlength="10" show-limit-number />
            </t-form-item>
            <t-form-item label="参数前缀">
                <t-input v-model.trim="editingFeatureCopy.prefix" placeholder="请输入参数前缀" :maxlength="20" show-limit-number />
            </t-form-item>
            <t-form-item label="参数描述">
                <t-input v-model.trim="editingFeatureCopy.description" placeholder="请输入参数描述" :maxlength="40" show-limit-number />
            </t-form-item>
            <t-form-item label="浮动注释">
                <t-textarea :maxlength="2000" show-limit-number v-model.trim="editingFeatureCopy.floatComment" placeholder="请输入浮动注释" />
            </t-form-item>
        </t-form>
    </t-drawer>
</template>
<style>
.f4-tooltip-overlay{
    max-height: 60vh;
    overflow-y: auto;
}
</style>