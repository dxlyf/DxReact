<script  lang="ts">
import {defineComponent} from 'vue'
import type {} from './types'
import SchemeField from './fields/scheme/index.vue'
export const props={
    json:{
        type:Object,
        default:()=>{}
    }
}
export default defineComponent({
    name:'JsonEditor',
    props:props
})
</script>

<template>

</template>