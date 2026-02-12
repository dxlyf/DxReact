<template>
    <div>
        <tinymce-editor api-key="" v-model="value" :init="initialOptions">
        </tinymce-editor>
    </div>

</template>

<script setup lang="ts">
    import {defineComponent,type PropType,ref} from 'vue'
    import TinymceEditor from '@tinymce/tinymce-vue'
    const value=ref('')
   const initialOptions={

   }
</script>