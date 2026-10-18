<script setup lang="ts">
// ============================================================================
// AtomField：原子节点
// 值直接读写节点自身，不再经过 path 查找
// ============================================================================
import { computed } from 'vue'
import CollapseCard from '../../SchemaForm3/components/CollapseCard.vue'
import type { AtomFieldUI } from '../ReactiveUI'

const props = defineProps<{
    field: AtomFieldUI
}>()

const model = computed({
    get: () => props.field.value,
    set: (value) => props.field.setValue(value),
})
const label = computed(() => props.field.label)
</script>
<template>
    <div class="flex flex-col" v-if="field.schema.wrapper === 'field'">
        <div class="text-sm font-medium text-gray-700">{{ label }}</div>
        <div class="mt-2">
            <component :is="field.schema.component" v-model="model" v-bind="field.schema.props" />
        </div>
    </div>
    <CollapseCard :title="label ?? ''" v-else-if="field.schema.wrapper === 'card'">
        <component :is="field.schema.component" v-model="model" v-bind="field.schema.props" />
    </CollapseCard>
    <component v-else :is="field.schema.component" v-model="model" v-bind="field.schema.props" />
</template>
