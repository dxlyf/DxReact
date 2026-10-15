<script setup lang="ts">
import { computed, markRaw } from 'vue';
import { AllFieldScheme, FieldPath } from '../types.ts';
import ArrayField from './ArrayField.vue';
import ObjectField from './ObjectField.vue';
import AtomField from './AtomField.vue';

const props=defineProps<{
    scheme: AllFieldScheme
    path: FieldPath;
}>()
const components={
    array:ArrayField,
    object:ObjectField,
    atom:AtomField,
} as const;
const FieldComp=computed(()=>{
    return markRaw(components[props.scheme.type])
})
</script>
<template>
     <component :is="FieldComp as any" :scheme="props.scheme" :path="props.path" />
</template>