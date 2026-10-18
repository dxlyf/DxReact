<script setup lang="ts">
// ============================================================================
// AtomField：原子节点
// 值直接读写节点自身，不再经过 path 查找
// ============================================================================
import { computed } from 'vue'
import CollapseCard from '../components/CollapseCard.vue'
import type {AtomFieldSchema,FieldPath} from '../types'
import { useSchemaFormContext } from '../composables/useSchemaForm.ts';

const props = defineProps<{
    path:FieldPath
    schema: AtomFieldSchema
}>()
const form=useSchemaFormContext()
const fieldValue = computed({
    get: () => form.getPathValue(props.path,props.schema.defaultValue),
    set: (value) => form.setPathValue(props.path,value),
})
const label = computed(() => {
    const key=typeof props.path[props.path.length-1]
    const index:number|null=typeof key==='number'?key:null
    const label=props.schema.label||''
    return props.schema.formatLabel?props.schema.formatLabel(label,index,props.schema):label
})
  
</script>
<template>
    <div class="flex flex-col" v-if="schema.wrapper === 'field'">
        <div class="text-sm font-medium text-gray-700">{{ label }}</div>
        <div class="mt-2">
            <component :is="schema.component" v-model="fieldValue" v-bind="schema.props" />
        </div>
    </div>
    <CollapseCard :title="label ?? ''" v-else-if="schema.wrapper === 'card'">
        <component :is="schema.component" v-model="fieldValue" v-bind="schema.props" />
    </CollapseCard>
    <component v-else :is="schema.component" v-model="fieldValue" v-bind="schema.props" />
</template>
