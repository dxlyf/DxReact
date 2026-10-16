<script setup lang="ts">
import { computed, reactive, ref, shallowRef, watch } from 'vue';
import {SchemaForm,type FormSchema} from '../components/SchemaForm2'

const formRef=ref<any>()
const formValue=shallowRef<any>({})
const formValueStr=computed(()=>{
    return JSON.stringify(formValue.value)
})
setTimeout(()=>{
    formRef.value?.init({"remarks":["fdasfda","fdafda"],"tips":"fdasfad","cables":[{"title":"fdfd","cable_name":"fd","buy_link":"fd","setup_method":[{"conent":"fdafda"}],"compatibilities":[{"title":"fd","value":"fdafd"}]}]})
},1000)
const schema=computed<FormSchema>(()=>{
        return {
            type:'object',
            key:'roots',
            label:'Campatibility',
            sortable:true,
            schemas:[{
                type:'array',
                valueType:'array<string>',
                key:'remarks',
                label:'备注',
                formatItemLabel(item, index, Schema) {
                    return '备注'+(index+1)
                },
                schemas:[{
                    type:'atom',
                    key:'remark',
                    label:'备注',        
                    component:'t-textarea',
                    props:{
                        autosize:{
                            minRows:3,
                        }
                    }
                }]
            },{
                type:"atom",
                key:'tips',
                label:'tips',
                component:'t-input'
            },{
                key:'cables',
                type:'array',
                label:'Cables',
                formatItemLabel(item, index, Schema) {
                    return 'Cable'+(index+1)
                },
                schemas:[
                    {
                        type:'atom',
                        key:'title',
                        label:'标题',
                        component:'t-input'
                    },{
                        type:'atom',
                        key:'cable_name',
                        label:'CableName',
                        component:'t-input'
                    },{
                        type:'atom',
                        key:'buy_link',
                        label:'CableType',
                        component:'t-input'
                    },{
                        type:'array',
                        key:'setup_method',
                        label:'SetupMethod',
                        formatItemLabel(item, index, Schema) {
                            return 'SetupMethod'+(index+1)
                        },
                        schemas:[{
                            type:'atom',
                            key:'conent',
                            label:'conent',
                            component:'t-input'
                        }]
                    },{
                        type:"array",
                        key:'compatibilities',
                        label:'Compatibilities',
                        formatItemLabel(item, index, Schema) {
                            return 'Compatibilities'+(index+1)
                        },
                        schemas:[{
                            type:'atom',
                            key:'title',
                            label:'title',
                            component:'t-input'
                        },{
                            type:'atom',
                            key:'value',
                            label:'value',
                            component:'t-input'
                        }]
                    }
                ]
            }]
        }
})
</script>
<template>
    <t-form label-align="top">
        <t-form-item label="相机兼容性" prop="compatibility">
            <t-input :value="formValueStr" />

        </t-form-item>
        <t-form-item>
            <SchemaForm ref="formRef" :schema="schema" @change="formValue = $event" />
        </t-form-item>        
    </t-form>
</template>