<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

const props=withDefaults(defineProps<{
    /** 目标数值 */
    value:number
    /** 小数位数 */
    decimals?:number
    /** 数值后缀，如 TOPS、ms */
    suffix?:string
    /** 动画时长（ms） */
    duration?:number
}>(),{decimals:0,suffix:'',duration:1600})

const rootRef=ref<HTMLElement>()
const display=ref((0).toFixed(props.decimals))

let observer:IntersectionObserver|undefined
let raf=0

function play(){
    const start=performance.now()
    const tick=(now:number)=>{
        const progress=Math.min(1,(now-start)/props.duration)
        // easeOutExpo，结尾更自然
        const eased=progress===1?1:1-Math.pow(2,-10*progress)
        display.value=(props.value*eased).toFixed(props.decimals)
        if(progress<1){
            raf=requestAnimationFrame(tick)
        }
    }
    raf=requestAnimationFrame(tick)
}

onMounted(()=>{
    if(!rootRef.value){
        return
    }
    observer=new IntersectionObserver(entries=>{
        if(entries.some(entry=>entry.isIntersecting)){
            observer?.disconnect()
            play()
        }
    },{threshold:0.4})
    observer.observe(rootRef.value)
})

onUnmounted(()=>{
    observer?.disconnect()
    cancelAnimationFrame(raf)
})
</script>

<template>
    <span ref="rootRef" class="count-up">{{ display }}{{ suffix }}</span>
</template>

<style scoped>
.count-up {
    font-variant-numeric: tabular-nums;
}
</style>
