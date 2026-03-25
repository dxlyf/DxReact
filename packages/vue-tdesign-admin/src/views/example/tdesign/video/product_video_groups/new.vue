<script setup lang="ts">
import MainLayout from 'src/views/example/tdesign/components/Layouts/MainLayout.vue';
import { reactive, ref, shallowRef } from 'vue';
import type { FormInstanceFunctions, TableProps } from 'tdesign-vue-next';
import { useRequest } from '@/hooks/useRequest2'
import CountrySelect from '@/components/country-select/index.vue'
import UploadCover from '@/views/example/tdesign/components/FUpload/FUploadCover2.vue'
import { useRouter } from 'vue-router'

</script>
<template>
    <MainLayout layout='list' show-lang title="产品视频分组" :breadcrumb-options="breadcrumbOptions">
        <template #header>
            <div class="flex justify-between items-center">
                <div class="text-lg font-bold">创建产品视频分组</div>
            </div>
        </template>
    </MainLayout>
</template>
