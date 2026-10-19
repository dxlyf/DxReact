<script setup lang="ts">
import { SchemaForm, type FormSchema } from 'src/views/example/tdesign/components/SchemaForm3'
import TableAtomField from 'src/views/example/tdesign/components/SchemaForm3/components/TableAtomField.vue'
import { shallowRef } from 'vue';
import { computed, ref } from 'vue';

const value = shallowRef({
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
const schema = computed<FormSchema>(() => {
    return {
        type: 'object',
        key: 'root',
        label: '下载（Downloads）',
        formatItemLabel(item, index) {
            return `下载项 ${index + 1}`
        },
        schemas: [{
            type: 'array',
            valueType: 'array<string>',
            key: 'nodes',
            label: 'Nodes',
            sortable: true,
            formatItemLabel(item, index) {
                return `notice ${index + 1}`
            },
            schemas: [{
                type: 'atom',
                component: 't-textarea',
                key: 'node',
                label: 'node',
                props: {
                    style: { height: '200px' }
                }
            }]
        }, {
            type: "array",
            key: 'groups',
            label: "Groups",
            schemas: [
                {
                    type: 'atom',
                    key: 'title',
                    label: 'title',
                    component: 't-input'
                }, {
                    type: 'array',
                    key: 'items',
                    label: 'Downloads',
                    schemas: [
                        {
                            type: 'atom',
                            key: 'title',
                            label: 'title',
                            component: 't-input'
                        },
                        {
                            type: 'atom',
                            key: 'disclaimer',
                            label: 'disclaimer',
                            component: 't-input'
                        }, {
                            type: 'atom',
                            key: 'date',
                            label: 'date',
                            component: 't-date-picker'
                        }, {
                            type: 'atom',
                            key: 'specs',
                            label: 'Specs',
                            component: TableAtomField,
                            props: {
                                columns: [{
                                    key: 'key',
                                    type: 't-select',
                                    title: 'key',
                                    width: 300,
                                    props: {
                                        options: [
                                            { value: 'pdf', label: 'pdf' }
                                        ]
                                    }
                                }, {
                                    type: 't-input',
                                    key: 'value',
                                    title: 'value'

                                }]
                            }
                        }
                    ]
                }
            ]
        }]
    }
})
const valueStr = computed(() => {
    return JSON.stringify(value.value, null, 2)
})
</script>
<template>
    <div class="py-8 text-[var(--td-text-color-placeholder)]">
        <t-form class="w-full" layout="vertical" label-align="top">
            <t-form-item label="Download">
                <t-textarea v-model="valueStr"></t-textarea>
            </t-form-item>
            <SchemaForm v-model="value" :schema="schema"></SchemaForm>
        </t-form>
    </div>
</template>
