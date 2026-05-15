<script setup lang="ts">
import { useRoute } from 'vue-router';
import Form from './form.vue';

const route = useRoute()
</script>

<template>
    <Form type="edit" :id="route.query.id as string" />
</template>
