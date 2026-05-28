<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';

const props = withDefaults(defineProps<{
    items: ({ text: string } & Record<string, any>)[]
    textKey?: string
    max?: number
    maxLines?: number
    lineThreshold?: number
    theme?: 'default' | 'primary' | 'warning' | 'danger' | 'success'
}>(), {
    theme:'primary',
    maxLines: 2,
    lineThreshold: 5,
    textKey: 'text'
})

const emit = defineEmits<{
    'item-click': [payload: { item: any; index: number; event: MouseEvent }]
}>()

const expanded = ref(false)
const containerRef = ref<HTMLElement>()
const lineCutoff = ref<number | null>(null)

let resizeObserver: ResizeObserver | null = null
let rafId: number | null = null

const toggleExpand = () => {
    expanded.value = !expanded.value
}

const textItems = computed(() => props.items.map(item => typeof item === 'string' ? item : item[props.textKey]))

const isMaxMode = computed(() => props.max !== undefined)

const visibleItems = computed(() => {
    if (expanded.value) return props.items
    if (isMaxMode.value) return props.items.slice(0, props.max)
    if (lineCutoff.value !== null) return props.items.slice(0, lineCutoff.value)
    return props.items
})

const visibleTextItems = computed(() => {
    if (expanded.value) return textItems.value
    if (isMaxMode.value) return textItems.value.slice(0, props.max)
    if (lineCutoff.value !== null) return textItems.value.slice(0, lineCutoff.value)
    return textItems.value
})

const hasMore = computed(() => {
    return visibleItems.value.length < props.items.length
})

function handleItemClick(item: any, index: number, event: MouseEvent) {
    emit('item-click', { item, index, event })
}

const calcLineCutoff = () => {
    const el = containerRef.value
    if (!el) return
    const children = Array.from(el.children) as HTMLElement[]
    const lines = props.maxLines ?? 2
    let currentLine = 0
    let lastTop = -1
    let newCutoff = children.length
    for (let i = 0; i < children.length; i++) {
        const top = children[i].offsetTop
        if (Math.abs(top - lastTop) > props.lineThreshold) {
            currentLine++
            lastTop = top
        }
        if (currentLine > lines) {
            newCutoff = i
            break
        }
    }
    if (newCutoff !== lineCutoff.value) {
        lineCutoff.value = newCutoff
    }
}

const scheduleRecalc = () => {
    if (rafId !== null) return
    rafId = requestAnimationFrame(() => {
        rafId = null
        calcLineCutoff()
    })
}

onMounted(() => {
    if (!isMaxMode.value) {
        nextTick(() => {
            calcLineCutoff()
            resizeObserver = new ResizeObserver(scheduleRecalc)
            if (containerRef.value) {
                resizeObserver.observe(containerRef.value)
            }
        })
    }
})

onUnmounted(() => {
    if (resizeObserver) {
        resizeObserver.disconnect()
    }
    if (rafId !== null) {
        cancelAnimationFrame(rafId)
    }
})
</script>

<template>
    <div class="tag-wrapper">
        <div ref="containerRef" class="tag-container">
            <template v-for="(item, i) in visibleItems" :key="i">
                <slot name="item" :item="item" :index="i" :text="visibleTextItems[i]">
                    <t-tag
                        variant="light" :theme="theme ?? 'default'" size="small"
                        @click="handleItemClick(item, i, $event)"
                        style="cursor: pointer"
                    >
                        {{ visibleTextItems[i] }}
                    </t-tag>
                </slot>
            </template>
            <div v-if="!expanded && hasMore" class="tag-actions" @click.stop="toggleExpand">
                <t-tag theme="primary" variant="light" size="small" style="cursor: pointer">+{{ items.length - visibleItems.length }}</t-tag>
                <t-link theme="primary" size="small">展开</t-link>
            </div>
            <div v-else-if="expanded" class="tag-actions" @click="toggleExpand">
                <t-link theme="primary" size="small">收起</t-link>
            </div>
            <slot name="after" />
        </div>
    </div>
</template>

<style scoped>
.tag-container {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
}

.tag-actions {
    display: inline-flex;
    align-items: center;
    gap: 4px;
}
</style>
