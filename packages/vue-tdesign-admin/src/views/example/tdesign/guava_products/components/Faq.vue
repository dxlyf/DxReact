<script setup lang="ts">
import { SchemaForm, type FieldSchema } from 'src/views/example/tdesign/components/FSchemaForm/index'
import { computed, ref } from 'vue';

const value = ref([])
const schema = computed<FieldSchema>(() => {
    return  {
        type: "array",
        key: 'groups',
        label: "Groups",
        itemFields: [
            {
                type: 'string',
                key: 'title',
                label: 'title'
            }, {
                type: 'array',
                key: 'questions',
                label: 'Questions',
                getItemLabel(index, item) {
                    return `Q&A ${index + 1}`
                },
                itemFields: [
                    {
                        type: 'string',
                        key: 'question',
                        label: 'question',
                    },
                    {
                        type: 'textarea',
                        key: 'answer',
                        label: 'answer',
                        props:{
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
</script>
<template>
    <div class="py-8 text-[var(--td-text-color-placeholder)]">
        <t-form class="w-full" layout="vertical" label-align="top">
            <t-form-item label="Faq">
                <t-textarea v-model="valueStr"></t-textarea>
            </t-form-item>
            <SchemaForm v-model="value" :schema="schema" title="FAQ"></SchemaForm>
        </t-form>
    </div>
</template>
