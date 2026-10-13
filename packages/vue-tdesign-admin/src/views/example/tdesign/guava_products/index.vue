<script setup lang="ts">
import MainLayout from '@/views/example/tdesign/components/Layouts/MainLayout.vue';
import Table from '@/views/example/tdesign/components/FTable/index.vue'
import { DialogPlugin, type TableProps } from 'tdesign-vue-next';
import { useTable } from '@/views/example/tdesign/hooks/useTable';
import { useRouter } from 'vue-router'
import { SearchForm, type SearchField } from '@/views/example/tdesign/components/FSearchForm'
const router = useRouter()

const breadcrumbOptions = [
    {
        content: '首页',
        to: '/'
    },
    {
        content: '产品列表',
        to: '/example/tdesign/guava_products'
    },
    {
        content: 'index'
    }
]

type GuavaProductDTO = {
    id: number,
    slug: string,
    cover: string,
    title: string,
    publishAt: string,
    status: string
}

const statusLabelMap: Record<string, string> = {
    Publish: '已发布',
    Draft: '草稿',
}

const coverPrompts = [
    'product packaging photography on clean background, studio lighting',
    'minimal product still life, soft shadow, commercial photo',
    'e-commerce product photo, neutral backdrop, high detail',
]
const buildCover = (i: number) => {
    const prompt = encodeURIComponent(coverPrompts[i % coverPrompts.length])
    return `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${prompt}&image_size=square`
}

const data: GuavaProductDTO[] = Array.from({ length: 60 }, (v, i) => ({
    id: i + 1,
    slug: 'guava-product-' + (i + 1),
    cover: buildCover(i),
    title: '产品标题' + (i + 1),
    publishAt: `2024-0${(i % 9) + 1}-${String((i % 27) + 1).padStart(2, '0')} 10:00`,
    status: i % 3 === 0 ? 'Draft' : 'Publish',
}))

const [tableProps, tableInst] = useTable<GuavaProductDTO>({
    manualRequest: true,
    request: async (params) => {
        const newParams = {
            ...params,
        }
        const newData = data.filter((item) => {
            if (newParams.slug && !item.slug.includes(newParams.slug)) {
                return false
            }
            return true
        })
        return {
            success: true,
            records: newData.slice((params.current - 1) * params.pageSize, params.current * params.pageSize),
            total: newData.length
        }
    }
})

const columns: TableProps['columns'] = [
    {
        title: 'Slug',
        colKey: 'slug',
        ellipsis: true,
        width: 200,
    },
    {
        title: '封面',
        colKey: 'cover',
        width: 100,
    },
    {
        title: '标题',
        colKey: 'title',
        ellipsis: true,
        width: 240,
    },
    {
        title: '发布时间',
        colKey: 'publishAt',
        width: 180,
    },
    {
        title: '状态',
        colKey: 'status',
        width: 120,
    },
    {
        title: '操作',
        colKey: 'actions',
        width: 140,
    }
]

const searchColumns: SearchField[] = [
    {
        name: 'slug',
        type: 't-input',
        props: {
            placeholder: '请输入slug',
            clearable: true,
        }
    }
]
const handleSearch = (params: any) => {
    tableInst.query(params)
}

const handleCreate = () => {
    router.push({ path: './new' })
}

const handleEdit = (row: GuavaProductDTO) => {
    router.push({ path: './edit', query: { id: row.id } })
}

const handleDelete = (row: GuavaProductDTO) => {
    DialogPlugin.confirm({
        header: '确认删除',
        body: `确定删除产品「${row.title}」吗？`,
        theme: 'danger',
        onConfirm: () => {
            console.log('删除产品', row)
        },
        onCancel: () => {
            console.log('取消删除')
        },
    })
}
</script>
<template>
    <MainLayout layout='list' show-lang title="产品列表" :breadcrumb-options="breadcrumbOptions">
        <template #operation>
            <t-space>
                <t-button theme="primary" @click="handleCreate">新建</t-button>
            </t-space>
        </template>
        <SearchForm :columns="searchColumns" @change="handleSearch"></SearchForm>
        <Table v-bind="tableProps" :columns="columns">
            <template #cover="{ row }">
                <t-image-viewer attach="body" :images="[row.cover]" :z-index="1000">
                    <template #trigger="{ open }">
                        <t-image class="w-14 h-14 rounded cursor-pointer" fit="cover" :src="row.cover" @click="open" />
                    </template>
                </t-image-viewer>
            </template>
            <template #status="{ row }">
                <t-tag variant="light" :theme="row.status === 'Publish' ? 'success' : 'warning'">
                    {{ statusLabelMap[row.status] || row.status }}
                </t-tag>
            </template>
            <template #actions="{ row }">
                <t-space>
                    <t-link theme="primary" @click="handleEdit(row)">编辑</t-link>
                    <t-link theme="danger" @click="handleDelete(row)">删除</t-link>
                </t-space>
            </template>
        </Table>
    </MainLayout>
</template>
<style scoped></style>
