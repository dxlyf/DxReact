<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useTenantStore } from '@/store/tenant'

const tenantStore = useTenantStore()

const form = ref({
  name: '',
  logo: '',
  primaryColor: '#0052D9',
})

onMounted(() => {
  if (tenantStore.currentTenant) {
    form.value.name = tenantStore.currentTenant.name
    form.value.logo = tenantStore.currentTenant.logo || ''
    form.value.primaryColor = tenantStore.config?.theme?.primaryColor || '#0052D9'
  }
})

async function handleSave() {
  console.log('保存设置', form.value)
}
</script>

<template>
  <div class="tenant-settings-page">
    <t-card title="租户设置">
      <t-form :data="form" @submit="handleSave">
        <t-form-item label="租户名称" name="name">
          <t-input v-model="form.name" placeholder="请输入租户名称" />
        </t-form-item>

        <t-form-item label="Logo" name="logo">
          <t-input v-model="form.logo" placeholder="请输入Logo URL" />
        </t-form-item>

        <t-form-item label="主题色" name="primaryColor">
          <t-color-picker v-model="form.primaryColor" />
        </t-form-item>

        <t-form-item>
          <t-button type="submit" theme="primary">保存设置</t-button>
        </t-form-item>
      </t-form>
    </t-card>
  </div>
</template>
