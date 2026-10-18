<script setup lang="ts">
import type { AllFieldSchema, FieldPath } from '../types'
import ObjectField from './ObjectField.vue'
import ArrayField from './ArrayField.vue'
import AtomField from './AtomField.vue'

const props = defineProps<{
    path: FieldPath
    schema: AllFieldSchema
}>()

</script>
<template>
    <ObjectField v-if="schema.type === 'object'" :schema="schema" :path="path" />
    <ArrayField v-else-if="schema.type === 'array'" :schema="schema" :path="path" />
    <AtomField v-else-if="schema.type === 'atom'" :schema="schema" :path="path" />
</template>
