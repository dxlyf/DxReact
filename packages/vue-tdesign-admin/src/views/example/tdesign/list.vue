<script setup lang="ts">
import { ref } from 'vue'
import { useUserStore } from '@/stores/user'
import ListLayout,{type Props as ListLayoutProps} from './components/Layouts/ListLayout.vue'
import FSearchForm from './components/FForm/FSearchForm.vue'

const breadcrumbItems:ListLayoutProps['breadcrumbItems'] = [
    {
      content:'首页'
    },
    {
        content:'列表'
    }
]

</script>
<template>
<ListLayout title="列表" :breadcrumb-items="breadcrumbItems" >
    <template #form>
        <FSearchForm  :columns="fields"></FSearchForm>
    </template>
</ListLayout>

</template>