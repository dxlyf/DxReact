<template>

    <div>
     <t-tabs v-model="activeTabKey">
      <t-tab-panel :value="1" label="基础信息" :destroy-on-hide="false">
        <t-form :model="formData"  ref="formRef" class="w-full">
          <t-row>
            <t-col v-for="(item,index) in fields" :key="item.name||index" :span="item.span||12">
                <t-form-item :name="item.name" v-bind="item.formItemProps||{}">
                    <component :is="item.component" v-model="formData[item.name]" v-bind="item.fieldProps" />
                </t-form-item>
            </t-col>
          </t-row>
        </t-form>

      </t-tab-panel>
      <t-tab-panel :value="2" label="选项卡2" :destroy-on-hide="false">
        <template #panel>
          <p style="padding: 25px">选项卡2的内容，使用 t-tab-panel 渲染</p>
        </template>
      </t-tab-panel>
      <t-tab-panel :value="3" label="选项卡3" >
        <p style="padding: 25px">选项卡3的内容，使用 t-tab-panel 渲染</p>
        </t-tab-panel>  
    </t-tabs>

    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, nextTick, reactive } from 'vue'
import type {TabPanel,TdFormItemProps,TdInputProps,TdInputNumberProps,TdSelectProps,TdCheckTagProps,TdCheckboxProps,TdUploadProps,TdCheckTagGroupProps} from 'tdesign-vue-next'
const  activeTabKey=ref(1)

type FieldProps={
    formItemProps:TdFormItemProps
    fieldProps:any
    name:string
    value?:any
    span?:number
    component:any
}
const fields:FieldProps[]=[]

const formData=reactive<any>({})

</script>