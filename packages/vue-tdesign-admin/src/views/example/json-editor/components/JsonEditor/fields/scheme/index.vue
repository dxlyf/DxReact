<script setup lang="ts">
import {computed,provide} from 'vue'
import ArrayField from '../array/index.vue'
import StringField from '../string/index.vue'
import NumberField from '../number/index.vue'
import BooleanField from '../boolean/index.vue'
import ObjectField from '../object/index.vue'

import type {JsonScheme} from '../../types'

type Props={
    scheme:JsonScheme
    value:any
}
const props=defineProps<Props>()
const emit=defineEmits(['change'])
const components={
    array:ArrayField,
    string:StringField,
    number:NumberField,
    boolean:BooleanField,
    object:ObjectField
}
const getComponent=(scheme:JsonScheme)=>{
    return components[scheme.type]
}
const getValue=()=>{
    return props.value
}
const handleChange=(value:any)=>{
    emit('change',value)
}

</script>
<template>
    <component :is="getComponent(scheme)" :scheme="scheme" :value="value"></component>
</template>