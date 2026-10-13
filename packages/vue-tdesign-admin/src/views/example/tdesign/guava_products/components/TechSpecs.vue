<script setup lang="ts">
import {SchemaForm,type FieldSchema} from 'src/views/example/tdesign/components/FSchemaForm/index'
import { computed, ref } from 'vue';

const value=ref({
  "groups": [
    {
      "title": "霏霏",
      "items": []
    },
    {
      "title": "斯塔克豪斯",
      "items": [
        {
          "img": "aa",
          "title": "ff",
          "specs": [
            {
              "key": "ff",
              "value": "ff"
            },
            {
              "key": "aaa",
              "value": "bbbb"
            }
          ]
        }
      ],
      "bb": "fdfdfdafd"
    }
  ]
})
const schema=computed<FieldSchema[]>(()=>{
    return [
                    {
                        type:'array',
                        key:'groups',
                        label:'分组（groups）',
                        sortable:true,
                        getItemLabel(index, item) {
                            return `分组 ${index+1}`
                        },
                        itemFields:[
                            {
                                type:'string',
                                key:'title',
                                label:'标题（title）',

                            },{
                                type:"array",
                                key:'items',
                                label:'条目（items）',
                                
                                sortable:true,
                                itemFields:[
                                    {
                                        type:'string',
                                        key:'img',
                                        label:'图片（img）'
                                    },{
                                        type:'string',
                                        key:'title',
                                        label:'title'
                                    },{
                                        type:'array',
                                        key:'specs',
                                        label:'规格（specs）',
                                        itemFields:[
                                            {
                                                type:'string',
                                                key:'key',
                                                label:'参数（key）'
                                            },
                                            {
                                                type:'string',
                                                key:'value',
                                                label:'参数值（value）'
                                            }
                                        ]
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
            <t-form-item label="Tech Specs">
                <t-textarea v-model="valueStr"></t-textarea>
            </t-form-item>
            <SchemaForm v-model="value" :schema="schema" title="技术规格(Tech Specs)"></SchemaForm>
        </t-form>
    </div>
</template>
