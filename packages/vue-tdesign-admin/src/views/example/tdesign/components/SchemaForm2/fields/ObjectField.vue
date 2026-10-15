<script setup lang="ts">
import { computed } from 'vue';
import CollapseCard from '../components/CollapseCard.vue';
import { useField } from '../composables/useField';
import { ObjectFieldSchema, FieldPath } from '../types';
import FieldPopover from '../components/FieldPopover.vue';

const props=defineProps<{
    Schema: ObjectFieldSchema;
    path: FieldPath;
}>()
const title=computed(()=>{
    return props.Schema.formatLabel?props.schema.formatLabel(props.Schema.label,props.Schema):props.Schema.label
})
</script>
<template>
    <CollapseCard :title="title">
        <template #extra>
            <FieldPopover :Schema="props.schema" :path="props.path" />
        </template>
    </CollapseCard>
</template>