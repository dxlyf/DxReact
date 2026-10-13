<script setup lang="ts">
// ============================================================================
// CollapseCard：通用收起展开卡片容器
// 收起/展开状态由父组件持有（属于内部 UI state，不进入 value）
// ============================================================================
interface Props {
  /** 卡片标题 */
  title: string;
  /** 是否收起 */
  collapsed: boolean;
}
const props = defineProps<Props>();
const emit = defineEmits<{ (e: 'update:collapsed', value: boolean): void }>();

function toggle() {
  emit('update:collapsed', !props.collapsed);
}
</script>

<template>
  <div class="border border-solid border-gray-200 rounded-md overflow-hidden bg-white">
    <!-- 头部：点击切换收起/展开；extra 区域阻止冒泡避免误触 -->
    <div
      class="flex items-center cursor-pointer select-none px-3 py-2 bg-gray-50 hover:bg-gray-100"
      @click="toggle"
    >
      <t-icon
        name="chevron-down"
        class="mr-1 shrink-0 transition-transform duration-200"
        :class="collapsed ? '-rotate-90' : 'rotate-0'"
      />
      <span class="font-medium text-sm text-gray-800">{{ title }}</span>
      <div class="flex-1"></div>
      <!-- 右侧操作区：阻止冒泡，点击不会收起卡片 -->
      <div class="flex items-center gap-2" @click.stop>
        <slot name="extra" />
      </div>
    </div>

    <!-- 内容区：grid 技巧实现高度过渡动画（200ms） -->
    <div
      class="grid transition-all duration-200 ease-in-out"
      :style="{ gridTemplateRows: collapsed ? '0fr' : '1fr' }"
    >
      <div class="overflow-hidden">
        <div class="p-3">
          <slot />
        </div>
      </div>
    </div>
  </div>
</template>
