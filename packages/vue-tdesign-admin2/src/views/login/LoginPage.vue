<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import { useTenantStore } from '@/store/tenant'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const tenantStore = useTenantStore()

const form = ref({
  username: '',
  password: '',
  tenantId: '',
})

const loading = ref(false)
const showTenantSelect = ref(false)

async function handleLogin() {
  loading.value = true
  try {
    await authStore.login({
      username: form.value.username,
      password: form.value.password,
      tenantId: form.value.tenantId,
    })

    if (authStore.user?.tenants?.length === 1) {
      const tenant = authStore.user.tenants[0]
      tenantStore.setCurrentTenant(tenant)
      await tenantStore.fetchTenantConfig(tenant.id)
    }

    const redirect = (route.query.redirect as string) || '/dashboard'
    router.push(redirect)
  } catch (error: any) {
    console.error(error)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-container">
    <t-card class="login-card" :bordered="false">
      <div class="login-header">
        <img :src="tenantStore.tenantLogo || '/favicon.svg'" alt="logo" class="logo" />
        <h2>{{ tenantStore.tenantName || '管理后台' }}</h2>
      </div>

      <t-form :data="form" @submit="handleLogin">
        <t-form-item label="用户名" name="username">
          <t-input v-model="form.username" placeholder="请输入用户名" clearable>
            <template #prefix-icon>
              <t-icon name="user" />
            </template>
          </t-input>
        </t-form-item>

        <t-form-item label="密码" name="password">
          <t-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            clearable
          >
            <template #prefix-icon>
              <t-icon name="lock-on" />
            </template>
          </t-input>
        </t-form-item>

        <t-form-item v-if="showTenantSelect" label="租户" name="tenantId">
          <t-select v-model="form.tenantId" placeholder="请选择租户">
            <t-option
              v-for="t in authStore.user?.tenants"
              :key="t.id"
              :value="t.id"
              :label="t.name"
            />
          </t-select>
        </t-form-item>

        <t-form-item>
          <t-button type="submit" block size="large" :loading="loading">
            登 录
          </t-button>
        </t-form-item>
      </t-form>
    </t-card>
  </div>
</template>

<style scoped lang="scss">
.login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: var(--td-bg-color-page);
}
.login-card {
  width: 420px;
  padding: 32px;
}
.login-header {
  text-align: center;
  margin-bottom: 32px;
}
.logo {
  width: 64px;
  height: 64px;
  margin-bottom: 16px;
}
h2 {
  margin: 0;
  font-size: 24px;
  color: var(--td-text-color-primary);
}
</style>