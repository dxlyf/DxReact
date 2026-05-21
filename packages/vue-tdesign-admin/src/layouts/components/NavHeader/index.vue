<script setup lang="ts">
import { computed, h } from 'vue'
import { useI18n } from 'vue-i18n'
import type { DropdownOption } from 'tdesign-vue-next'
import { DiscountIcon } from 'tdesign-icons-vue-next'

export interface SystemOption {
  value: string
  label: string
}

defineOptions({
  name: 'NavHeader'
})

const props = withDefaults(defineProps<{
  systemName?: string
  systemOptions?: SystemOption[]
  avatar?: string
  username?: string
}>(), {
  systemName: '后台管理',
  systemOptions: () => [],
  avatar: 'https://tdesign.gtimg.com/site/avatar.jpg',
  username: 'admin'
})

const emit = defineEmits<{
  'system-change': [val: string]
  'locale-change': [val: string]
  setting: []
  logout: []
}>()

const { locale } = useI18n()

const localeOpts: DropdownOption[] = [
  { value: 'zh-CN', content: '中文', active: locale.value === 'zh-CN' },
  { value: 'en', content: 'English', active: locale.value === 'en' }
]

const userOpts: DropdownOption[] = [
  { content: '个人设置', value: 'setting', prefixIcon: () => h(DiscountIcon), divider: true },
  { content: '退出登录', value: 'logout', prefixIcon: () => h(DiscountIcon) }
]

function onLocaleClick(opt: DropdownOption) {
  const val = String(opt.value)
  locale.value = val as 'zh-CN' | 'en'
  localStorage.setItem('lang', val)
  document.documentElement.lang = val
  emit('locale-change', val)
}

function onUserClick(opt: DropdownOption) {
  if (opt.value === 'setting') emit('setting')
  if (opt.value === 'logout') emit('logout')
}

function onSystemClick(opt: DropdownOption) {
  emit('system-change', String(opt.value))
}
</script>

<template>
  <div class="navbar">
    <div class="navbar-left">
      <slot name="logo">
        <span class="navbar-brand">
          <t-icon name="logo" class="navbar-brand-icon" />
          <span class="navbar-brand-text"></span>
        </span>
      </slot>

      <t-dropdown
        v-if="systemOptions.length"
        trigger="click"
        :options="systemOptions.map(s => ({ value: s.value, content: s.label }))"
        @click="onSystemClick"
      >
        <button class="navbar-switch">
          <t-icon name="app" />
          <t-icon name="chevron-down" size="14" />
        </button>
      </t-dropdown>

      <slot name="left" />
    </div>

    <div class="navbar-right">
      <slot name="right" />

      <t-dropdown trigger="click" :options="localeOpts" @click="onLocaleClick">
        <button class="navbar-btn">
          <t-icon name="translate" />
        </button>
      </t-dropdown>

      <t-dropdown placement="bottom-right" :options="userOpts" trigger="hover" @click="onUserClick">
        <div class="navbar-user">
          <t-avatar shape="circle" :image="avatar" size="32" />
          <span class="navbar-user-name">{{ username }}</span>
          <t-icon name="chevron-down" size="14" />
        </div>
      </t-dropdown>
    </div>
  </div>
</template>

<style scoped>
.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  padding: 0 20px;
  background: #fff;
  border-bottom: 1px solid #ebedf0;
}

.navbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.navbar-brand {
  display: flex;
  align-items: center;
  gap: 8px;
}

.navbar-brand-icon {
  font-size: 22px;
  color: var(--td-brand-color, #3355ff);
}

.navbar-brand-text {
  font-size: 15px;
  font-weight: 600;
  color: #1d2129;
  white-space: nowrap;
}

.navbar-switch {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 4px 8px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 4px;
  color: #86909c;
  font-size: 16px;
  transition: background 0.2s, color 0.2s;
}

.navbar-switch:hover {
  background: #f2f3f5;
  color: var(--td-brand-color, #3355ff);
}

.navbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.navbar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 6px;
  color: #86909c;
  font-size: 18px;
  transition: background 0.2s, color 0.2s;
}

.navbar-btn:hover {
  background: #f2f3f5;
  color: var(--td-brand-color, #3355ff);
}

.navbar-user {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
}

.navbar-user:hover {
  background: #f2f3f5;
}

.navbar-user-name {
  font-size: 14px;
  color: #1d2129;
}
</style>
