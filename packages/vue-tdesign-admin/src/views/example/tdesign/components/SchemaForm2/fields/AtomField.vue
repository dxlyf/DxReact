<script setup lang="ts">
import { computed, inject } from 'vue';
import CollapseCard from '../components/CollapseCard.vue';

import {
  type FieldPath,
  type AtomFieldSchema,
} from '../types';
import { USE_SCHEMA_CONTEXT_KEY, UseSchemaFormInstance } from '../composables/useSchemaForm';

const props = defineProps<{ schema: AtomFieldSchema; path: FieldPath }>();
const form=inject<UseSchemaFormInstance>(USE_SCHEMA_CONTEXT_KEY)
const model= computed({
        get:()=>form.getValue(props.path,props.schema.defaultValue),
        set:(value)=>form.setValue(props.path,value)
})
const label=computed(()=>{
    return props.schema.formatLabel?props.schema.formatLabel(model.value,props.schema):props.schema.label
})
</script>
<template>
    <div class="flex flex-col" v-if="schema.wrapper=='field'">
        <div class="text-sm font-medium text-gray-700">{{ label }}</div>
        <div class="mt-2">
            <component :is="schema.component" v-model="model" v-bind="schema.props" />
        </div>
    </div>
    <CollapseCard :title="label" v-else-if="schema.wrapper=='card'">
        <component :is="schema.component" v-model="model" v-bind="schema.props" />
    </CollapseCard>
    <component v-else :is="schema.component" v-model="model" v-bind="schema.props" />
</template>