<script setup lang="ts">
import EditLayout from './components/Layouts/EditLayout.vue'
</script>
<template>
    <EditLayout lang-type='button' title="Edit">
        <template #actions>
            <t-button theme="primary">返回</t-button>
        </template>
            <t-form class="w-full">
                <t-tabs class="tabs" theme="normal" default-value="basic" >
                <t-tab-panel value="basic" label="Basic">
                    
                </t-tab-panel>
                <t-tab-panel value="techspecs" label="TechSpecs">TechSpecs</t-tab-panel>
            </t-tabs>
            </t-form>
    </EditLayout>
</template>
<style lang="css" scoped>   
    
</style>