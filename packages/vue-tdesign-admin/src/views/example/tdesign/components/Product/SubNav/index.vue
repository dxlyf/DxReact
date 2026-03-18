<script setup lang="ts">
import type { TableProps, TdFormProps } from 'tdesign-vue-next';
import { reactive, shallowRef,computed, toRaw, ref } from 'vue';


type NavItem={
       id:string
       title:string,
        linkType:string,
        link:string,
        navType:string,
        gaLabel:string,
        hideOnPc:boolean,
        hideOnMobile:boolean,
}
type FormData={
    theme:string,
    nav:NavItem[]
}
const formData = reactive<FormData>({
    theme:'light',
    nav:[]
})
const rules:TdFormProps['rules'] = {
    // nav:[
    //     {
    //         validator(val:NavItem[],{formData}){
    //             val.s
    //         }
    //     }
    // ]
}

const fastAccessOptions = shallowRef([{ label: 'aa', value: 'aa' }, { label: 'bb', value: 'bb' }])

const navColumns:TableProps['columns']=[{
    colKey: 'drag', // 列拖拽排序必要参数
    title: '',
    cell: 'cell_drag',
    width: 46,
  },
    {
        colKey:'title',
        title:'title',
        cell:'cell_title',
        width:200
    },
    {
        colKey:'linkType',
        cell:'cell_linkType',
        title:'link_type',
        width:120
    },
    {
        colKey:'link',
        cell:'cell_link',
        title:'link',
        width:180
    },
    {
        colKey:'navType',
        cell:'cell_navType',
        title:'nav_type',
        width:120
    },
    {
        colKey:'gaLabel',
        cell:'cell_gaLabel',
        title:'gaLabel',
        width:160
    },
    {
        colKey:'hideOnPc',
        cell:'cell_hideOnPc',
        title:'hideOnPc',
        width:100
    },
    {
        colKey:'hideOnMobile',
        cell:'cell_hideOnMobile',
        title:'hideOnMobile',
        width:100
    },
    {
        colKey:'operation',
        cell:'cell_operation',
        fixed:'right',
        width:180
    }
]

const jsonNav=computed(()=>{
    try{
        return JSON.stringify(formData.nav)
    }catch{
        return ''
    }
})
const linkTypeOptions=[{ label: 'relative-path', value: 'relative-path' }, { label: 'absolute-path', value: 'absolute-path' },{ label: 'store-link', value: 'store-link' }] 
const navTypeOptions=[{ label: 'normal', value: 'normal' }, { label: 'anchor', value: 'anchor' }]


const uuid=()=>{
    return Math.random().toString(36).substring(2, 10)
}
const handleAddNav=()=>{
    formData.nav.push({
        id:uuid(),
        title:'',
        linkType:'',
        link:'',
        navType:'normal',
        gaLabel:'',
        hideOnPc:false,
        hideOnMobile:false,
    })
}
const handleDelLastNav=()=>{
    formData.nav.pop()
}
const handleDelAll=()=>{
    formData.nav = []
}
const handleDelNav=(index:number)=>{
    formData.nav.splice(index,1)
}
// { currentIndex, targetIndex, current, target, data, newData, e }
const onDragSort:TableProps['onDragSort'] = ({current,targetIndex,target,data,newData,currentData}) => {
//  console.log('交换行', params);
  formData.nav =newData;
};
const handleFillNav=(item:any)=>{
  formData.nav.push({
        id:uuid(),
        title:item.title??'',
        linkType:item.linkType??'',
        link:item.link??'',
        navType:item.navType??'',
        gaLabel:item.gaLabel??'',
        hideOnPc:item.hideOnPc??false,
        hideOnMobile:item.hideOnMobile??false,
    })
}
const validError=shallowRef([{message:'validate error'},{message:'nav is empty'}])

const handleSubmit = (e:any) => {
    console.log('formData',toRaw(formData))
    if(e.validateResult!==true){
        return
    }
    validError.value=[]
    const nav=formData.nav;
    if(nav.length===0){
        validError.value.push({message:'nav is empty'})
        return
    }
    // nav.forEach((item,index)=>{
    //     if(item.title.trim()==''){
    //         validError.value.push({message:`nav[${index}].title is empty`})
    //     }
    //     if(item.linkType==='relative-path'&&item.link.toLowerCase().startsWith('http')){
    //         validError.value.push({message:`nav[${index}].linkType must be relative-path when navType is relative-path`})
    //     }
    // })
}
</script>
<template>
    <t-form class="w-full" @submit="handleSubmit" :data="formData" :rules="rules" label-align="top" layout='vertical'>
        <t-collapse :expand-on-row-click="false" default-expand-all expand-icon-placement="right" borderless>
            <t-collapse-panel value="0">
                <template #header>
                    <div class="header">基本配置</div>
                </template>
                <t-form-item label="Sub nav theme" name="theme">
                    <t-select v-model="formData.theme" :options="[{
                        label: 'Dark',
                        value: 'dark'
                    }, {
                        label: 'Light',
                        value: 'light'
                    }]" />
                </t-form-item>
                <t-form-item label="Sub nav" name="slug">
                
                    <t-textarea style="height:100px" readonly  v-model="jsonNav"></t-textarea>
                </t-form-item>
                <t-form-item label="Sub nav fast access" name="regions">
                    <div class="flex flex-col">
                        <t-space>
                            <t-button>Nav List</t-button>
                            <t-button>New Nav</t-button>
                        </t-space>
                        <div class="mt-4">
                            <t-radio-group theme="button" value="">
                                <t-radio-button @click="()=>handleFillNav(item)" v-for="(item,index) in fastAccessOptions" :key="item.value" :value="index">{{item.label}}</t-radio-button>
                            </t-radio-group>
                        </div>
                    </div>
                </t-form-item>
            </t-collapse-panel>

            <t-collapse-panel value="1" class="collapse-panel" >
                <template #header>
                    <div class="header">Sub Nav</div>
                </template>
                <template #headerRightContent>
                   <t-space>
                    <t-button theme="primary" @click="handleAddNav"  size="small">Add nav</t-button>
                      <t-popconfirm content="确定要删除？" @confirm="handleDelLastNav">
                        <t-button theme="danger"  size="small"  >Delete Last nav</t-button>
                        </t-popconfirm> 
                     <t-popconfirm content="确定要全部删除？" @confirm="handleDelAll">
                    <t-button theme="primary"  size="small"  >Delete All</t-button>
                    </t-popconfirm>
                   </t-space>
                </template>
                <div >
                  <t-table class="nav-table"  drag-sort="row-handler" @drag-sort="onDragSort" row-key="index" :data="formData.nav" :columns="navColumns">
                    <template #cell_drag="{row}" >
                        <t-icon name="move"></t-icon>
                    </template>
                    <template #cell_title="{row,rowIndex}" >
                         <t-input v-model="row.title" :maxlength="50" ></t-input>

                    </template>
                    <template #cell_linkType="{row}">
                        <t-select v-model="row.linkType" :options="linkTypeOptions"></t-select>
                    </template>
                    <template #cell_link="{row}">
                        <t-input v-model="row.link" ></t-input>
                    </template>
                    <template #cell_navType="{row}">
                        <t-select v-model="row.navType" :options="navTypeOptions"></t-select>
                    </template>
                    <template #cell_gaLabel="{row}">
                        <t-input v-model="row.gaLabel" ></t-input>
                    </template>
                    <template #cell_hideOnPc="{row}">
                        <t-checkbox v-model="row.hideOnPc" ></t-checkbox>
                    </template> 
                     <template #cell_hideOnMobile="{row}">
                        <t-checkbox v-model="row.hideOnMobile" ></t-checkbox>
                    </template>
                    <template #cell_operation="{row,rowIndex}">
                        <t-space>
                            <t-popconfirm content="确定要删除？" @confirm="handleDelNav(rowIndex)">
                            <t-button theme="danger" size="small" >Delete</t-button>
                                </t-popconfirm>
                        </t-space>
                    </template>
                  </t-table>
                </div>
            </t-collapse-panel>
        </t-collapse>
        <t-alert  v-if="validError.length" class="my-4" theme="error">
           <template #message :close-btn="true">
            <div v-for="(item,index) in validError"  class="text-red-500 text-xs" :key="index">{{item.message}}</div>
           </template>
        </t-alert>
        <div class="mt-4">
            <t-button theme="primary" type="submit">Submit</t-button>
        </div>
    </t-form>
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
.nav-table{
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
}
.nav-table :where(thead th,thead td){

}

</style>