<script setup lang="ts">
import { computed } from 'vue'
import { ArrayFieldUI, AtomFieldUI, ObjectFieldUI, type FieldUI } from '../ReactiveUI'
import ObjectField from './ObjectField.vue'
import ArrayField from './ArrayField.vue'
import AtomField from './AtomField.vue'

const props = defineProps<{
    field: FieldUI
}>()

/** 按节点类型分发到对应渲染组件 */
const objectField = computed(() => (props.field instanceof ObjectFieldUI ? props.field : null))
const arrayField = computed(() => (props.field instanceof ArrayFieldUI ? props.field : null))
const atomField = computed(() => (props.field instanceof AtomFieldUI ? props.field : null))
</script>
<template>
    <ObjectField v-if="objectField" :field="objectField" />
    <ArrayField v-else-if="arrayField" :field="arrayField" />
    <AtomField v-else-if="atomField" :field="atomField" />
</template>
