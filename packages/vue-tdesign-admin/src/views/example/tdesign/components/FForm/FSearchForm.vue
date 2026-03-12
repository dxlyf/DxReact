<script  lang="ts">
import { ref, computed, watch, type PropType, defineComponent,reactive, toRaw, readonly } from 'vue'
import type { FormInstanceFunctions, TdColProps, TdFormItemProps, TdSelectProps } from 'tdesign-vue-next'
import type { TdInputProps,TdInputNumberProps } from 'tdesign-vue-next'
import {useRoute, useRouter} from 'vue-router'
export const FieldValueTypeMap={
  text:'t-input',
  number:'t-input-number',
  select:'t-select',
}
export type FieldComponentPropsMap={
  text:TdInputProps,
  number:TdInputNumberProps,
  select:TdSelectProps
}
export type ValueOrGetter<T> = T | (() => T)
export type FieldType<T extends keyof FieldComponentPropsMap = 'text'> ={
  name?: string
  label?: string
  type?:T
  span?:number
  visible?:boolean
  formItemProps?:ValueOrGetter<TdFormItemProps>
  fieldProps?:ValueOrGetter<FieldComponentPropsMap[T]>
}
export type InternalFieldType={
  type:string
  fieldProps:any
  fieldSlots:any
  formItemProps:TdFormItemProps
  showFormItem:boolean
  colProps:TdColProps
  hidden:boolean
  name:string
  key:string
}


export function useUrlParams(options: {
  autoSync?: boolean
  replace?: boolean
  debounceTime?: number
} = {}) {
  const {
    autoSync = false,        // 是否自动同步到URL
    replace = false,         // 是否替换历史记录
    debounceTime = 300       // 防抖时间
  } = options

  // 从URL初始化参数
  const params = ref<Record<string, string>>({})
  const searchParams = new URLSearchParams(window.location.search)
  
  for (const [key, value] of searchParams) {
    params.value[key] = value
  }

  // 防抖定时器
  let timeoutId:any = null

  /**
   * 更新参数
   */
  const updateParams = (newParams: Record<string, any>, syncOptions: {
    sync?: boolean
    replace?: boolean
  } = {}) => {
    params.value = {
      ...params.value,
      ...newParams
    }

    const shouldSync = syncOptions.sync !== undefined ? syncOptions.sync : autoSync
    const shouldReplace = syncOptions.replace !== undefined ? syncOptions.replace : replace

    if (shouldSync) {
      syncToUrl(shouldReplace)
    }
  }

  /**
   * 同步到URL
   */
  const syncToUrl = (replaceHistory = replace) => {
    if (debounceTime > 0) {
      if (timeoutId) clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        updateUrl(replaceHistory)
      }, debounceTime)
    } else {
      updateUrl(replaceHistory)
    }
  }

  /**
   * 更新URL
   */
  const updateUrl = (replaceHistory: boolean = replace) => {
    const url = new URL(window.location.href)
    
    // 清空现有参数
    Array.from(url.searchParams.keys()).forEach(key => {
      url.searchParams.delete(key)
    })
    
    // 添加新参数
    Object.entries(params.value).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        url.searchParams.set(key, value)
      }
    })

    const newUrl = url.pathname + url.search + url.hash
    
    if (replaceHistory) {
      window.history.replaceState({ ...window.history.state }, '', newUrl)
    } else {
      window.history.pushState({ ...window.history.state }, '', newUrl)
    }
  }

  /**
   * 删除参数
   */
  const removeParams = (keys: string | string[], syncOptions:{sync?:boolean,replace?:boolean} = {}) => {
    const keysToRemove = Array.isArray(keys) ? keys : [keys]
    
    keysToRemove.forEach(key => {
      delete params.value[key]
    })

    const shouldSync = syncOptions.sync !== undefined ? syncOptions.sync : autoSync
    if (shouldSync) {
      syncToUrl(syncOptions.replace)
    }
  }

  /**
   * 清空参数
   */
  const clearParams = (syncOptions: {sync?:boolean,replace?:boolean} = {}) => {
    params.value = {}
    
    const shouldSync = syncOptions.sync !== undefined ? syncOptions.sync : autoSync
    if (shouldSync) {
      syncToUrl(syncOptions.replace)
    }
  }

  // 监听popstate事件（用户点击前进/后退）
  window.addEventListener('popstate', () => {
    const newParams: Record<string, any> = {}
    const newSearchParams = new URLSearchParams(window.location.search)
    
    for (const [key, value] of newSearchParams) {
      newParams[key] = value
    }
    
    params.value = newParams
  })

  return {
    params: readonly(params),  // 只读，防止直接修改
    updateParams,
    removeParams,
    clearParams,
    syncToUrl
  }
}
export default defineComponent({
  props:{
    columns:{
      type:Array as PropType<FieldType[]>,
      default:()=>[]
    },
    defaultSpan:{
      type:Number,
      default:4
    },
    expandRows:{
      type:Number,
      default:1
    }
  },
  setup(props,{slots}){

     const formData=reactive<any>({})

     const extraSlots=(prefix:string,slots:any)=>{
         const curSlots:any={}
         for(let [name,value] of Object.entries(slots)){
             if(name.startsWith(prefix)){
                 curSlots[name]=value
             }
         }
         return curSlots
     }
     const finalColumns=computed<InternalFieldType[]>(()=>{
      let curSpan=0
        return props.columns.filter(d=>!d.visible).map((col,i)=>{

             const fieldProps=typeof col.fieldProps==='function'?col.fieldProps():col.fieldProps
             const formItemProps=typeof col.formItemProps==='function'?col.formItemProps():col.formItemProps
             const span=col.span??props.defaultSpan
             const name=col.name!
             const modelValue=formData[name]

             curSpan+=span
             const curRow=Math.ceil(curSpan/12)
             const hidden=curRow>props.expandRows
             const curCol= {
               type:FieldValueTypeMap[col.type]||col.type,
               key:col.name||(i+''),
               name:col.name,
               fieldProps:{
                 placeholder:col.label,
                  modelValue:modelValue,
                 'onUpdate:modelValue':(val:any)=>{
                    formData[col.name]=val;
                 },
                ...(fieldProps||{})
               },
               fieldSlots:extraSlots(col.name+'_',slots),
               formItemProps:{
                 name:col.name,
                 label:col.label,
                 ...(formItemProps||{})
               },
               colProps:{
                 span:span
               },
               hidden:hidden,
               showFormItem:false

             } as InternalFieldType
             return curCol
        })
     })
     const totalRows=computed(()=>{
      return Math.ceil(finalColumns.value.reduce((sum,d)=>d.colProps.span+sum,0)/12)
     })
     const hasExpandRow=computed(()=>{
          return totalRows.value>props.expandRows
     })
     const collapsed=ref(true)
     const router=useRouter()
     const route=useRoute()
     const handleSubmit=(e)=>{
        const data=toRaw(formData)
        router.replace({
          query:{...route.query,...data}
        })
        console.log('search',toRaw(formData))
     }
     return {
        collapsed,
        hasExpandRow,
        columns:finalColumns,
        formData,
        handleSubmit
     }
  }
})
</script>

<template>
    <t-form
      ref="formRef"
      :data="formData"
      @submit="handleSubmit"
      :colon="true"
      label-align="right"
      class="search-form"
    >
      <t-row :gutter="[16,8]">
        <template v-for="field in columns"
          :key="field.key"
       >
        <t-col  v-bind="field.colProps" v-show="!field.hidden||!collapsed">
        <template v-if="field.showFormItem">
            <t-form-item v-bind="field.formItemProps" >
              <component :is="field.type" v-bind="field.fieldProps">
                  <template v-for="(value,name) in field.fieldSlots" #[name]="slotData">
                    <slot :name="name" v-bind="slotData || {}" />
                  </template>
              </component>
            </t-form-item>
        </template>
         <template v-else>
              <component :is="field.type" v-bind="field.fieldProps">
                  <template v-for="(value,name) in field.fieldSlots" #[name]="slotData">
                    <slot :name="name" v-bind="slotData || {}" />
                  </template>
              </component>
        </template>
        </t-col>
        </template>
        <t-col>
          <div class="flex gap-1">
            <t-button theme="default" type="reset">重置</t-button>
            <t-button type="submit" theme="primary">查询</t-button>
            <t-link v-if="hasExpandRow" theme="primary" class="self-end" @click="collapsed=!collapsed">
              {{ collapsed?'展开':'收起' }}
               <transition>
                 <t-icon v-if="collapsed" name="chevron-down-s"></t-icon>
                 <t-icon v-else name="chevron-up-s"></t-icon>
               </transition>
            </t-link>
          </div>
        </t-col>
      </t-row>
    </t-form>
</template>

<style scoped>

</style>
