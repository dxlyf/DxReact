<script setup lang="ts">
import { AllFieldSchema, FieldPath } from '../types.ts';
import ArrayField from './ArrayField.vue';
import ObjectField from './ObjectField.vue';
import AtomField from './AtomField.vue';

const props=defineProps<{
    schema: AllFieldSchema
    path: FieldPath;
}>()
const components={
    array:ArrayField,
    object:ObjectField,
    atom:AtomField,
} as const;
const renderComponent=(schema:AllFieldSchema)=>{
    return components[schema.type]
}
</script>
<template>
     <component :is="renderComponent(schema) as any" :schema="props.schema" :path="props.path" />
</template>