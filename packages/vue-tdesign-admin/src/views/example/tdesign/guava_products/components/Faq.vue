<script setup lang="ts">
import { SchemaForm, type FormSchema } from 'src/views/example/tdesign/components/SchemaForm3'
import { computed, onMounted, ref, shallowRef } from 'vue';

const value = shallowRef([])

const schema = computed<FormSchema>(() => {
    return {
        type: "array",
        key: 'groups',
        label: "Groups",
        sortable:true,
        schemas: [
            {
                type: 'atom',
                component: 't-input',
                key: 'title',
                label: 'title'
            }, {
                type: 'array',
                key: 'questions',
                label: 'Questions',
                formatItemLabel(item, index) {
                    return `Q&A ${index + 1}`
                },
                schemas: [
                    {
                        type: 'atom',
                        component: 't-input',
                        key: 'question',
                        label: 'question',
                    },
                    {
                        type: 'atom',
                        key: 'answer',
                        component: 't-textarea',
                        label: 'answer',
                        props: {
                            style: {
                                height: '200px'
                            }
                        }
                    }]
            }
        ]
    }
})
const valueStr = computed(() => {
    return JSON.stringify(value.value, null, 2)
})
onMounted(()=>{
    setTimeout(()=>{
        value.value=([
  {
    "title": "fdafdaffdaf",
    "questions": [
      {
       // "question": "fdaf",
        "answer": "fdafda"
      },
      {
        "question": "44",
        "answer": "aaa",
        "age":'4343'
      }
    ]
  }
])
    },1000)
})
</script>
<template>
    <div class="py-8 text-[var(--td-text-color-placeholder)]">
        <t-form class="w-full" layout="vertical" label-align="top">
            <t-form-item label="Faq">
                <t-textarea :value="valueStr"></t-textarea>
            </t-form-item>
            <SchemaForm  v-model="value" :schema="schema" title="FAQ"></SchemaForm>
        </t-form>
    </div>
</template>
