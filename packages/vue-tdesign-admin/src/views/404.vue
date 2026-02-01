<template>
  <result title="404 Not Found" :tip="$t('pages.result.404.subtitle')" type="404">
    <t-button @click="() => $router.push('/')">{{ $t('pages.result.404.back') }}</t-button>
  </result>
</template>
<script setup lang="ts">
import Result from 'src/components/result/index.vue';
defineOptions({
  name: 'Result404',
});
</script>