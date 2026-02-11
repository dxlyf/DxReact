<template>
    <div>
        <t-tabs v-model="activeTab">
            <t-tab-panel :value="1" label="基础表单">
                <t-form class="!p-4" :data="fromData" reset-type="initial" @submit="handleSubmit">
                    <t-row :gutter="[6, 16]">
                        <t-col v-for="(f, i) in fields" :key="f.key" v-bind="f.colProps">
                            <t-form-item v-bind="f.formItemProps">
                                <component v-model:[f.model]="fromData[f.name]" :is="f.component" v-bind="f.fieldProps">
                                    <template v-for="(slot, slotName, index) in f.slots" :key="index" #[slotName]="slotData">
                                       <component :is="slot" v-bind="slotData || {}" />
                                    </template>
                                </component>
                            </t-form-item>
                        </t-col>

                        <t-col :span="12" class="mt-5" key="_btns">
                            <t-space>
                                <t-button theme="primary" type="submit">提交</t-button>
                                <t-button theme="default" type="reset">重置</t-button>
                            </t-space>
                        </t-col>
                    </t-row>

                </t-form>
            </t-tab-panel>
        </t-tabs>
    </div>
</template>

<script lang="ts">
import { type PropType,type Component, type MaybeRefOrGetter,vModelText,h,vModelDynamic, withDirectives, ref, reactive, shallowReactive, shallowRef, computed, onMounted, onUnmounted, defineComponent, type VNode, toRaw } from 'vue'
import type { TdFormItemProps, TdInputProps,TdDateRangePickerProps,TdTimeRangePickerProps, TdColProps, TdFormProps, TdSelectProps, TdRadioGroupProps, TdCheckboxGroupProps, TdDatePickerProps, TdTimePickerProps, TdUploadProps, TdTreeSelectProps } from 'tdesign-vue-next'
import { format } from 'path'

const componentMap = {
    text: 't-input',
    number: 't-input-number',
    select: 't-select',
    date: 't-date-picker',
    time: 't-time-picker',
    datetime: 't-datetime-picker',
    dateRange: 't-date-range-picker',
    timeRange: 't-time-range-picker',
    radio: 't-radio-group',
    checkbox: 't-checkbox-group',
    autoComplete: 't-auto-complete',
    cascader: 't-cascader',
    switch: 't-switch',
    slider: 't-slider',
    color: 't-color-picker',
    adornment: 't-input-adornment',
    tagInput: 't-tag-input',
    rangeInput: 't-range-input',
    textarea: 't-textarea',
    treeSelect: 't-tree-select',
    upload: 't-upload',
}
type ComponentMapValue = keyof typeof componentMap
type FieldColumn = {
    type: ComponentMapValue
    label: string
    name: string
    span?: number
    model?:string
    formItemProps?: TdFormItemProps | (() => TdFormItemProps)
    fieldProps?: any | (() => any)
        slots?: Record<string, () => VNode>
    render?: () => VNode
}
type RealFieldColumn = Omit<FieldColumn, 'formItemProps' | 'fieldProps'> & {
    key: string
    formItemProps?: TdFormItemProps
    fieldProps?: any
    component: string
    colProps?: TdColProps
}

export default defineComponent({
    props: {
        fields: {
            type: Array as PropType<FieldColumn[]>,
            default: () => [
                {
                    label: '文本',
                    name: 'text',
                    type: 'text',
                    span: 12,
                    formItemProps: {
                        rules:[{ required: true, message: '请输入文本' }]
                    },
                    fieldProps: {
                        placeholder: '请输入文本',
                    },

                }, {
                    label: '数字',
                    name: 'number',
                    type: 'number',
                    span: 12,
                    formItemProps: {},
                    fieldProps: {
                        placeholder: '请输入数字',
                    },
                },{
                    label: '选择',
                    name: 'select',
                    type: 'select',
                    span: 12,
                    formItemProps: {
                        rules:[{ required: true, message: '请选择' }]
                    },
                    fieldProps: {
                        placeholder: '请选择',
                        clearable: true,
                        filterable: true,
                        options:[
                            {
                                label:'选项1',
                                value:'1'
                            },
                            {
                                label:'选项2',
                                value:'2'
                            }
                        ]
                    } as TdSelectProps,
                },{
                    label: '单选',
                    name: 'radio',
                    type: 'radio',
                    span: 12,
                    formItemProps: {
                        rules:[{ required: true, message: '请选择' }]
                    },
                    fieldProps: {
                        options:[
                            {
                                label:'选项1',
                                value:'1'
                            },
                            {
                                label:'选项2',
                                value:'2'
                            }
                        ]
                    } as TdRadioGroupProps,
                },{
                    label: '多选',
                    name: 'checkbox',
                    type: 'checkbox',
                    span: 12,
                    formItemProps: {
                        rules:[{ required: true, message: '请选择' }]
                    },
                    fieldProps: {
                        defaultValue: [],
                        options:[
                            {
                                label:'选项1',
                                value:'1'
                            },
                            {
                                label:'选项2',
                                value:'2'
                            }
                        ]
                    } as TdCheckboxGroupProps,
                },{
                    label: '日期',
                    name: 'date',
                    type: 'date',
                    span: 12,
                    formItemProps: {
                        rules:[{ required: true, message: '请选择日期' }]
                    },
                    fieldProps: {
                        placeholder: '请选择日期',
                    } as TdDatePickerProps,
                },{
                    label: '时间',
                    name: 'time',
                    type: 'time',
                    span: 12,
                    formItemProps: {
                        rules:[{ required: true, message: '请选择时间' }]
                    },
                    fieldProps: {
                        placeholder: '请选择时间',
                    } as TdTimePickerProps,
                },
                {
                    label: '日期范围',
                    name: 'dateRange',
                    type: 'dateRange',
                    span: 12,
                    formItemProps: {
                        rules:[{ required: true, message: '请选择日期范围' }]
                    },
                    fieldProps: {
                        placeholder: '请选择日期范围',
                    } as TdDateRangePickerProps,
                },{
                    label: '时间范围',
                    name: 'timeRange',
                    type: 'timeRange',
                    span: 12,
                    formItemProps: {
                        rules:[{ required: true, message: '请选择时间范围' }]
                    },
                    fieldProps: {
                        placeholder: '请选择时间范围',
                    } as TdTimeRangePickerProps,
                },
                 {
                    label: '日期时间范围',
                    name: 'datetimeRange',
                    type: 'dateRange',
                    span: 12,
                    formItemProps: {
                        rules:[{ required: true, message: '请选择日期时间范围' }]
                    },
                    fieldProps: {
                        format:'YYYY-MM-DD HH:mm:ss',
                        enableTimePicker:true,
                        placeholder: '请选择日期时间范围',
                    } as TdDateRangePickerProps,
                },{
                    label:'单文件',
                    name:'singleFile',
                    type:'upload',
                     formItemProps: {
                        rules:[{ required: true, message: '请上传文件' }]
                    },
                    fieldProps: {
                        placeholder: '请上传文件',
                        showUploadProgress:true,
                        showImageFileName:true,
                        theme:'file',
                        draggable:true,
                        
                    } as TdUploadProps,
                },{
                    label: '单图片',
                    name: 'singleImage',
                    type: 'upload',
                    span: 12,
                    formItemProps: {
                        rules:[{ required: true, message: '请上传文件' }]
                    },
                    slots:{
                        dragContent:(h)=>{
                            console.log('ffffff')
                            return h('div',{
                            type:'primary',
                            size:'small',
                        },'上传图片')
                        }
                    },
                    fieldProps: {
                        
                      //  placeholder: '请上传文件',
                        showUploadProgress:true,
                        showImageFileName:true,
                        theme:'image',
                        draggable:true,
                        action:'/api/upload',
                        locale:{
                            dragger:{
                               // clickAndDragText:'aa点击上传',
                               // dragDropText:'拖拽上传',
                                draggingText:'正在上传aa',
                            },
                            triggerUploadText:{
                               // image:'上传图片',
                                normal:'上传文件',
                            }
                        },
                        formatResponse(res){
                            console.log('res',res)
                            return {
                                status:'success',
                                url:res.data.files[0].url,
                            }
                        }
                       // dragContent:'ffffff'
                        
                    } as TdUploadProps,
                },{
                    label: '自定义单图片上传',
                    name: 'customSingleImage',
                    type: 'upload',
                    span: 12,
                    formItemProps: {
                        rules:[{ required: true, message: '请上传文件' }]
                    },
                    slots:{
                        dragContent:()=>{
                            return h('t-button',null,'上传')
                        }
                    },
                    fieldProps: {
                        
                      //  placeholder: '请上传文件',
                        showUploadProgress:true,
                        showImageFileName:true,
                        theme:'custom',
                        draggable:true,
                        action:'/api/upload',
                       
                        formatResponse(res){
                            console.log('res',res)
                            return {
                                status:'success',
                                url:res.data.files[0].url,
                            }
                        }
                       // dragContent:'ffffff'
                        
                    } as TdUploadProps,
                },{
                    label:'树选择',
                    name:'treeSelect',
                    type:'treeSelect',
                    span: 12,
                    formItemProps: {
                        rules:[{ required: true, message: '请选择' }]
                    },
                    fieldProps: {
                        clearable:true,
                        placeholder: '请选择',
                        data:[
                            {
                                label:'1',
                                value:'1',
                                children:[
                                    {
                                        label:'1-1',
                                        value:'1-1',
                                    }
                                ]
                            }
                        ]
                       // dragContent:'ffffff'
                        
                    } as TdTreeSelectProps,
                }
            ] as FieldColumn[]
        }
    },
    directives:{
       // 'modelVal':vModelDynamic  
    },
    setup(props, { emit }) {
        const activeTab = shallowRef(1)
        const fromData=reactive<any>({checkbox:[],timeRange:[],singleImage:[],customSingleImage:[],dateRange:[],datetimeRange:[]})

        const fields = computed<RealFieldColumn[]>(() => {
            return props.fields.map((f, index) => {
                const formItemProps = f.formItemProps
                const fieldProps = f.fieldProps
                return {
                    key: f.name || index,
                    model:'modelValue',
                     slots:{},
                    ...f,

                    formItemProps: {
                        label: f.label,
                        name: f.name,
                        labelAlign: 'top',
                        ...(formItemProps ? (typeof formItemProps === 'function' ? formItemProps() : formItemProps) : {}),
                    },
                    fieldProps: {
                        ...(fieldProps ? (typeof fieldProps === 'function' ? fieldProps() : fieldProps) : {}),
                    },
                    colProps: {
                        span: f.span || 12,
                    },
                    component: f.render ? f.render() : componentMap[f.type],
                }
            }) as RealFieldColumn[]
        })

        const handleSubmit:TdFormProps['onSubmit']=(e)=>{
            console.log('fromData',toRaw(fromData))
        }
        return {
            activeTab,
            fields,
            fromData,
            handleSubmit
        }
    }
})
</script>