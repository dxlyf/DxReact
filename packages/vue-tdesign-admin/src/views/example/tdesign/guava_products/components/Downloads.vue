<script setup lang="ts">
import {SchemaForm,type FieldSchema} from 'src/views/example/tdesign/components/FSchemaForm/index'
import { computed, ref } from 'vue';

const value=ref({
  "nodes": [
    "fdafdasfdsa",
    "fdafads"
  ],
  "groups": [
    {
      "title": "土土寺",
      "items": [
        {
          "title": "aa",
          "disclaimer": "fd",
          "date": "2026-10-16",
          "specs": [
            {
              "key": "pdf",
              "value": "霏霏"
            },
            {
              "key": "pdf",
              "value": "土土土"
            }
          ]
        }
      ]
    }
  ]
})
const schema=computed<FieldSchema[]>(()=>{
    return [
                    {
                        type:'array<string>',
                        key:'nodes',
                        label:'Nodes',
                        sortable:true,
                        getItemLabel(index, item) {
                            return `notice ${index+1}`
                        },
                        props:{
                            style:{height:'200px'}
                        }
                    },{
                        type:"array",
                        key:'groups',
                        label:"Groups",
                        itemFields:[
                            {
                                type:'string',
                                key:'title',
                                label:'title'
                            },{
                                type:'array',
                                key:'items',
                                label:'Downloads',
                                itemFields:[
                                    {
                                        type:'string',
                                        key:'title',
                                        label:'title',
                                    },
                                     {
                                        type:'string',
                                        key:'disclaimer',
                                        label:'disclaimer',
                                    },{
                                          type:'date',
                                        key:'date',
                                        label:'date',
                                    },{
                                        type:'table',
                                        key:'specs',
                                        label:'Specs',
                                        columns:[{
                                            key:'key',
                                            type:'select',
                                            title:'key',
                                            width:300,
                                            props:{
                                                options:[
                                                    {value:'pdf',label:'pdf'}
                                                ]
                                            }
                                        },{
                                            type:'string',
                                            key:'value',
                                            title:'value'
                        
                                        }]
                                    }
                                ]
                            }
                        ]
                    }
                ]
})
const valueStr=computed(()=>{
    return JSON.stringify(value.value,null,2)
})
</script>
<template>
    <div class="py-8 text-[var(--td-text-color-placeholder)]">
        <t-form class="w-full" layout="vertical"  label-align="top" >
            <t-form-item label="Download">
                <t-textarea v-model="valueStr"></t-textarea>
            </t-form-item>
            <SchemaForm v-model="value" :schema="schema" title="下载(Download)"></SchemaForm>
        </t-form>
    </div>
</template>
