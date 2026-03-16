<script setup lang="ts">
</script>
<template>
    <t-table v-bind="$attrs" >
        <template v-for="(value,name) in $slots" #[name]="slotData">
            <slot :name="name" v-bind="slotData||{}"></slot>
        </template>
    </t-table>

</template>