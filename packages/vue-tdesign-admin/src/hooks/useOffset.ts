import { onMounted, onBeforeUnmount, shallowRef, type ShallowRef } from 'vue'
export const useOffset = (element?: ShallowRef<HTMLElement>) => {
    const curElement = element ?? shallowRef<HTMLElement>(null)
    let observer: ResizeObserver | null = null
    const update = () => {
        if (!curElement.value) {
            return 0
        }
        const rect = curElement.value.getBoundingClientRect()
        return rect.height
    }
    const setupResize = () => {
        if (!curElement.value) {
            return 0
        }
        if (observer) {
            observer.disconnect()
            observer = null
        }
        observer = new ResizeObserver((entries) => {
            entries.forEach(entry => {
                // entry.target - 被观察的 DOM 元素
                console.log(entry.target);

                // entry.contentRect - 元素内容区域尺寸（旧版 API）
                // 包含：width, height, top, right, bottom, left, x, y
                console.log(entry.contentRect.width);
                console.log(entry.contentRect.height);

                // entry.borderBoxSize - 边框盒尺寸（推荐，包含边框和内边距）
                console.log(entry.borderBoxSize[0].inlineSize); // 宽度
                console.log(entry.borderBoxSize[0].blockSize);  // 高度

                // entry.contentBoxSize - 内容盒尺寸（不包含边框和内边距）
                console.log(entry.contentBoxSize[0].inlineSize);
                console.log(entry.contentBoxSize[0].blockSize);

                // entry.devicePixelContentBoxSize - 设备像素级尺寸（高精度）
                console.log(entry.devicePixelContentBoxSize);
            });
            update()
        })
        observer.observe(curElement.value, { box: 'border-box' })
    }
    onMounted(() => {

    })
    onBeforeUnmount(() => {
        observer?.disconnect()
    })
    return [curElement] as const
}