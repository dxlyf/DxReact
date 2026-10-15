<script setup lang="ts">
import { computed } from 'vue';
import CollapseCard from '../components/CollapseCard.vue';
import { useField } from '../composables/useField';
import { ObjectFieldScheme, FieldPath } from '../types';
import FieldPopover from '../components/FieldPopover.vue';

const props=defineProps<{
    scheme: ObjectFieldScheme;
    path: FieldPath;
}>()
const title=computed(()=>{
    return props.scheme.formatLabel?props.scheme.formatLabel(props.scheme.label,props.scheme):props.scheme.label
})
</script>
<template>
    <CollapseCard :title="title">
        <template #extra>
            <FieldPopover :scheme="props.scheme" :path="props.path" />
        </template>
    </CollapseCard>
</template>