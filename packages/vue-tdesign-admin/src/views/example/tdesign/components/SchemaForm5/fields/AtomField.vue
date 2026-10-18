<script setup lang="ts">
// ============================================================================
// AtomField：原子节点
// 值直接读写节点自身；只订阅本节点的 version（自身值/可见性变化）。
// ============================================================================
import { computed } from 'vue'
import CollapseCard from '../../SchemaForm3/components/CollapseCard.vue'
import type { AtomFieldUI } from '../DataUI'
import { getNodeState } from '../context'

const props = defineProps<{
    field: AtomFieldUI
}>()

const snapshot = computed(() => {
    const state = getNodeState(props.field)
    return {
        version: state.version,
        value: props.field.value,
        label: props.field.label,
    }
})
const model = computed({
    get: () => snapshot.value.value,
    set: (value) => props.field.setValue(value),
})
const label = computed(() => snapshot.value.label)
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
