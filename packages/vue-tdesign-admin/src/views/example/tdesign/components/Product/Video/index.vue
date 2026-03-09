<script setup lang="ts">
import { useLang } from 'src/hooks/useLang';
import type { TableProps ,FormInstanceFunctions, UploadInstanceFunctions} from 'tdesign-vue-next';
import { reactive,watch, shallowRef, computed, toRaw, ref,ShallowRef, shallowReactive } from 'vue';
import {DialogPlugin, MessagePlugin as Message} from 'tdesign-vue-next'
import { usePolling } from 'src/hooks/usePolling';

const [,{currentLocale}]=useLang()
type VideoGroup = {
    groupSlug: string
    groupId: number
    title: string
    videos: VideoItem[]
}
type VideoItem = {
    id: number
    slug: string
    title: string
    videoLink: string
    status: string
    publishAt: string
    description: string
}

const videos = ref<VideoGroup[]>([{
    groupSlug: 'group-1',
    groupId: 1,
    title: 'Group 1',
    videos: [{
        id: 1,
        slug: 'video-1',
        title: 'Video 1',
        videoLink: 'https://www.youtube.com/watch?v=123456',
        status: 'published',
        publishAt: '2023-01-01',
        description: 'Video 1 Description'
    }, {
        id: 2,
        slug: 'video-2',
        title: 'Video 2',
        videoLink: 'https://www.youtube.com/watch?v=123456',
        status: 'published',
        publishAt: '2023-01-01',
        description: 'Video 1 Description'
    }]
},
{
    groupSlug: 'group-2',
    groupId: 2,
    title: 'Group 2',
    videos: [{
        id: 2,
        slug: 'video-2',
        title: 'Video 2',
        videoLink: 'https://www.youtube.com/watch?v=654321',
        status: 'published',
        publishAt: '2023-01-02',
        description: 'Video 2 Description'
    }, {
        id: 3,
        slug: 'video-3',
        title: 'Video 3',
        videoLink: 'https://www.youtube.com/watch?v=123456',
        status: 'published',
        publishAt: '2023-01-03',
        description: 'Video 3 Description'
    }]
},])

const rules = {}

const handleSubmit = (e: any) => {
    console.log('formData', toRaw(formData))
    if (e.validateResult !== true) {
        return
    }

}
// 视频分组选项,用于克隆
const videoGroupOptions=computed(()=>videos.value.map((item)=>{
    return {
        label:item.title,
        value:item.groupSlug
    }
}))
// 视频表格列
const videoColumns: TableProps['columns'] = [{
    colKey: 'drag',
    cell: 'cell_drag',
    title: 'sort',
    width: '46px'
}, {
    title: 'Video Slug',
    colKey: 'slug',
}, {
    title: 'Video Title',
    colKey: 'title'
}, {
    title: 'Status',
    colKey: 'status'
}, {
    title: 'Publish At',
    colKey: 'publishAt'
}, {
    title: '',
    colKey: 'operation',
    cell: 'cell_operation',
    fixed: 'right',
    width: 180
}]
const onDragSort = (group: VideoGroup, params: any) => {
    const { currentIndex, targetIndex, current, target, data, newData } = params;
    console.log('data',group)
  //  const groupIndex=videos.value.findIndex(d=>d.groupId==group.groupId)
    //videos.value[groupIndex].videos = [...newData];
    group.videos=[...newData]
}
const dialogFormRef=shallowRef<FormInstanceFunctions>(null)
const visibleCloneDialog=ref(false) // 克隆弹窗是否可见
const visibleImportDialog=ref(false) // 导入弹窗是否可见
const dialogConfirmLoading=ref(false) // 弹窗确认按钮是否加载中
const uploadRef=shallowRef<UploadInstanceFunctions>(null) // 上传组件实例
const cloneFormData=shallowReactive({
    locale:'',
    cloneGroupSlug:[],

})
const importFormData=shallowReactive({
    file:[]
})
const [allLang]=useLang()
const handleCloneDialogConfirm=()=>{
    dialogFormRef.value.submit()
}
 const handleCloneSubmit=async (e:any)=>{
 
    console.log('cloneFormData',toRaw(cloneFormData))
     if(e.validateResult!==true){
        return
     }
     try{
        dialogConfirmLoading.value=true
        const params={
            productSlug:'',
            productTitle:'',
            cloneToLocale:cloneFormData.locale,
            videoGroupSlug:cloneFormData.cloneGroupSlug,
        }
        const res=await cloneVideos(params)
        dialogConfirmLoading.value=false
        if(res.code===0){
            Message.success('Clone Videos Success')
            visibleCloneDialog.value=false
        }
     }catch(e){

     }finally{
        dialogConfirmLoading.value=false
     }
 }
const importPostData=()=>{
     return {
         locale:'en',
         appSlug:'sys',
         productId:'123'
     }
}

const {isPolling,pollingState,start:startPolling,stop:stopPolling,pollingCount,lastResult}=usePolling(async (id:number)=>{
       console.log('执行轮询请求'+pollingCount.value)

    //importing finished success
    if(pollingCount.value>=5){
        stopPolling()
        return {
            jobId:1,
            status:'finished',
            slug:'video-1'
        }
    }
    //importing finished failed
    return {
        jobId:1,
        status:'importing',
        slug:'video-1'
    }
},{
    interval:3000,
    maxRetries:5,
    onError:(err)=>{
        Message.error(err.message)
    }
})
watch(visibleImportDialog,(val)=>{
    if(!val){
        pollingState.value='idle'
    }
})
const handleImportSubmit=(e:any)=>{
    // console.log('importFormData',toRaw(importFormData))
     if(e.validateResult!==true){
        return
     }
     const file=importFormData.file[0].raw
   ///  dialogConfirmLoading.value=true
     const formData=new FormData()
     formData.append('file',file)
     formData.append('locale',importPostData().locale)
     formData.append('appSlug',importPostData().appSlug)
     formData.append('productId',importPostData().productId)

     startPolling('123')

 }
 const handleImportUploadSuccess=()=>{
   dialogConfirmLoading.value=false
 }
 const handleImportUploadFail=()=>{
    dialogConfirmLoading.value=false
 }
 const handleNavVideoEdit=(group:VideoGroup,video:VideoItem)=>{
    const video_locale=group.groupSlug.split('-').includes('en')?'en':currentLocale.value
    // router.push({
    //     path:'/example/tdesign/components/Product/Video/Edit',
    //     query:{
    //         productSlug:'',
    //         videoSlug:video.slug
    //     }
    // })
 }
 const handleDeleteVideo=(group:VideoGroup,video:VideoItem)=>{
    // const confirmDialog=DialogPlugin.confirm({
    //     header:'Delete Video',
    //     body:`Are you sure to delete video ${video.title}?`,
    
    //     onConfirm:function(e){
    //        confirmDialog.destroy()
    //     }
    // })
 }
 // 导出视频
 const exportVideos=async ()=>{
    
 }
 const downloadTemplateExcel=()=>{

 }
</script>
<template>
    <t-form class="w-full" @submit="handleSubmit" label-align="top" layout='vertical'>
        <div class="px-4 py-4">
            <div class="flex justify-between">
                <div class="flex-none">
                    <span class="text-lg font-bold">Videos</span>
                    <t-tooltip content="Drag and drop to rank video">
                        <t-icon name="info-circle-filled" size="16" class="ml-2 relative top-[-12px]""></t-icon>
                    </t-tooltip>
                </div>
                <div>
                    <t-space>
                        <t-button theme="primary" @click="visibleCloneDialog=true">Clone</t-button>
                        <t-button theme="primary" @click="visibleImportDialog=true">Import Videos</t-button>
                        <t-button theme="primary" @click="exportVideos">Export Videos</t-button>
                    </t-space>
                </div>
            </div>
            <div class="flex flex-col gap-4 px-4">
                <div class="flex flex-col" v-for="(group,groupIndex) in videos" :key="group.groupId">
                    <div class="text-md font-semibold">
                        <t-link theme="primary">{{ group.title }}</t-link>
                    </div>
                    <t-table class="table" row-key="id" :data="group.videos" :columns="videoColumns" drag-sort="row-handler"
                        @drag-sort="(params) => onDragSort(group, params)">
                        <template #cell_drag="{ row }">
                            <t-icon name="move"></t-icon>
                        </template>
                        <template #slug="{row}">
                            <t-link theme="primary" @click="()=>handleNavVideoEdit(group,row)" >{{ row.slug }}</t-link>
                        </template>
                             <template #cell_operation="{ row }">
                            <t-space>
                                <t-link theme="primary" @click="()=>handleNavVideoEdit(group,row)">Edit</t-link>
                                <t-link theme="primary" @click="()=>handleDeleteVideo(group,row)">Delete</t-link>
                            </t-space>
                        </template>
                    </t-table>
                </div>
            </div>


        </div>
    </t-form>
    <!--clone video groups-->
    <t-dialog attach="body" :cancel-btn="null" :confirm-btn="{
        content:'Clone',
        theme:'primary',
    }" @confirm="handleCloneDialogConfirm" :close-on-esc-keydown="false" :close-on-overlay-click="false" :confirm-loading="dialogConfirmLoading" :destroy-on-close="true" v-model:visible="visibleCloneDialog"   header="Clone Video Groups" >
        <t-form :data="cloneFormData"  ref="dialogFormRef" @submit="handleCloneSubmit" label-align="top">
            <t-form-item :rules="[{required:true,message:'请选择locale'}]" label="Clone to locale" name="locale">
                <t-select v-model="cloneFormData.locale" :options="allLang" clearable filterable >
                </t-select>
            </t-form-item>
            <t-form-item :rules="[{required:true,message:'请选择group slug'}]" label="Video group slug" name="cloneGroupSlug">
                <t-select :options="videoGroupOptions" v-model="cloneFormData.cloneGroupSlug" clearable filterable multiple>
                </t-select>
                
            </t-form-item>
            <div></div>
        </t-form>
    </t-dialog>

    <!--import videos-->
 <t-dialog width="900px" attach="body"  :close-on-esc-keydown="false" :close-on-overlay-click="false" :cancel-btn="null" :footer="false"  :destroy-on-close="true" v-model:visible="visibleImportDialog"   header="Import Videos" >
        <t-form :data="importFormData"  ref="dialogFormRef" @submit="handleImportSubmit" label-align="top">
            <t-form-item  :rules="[{required:true,message:'请选择file'}]" label="Import file" name="file">
               <t-upload theme="file" :allow-upload-duplicate-file="true" @fail="handleImportUploadFail"  @success="handleImportUploadSuccess"  name="file"  :data="importPostData" ref="uploadRef" :auto-upload="false" action="/api/upload2" v-model="importFormData.file"></t-upload>
               <t-space class="ml-4">
                    <t-button :loading="dialogConfirmLoading" theme="primary" type="submit">Import</t-button>
                    <t-button theme="success" @click="downloadTemplateExcel">Download Template Excel</t-button>
               </t-space>
            </t-form-item>
            <div v-if="pollingState!=='idle'">
                <table class="job-table">
                    <thead>
                        <tr>
                            <th>Slug</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-if="lastResult">
                            <td>{{ lastResult.slug}}</td>
                            <td>{{ lastResult.status }}</td>
                        </tr>
                        <tr>
                            <td>dfsadf</td>
                            <td><t-tag theme="warning">Importing</t-tag></td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div></div>
        </t-form>
    </t-dialog>
</template>
<style lang="css" scoped>
.header {
    border-left: solid 4px var(--td-brand-color-7);
    padding-left: 4px;
    line-height: 1;
}

/* .collapse-panel :deep(.t-collapse-panel__content){
    background-color: rgba(0,0,0,0.1)!important;
    padding: 16px!important;
*/
.table :deep(.t-table__header tr th) {

}
.job-table{
    width: 100%;
    border-collapse: collapse;

}
.job-table :deep(:where(td,th)){
    border: solid 1px rgba(0,0,0,0.2);
    text-align: center;
}
.job-table :deep(thead th){
    font-weight: 700;
    padding: 4px 0;
    background-color: rgba(0,0,0,0.1);
}
.job-table :deep(tbody td){
    padding: 8px 0;
}

</style>