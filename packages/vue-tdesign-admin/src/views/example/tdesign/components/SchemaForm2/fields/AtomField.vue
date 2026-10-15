<script setup lang="ts">
import { computed, inject } from 'vue';
import {
  type FieldPath,
  type AtomFieldScheme,
} from '../types';
import { USE_SCHEME_CONTEXT_KEY, UseSchemeFormInstance } from '../composables/useSchemeForm';

const props = defineProps<{ scheme: AtomFieldScheme; path: FieldPath }>();
const form=inject<UseSchemeFormInstance>(USE_SCHEME_CONTEXT_KEY)
const model= computed({
        get:()=>form.getValue(props.path,props.scheme.defaultValue),
        set:(value)=>form.setValue(props.path,value)
})
const label=computed(()=>{
    return props.scheme.formatLabel?props.scheme.formatLabel(model.value,props.scheme):props.scheme.label
})
</script>
<template>
    <div class="flex flex-col" v-if="scheme.wrapper">
        <div class="text-sm font-medium text-gray-700">{{ label }}</div>
        <div class="mt-2">
            <component :is="scheme.component" v-model="model" v-bind="scheme.props" />
        </div>
    </div>
    <component v-else :is="scheme.component" v-model="model" v-bind="scheme.props" />
</template>