<script setup lang="ts">
import {useVModel} from './composables/useVModel'
import {useSchemeForm,type UseSchemeFormInstance,USE_SCHEME_CONTEXT_KEY} from './composables/useSchemeForm.ts'
import { inject, provide, shallowRef, toRaw, watch } from 'vue';
import { FormScheme } from './types';
import CollapseCard from './components/CollapseCard.vue';
import FormField from './fields/FormField.vue';
type SchemaFormProps={
    title?:string;
    form:UseSchemeFormInstance;
}

const props=defineProps<SchemaFormProps>() 
const path=shallowRef([])
provide(USE_SCHEME_CONTEXT_KEY,props.form)


</script>

<template>
  <CollapseCard :title="title" class="w-full">
    <FormField :scheme="form.scheme.value" :path="path"></FormField>
  </CollapseCard>
</template>