<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

type Direction = 'horizontal' | 'vertical'

interface SceneSlide {
    id:string
    label:string
    kicker:string
    title:string
    desc:string
    tags:string[]
    metric:{ value:string, label:string }
    accent:string
    rgb:string
}

const props=withDefaults(defineProps<{
    /** 轮播方向，默认纵向 */
    direction?:Direction
    /** 自动播放间隔（毫秒） */
    interval?:number
}>(),{
    direction:'vertical',
    interval:5200
})

const slides:SceneSlide[]=[
    {
        id:'studio',
        label:'设计工作室',
        kicker:'DESIGN STUDIO',
        title:'把画布，铺满整间工作室',
        desc:'六块虚拟屏幕悬浮在桌前，手势一推即可换位。参考图、时间线与预览窗口同时在场，视线所及都是工作区。',
        tags:['6 屏并行','手势拖拽','色彩校准'],
        metric:{value:'6 屏',label:'并行工作区'},
        accent:'#22d3ee',
        rgb:'34, 211, 238'
    },
    {
        id:'collab',
        label:'远程协作',
        kicker:'REMOTE COLLAB',
        title:'远隔千里，共享同一张桌面',
        desc:'空间白板把每个人的笔迹锚定在同一个三维坐标里，语音与视线同步，讨论不再需要“你那边第几页”。',
        tags:['空间白板','全双工语音','端到端加密'],
        metric:{value:'8 ms',label:'协同延迟'},
        accent:'#7c5cff',
        rgb:'124, 92, 255'
    },
    {
        id:'field',
        label:'工业巡检',
        kicker:'FIELD SERVICE',
        title:'在设备前，看见隐藏的数据',
        desc:'扫描机身即可叠加管线与实时读数，双手保持自由。巡检记录自动回传，专家可以远程标注同一视角。',
        tags:['空间标注','远程指导','离线可用'],
        metric:{value:'±2 mm',label:'叠加精度'},
        accent:'#4ade80',
        rgb:'74, 222, 128'
    },
    {
        id:'cinema',
        label:'沉浸娱乐',
        kicker:'IMMERSIVE',
        title:'客厅，就是你的私人影院',
        desc:'一块 200 英寸的虚拟巨幕落在墙面，头部轻微移动就能看到景深变化。戴上它，房间的边界消失了。',
        tags:['200 英寸巨幕','空间音频','120 Hz'],
        metric:{value:'200″',label:'虚拟巨幕'},
        accent:'#ff4ecd',
        rgb:'255, 78, 205'
    }
]

const dir=ref<Direction>(props.direction)
const current=ref(0)
const paused=ref(false)
/** 切换方向时短暂关闭过渡，避免斜向飘移 */
const animated=ref(true)
/** 进度条重播用的计数 */
const tick=ref(0)
let timer:number|undefined

const stop=()=>{
    if(timer!==undefined){
        window.clearInterval(timer)
        timer=undefined
    }
}
const start=()=>{
    stop()
    // 悬停/聚焦暂停或用户偏好减少动效时不自动播放
    if(paused.value) return
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    timer=window.setInterval(()=>{
        current.value=(current.value+1)%slides.length
    },props.interval)
}
const go=(index:number)=>{
    current.value=(index+slides.length)%slides.length
    start()
}
const prev=()=>go(current.value-1)
const next=()=>go(current.value+1)

const setDirection=(value:Direction)=>{
    if(dir.value===value) return
    animated.value=false
    dir.value=value
    current.value=0
    requestAnimationFrame(()=>requestAnimationFrame(()=>{ animated.value=true }))
    start()
}

/** 每张幻灯片按与当前页的偏移量平移，偏移 ±100% 正好是一屏的距离 */
const slideStyle=(index:number)=>{
    const offset=index-current.value
    return {
        transform:dir.value==='vertical'
            ? `translate3d(0, ${offset*100}%, 0)`
            : `translate3d(${offset*100}%, 0, 0)`,
        zIndex:index===current.value?2:1
    }
}

const progressKey=computed(()=>`${current.value}-${dir.value}-${tick.value}`)
const progressStyle=computed(()=>({
    animationDuration:`${props.interval}ms`,
    animationPlayState:paused.value?'paused':'running'
}))

const onKeydown=(event:KeyboardEvent)=>{
    if(event.key==='ArrowUp'||event.key==='ArrowLeft'){
        event.preventDefault()
        prev()
    }else if(event.key==='ArrowDown'||event.key==='ArrowRight'){
        event.preventDefault()
        next()
    }
}

watch(paused,value=>{
    if(value) stop()
    else{
        tick.value++
        start()
    }
})

onMounted(start)
onBeforeUnmount(stop)
</script>

<template>
    <section id="scenes" class="scene-section" data-reveal="1">
        <div class="ax-container">
            <div class="scene-head">
                <div class="scene-title">
                    <p class="ax-eyebrow">SCENES</p>
                    <h2>把设备，带进<span class="gradient-text">真实的房间</span></h2>
                </div>

                <div class="scene-tools">
                    <div class="dir-switch" role="group" aria-label="轮播方向">
                        <button
                            type="button"
                            :class="{ 'is-active': dir === 'vertical' }"
                            :aria-pressed="dir === 'vertical'"
                            @click="setDirection('vertical')"
                        >
                            纵向
                        </button>
                        <button
                            type="button"
                            :class="{ 'is-active': dir === 'horizontal' }"
                            :aria-pressed="dir === 'horizontal'"
                            @click="setDirection('horizontal')"
                        >
                            横向
                        </button>
                    </div>

                    <div class="arrows">
                        <button type="button" class="arrow" aria-label="上一张" @click="prev">
                            <svg viewBox="0 0 16 16" :class="{ vertical: dir === 'vertical' }" aria-hidden="true">
                                <path d="M10 3 5 8l5 5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                        <button type="button" class="arrow" aria-label="下一张" @click="next">
                            <svg viewBox="0 0 16 16" class="next" :class="{ vertical: dir === 'vertical' }" aria-hidden="true">
                                <path d="M10 3 5 8l5 5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            <div
                class="carousel"
                :class="dir"
                role="region"
                aria-roledescription="carousel"
                aria-label="应用场景"
                tabindex="0"
                @mouseenter="paused = true"
                @mouseleave="paused = false"
                @focusin="paused = true"
                @focusout="paused = false"
                @keydown="onKeydown"
            >
                <div class="viewport" :class="{ 'no-anim': !animated }">
                    <article
                        v-for="(slide,index) in slides"
                        :key="slide.id"
                        class="slide"
                        :class="{ 'is-active': index === current }"
                        :style="slideStyle(index)"
                        :aria-hidden="index !== current"
                    >
                        <div
                            class="scene"
                            :style="{ '--accent': slide.accent, '--accent-rgb': slide.rgb }"
                        >
                            <div class="scene-grid"></div>
                            <div class="scene-orb"></div>
                            <svg class="scene-rings" viewBox="0 0 400 400" aria-hidden="true">
                                <circle cx="200" cy="200" r="150" fill="none" stroke="var(--accent)" stroke-width="1" stroke-dasharray="2 10" opacity=".5"/>
                                <circle cx="200" cy="200" r="112" fill="none" stroke="var(--accent)" stroke-width="1" opacity=".28"/>
                                <circle cx="200" cy="200" r="74" fill="none" stroke="var(--accent)" stroke-width="1" stroke-dasharray="30 160" stroke-linecap="round" opacity=".8"/>
                            </svg>
                            <span class="scene-index">0{{ index + 1 }}</span>

                            <div class="slide-copy">
                                <p class="slide-kicker">{{ slide.kicker }}</p>
                                <h3>{{ slide.title }}</h3>
                                <p class="slide-desc">{{ slide.desc }}</p>
                                <ul class="slide-tags">
                                    <li v-for="tag in slide.tags" :key="tag">{{ tag }}</li>
                                </ul>
                            </div>

                            <div class="slide-metric">
                                <strong>{{ slide.metric.value }}</strong>
                                <span>{{ slide.metric.label }}</span>
                            </div>
                        </div>
                    </article>

                    <div class="slide-mask"></div>
                </div>

                <div class="carousel-bar">
                    <span class="counter">
                        <b>0{{ current + 1 }}</b>
                        <i>/</i>
                        0{{ slides.length }}
                    </span>

                    <div class="dots">
                        <button
                            v-for="(slide,index) in slides"
                            :key="slide.id"
                            type="button"
                            class="dot"
                            :class="{ 'is-active': index === current }"
                            :aria-label="`第 ${index + 1} 张：${slide.label}`"
                            :aria-current="index === current"
                            @click="go(index)"
                        ></button>
                    </div>

                    <div class="progress">
                        <span :key="progressKey" :style="progressStyle"></span>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>

<style scoped>
.scene-section {
    padding: 0 0 112px;
}
.scene-head {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 32px;
    margin-bottom: 34px;
}
.scene-title h2 {
    margin-top: 18px;
    font-size: clamp(30px, 3.6vw, 46px);
    font-weight: 650;
    line-height: 1.16;
    letter-spacing: -.02em;
}
.scene-tools {
    display: flex;
    align-items: center;
    gap: 14px;
    flex-shrink: 0;
}
.dir-switch {
    display: flex;
    padding: 4px;
    border: 1px solid var(--ax-line);
    border-radius: 999px;
    background: rgba(255, 255, 255, .02);
}
.dir-switch button {
    padding: 7px 16px;
    border: 0;
    border-radius: 999px;
    background: transparent;
    color: var(--ax-muted);
    font-size: 13px;
    font-family: inherit;
    cursor: pointer;
    transition: color .2s ease, background .2s ease;
}
.dir-switch button:hover {
    color: var(--ax-text);
}
.dir-switch button.is-active {
    color: #04060c;
    background: linear-gradient(135deg, #e9efff, #b8caf5);
}
.arrows {
    display: flex;
    gap: 8px;
}
.arrow {
    display: grid;
    place-items: center;
    width: 38px;
    height: 38px;
    border: 1px solid var(--ax-line);
    border-radius: 50%;
    background: rgba(255, 255, 255, .02);
    color: var(--ax-text);
    cursor: pointer;
    transition: border-color .2s ease, background .2s ease, color .2s ease;
}
.arrow:hover {
    border-color: rgba(34, 211, 238, .55);
    background: rgba(34, 211, 238, .1);
    color: var(--ax-cyan);
}
.arrow svg {
    width: 16px;
    height: 16px;
    transition: transform .3s ease;
}
.arrow svg.next {
    transform: rotate(180deg);
}
.arrow svg.vertical {
    transform: rotate(90deg);
}
.arrow svg.next.vertical {
    transform: rotate(270deg);
}

.carousel {
    outline: none;
    border-radius: 26px;
}
.carousel:focus-visible {
    outline: 2px solid rgba(34, 211, 238, .5);
    outline-offset: 4px;
}
.viewport {
    position: relative;
    height: clamp(560px, 76vh, 760px);
    overflow: hidden;
    border: 1px solid var(--ax-line);
    border-radius: 26px;
    background: #05080f;
    box-shadow: 0 40px 120px rgba(2, 6, 18, .6);
}
.slide {
    position: absolute;
    inset: 0;
    transition: transform .9s cubic-bezier(.76, 0, .24, 1);
    will-change: transform;
}
.no-anim .slide {
    transition: none;
}
.scene {
    position: relative;
    display: flex;
    align-items: flex-end;
    width: 100%;
    height: 100%;
    padding: clamp(26px, 4vw, 54px);
    overflow: hidden;
    background:
        radial-gradient(760px 520px at 82% 12%, rgba(var(--accent-rgb), .28), transparent 62%),
        radial-gradient(620px 480px at 8% 92%, rgba(var(--accent-rgb), .12), transparent 66%),
        linear-gradient(160deg, #0a1020 0%, #05080f 62%);
}
.scene-grid {
    position: absolute;
    inset: -20%;
    background-image:
        linear-gradient(rgba(140, 170, 255, .09) 1px, transparent 1px),
        linear-gradient(90deg, rgba(140, 170, 255, .09) 1px, transparent 1px);
    background-size: 56px 56px;
    transform: perspective(760px) rotateX(52deg) translateY(12%);
    mask-image: radial-gradient(58% 52% at 50% 52%, #000 0%, transparent 78%);
    -webkit-mask-image: radial-gradient(58% 52% at 50% 52%, #000 0%, transparent 78%);
    opacity: .9;
}
.scene-orb {
    position: absolute;
    top: -14%;
    right: -8%;
    width: 52%;
    aspect-ratio: 1;
    border-radius: 50%;
    background: radial-gradient(circle at 35% 35%, rgba(var(--accent-rgb), .55), rgba(var(--accent-rgb), .08) 58%, transparent 72%);
    filter: blur(18px);
    animation: orb-drift 12s ease-in-out infinite;
}
.scene-rings {
    position: absolute;
    top: 50%;
    right: -6%;
    width: min(46%, 460px);
    transform: translateY(-50%);
    opacity: .85;
    animation: rings-spin 44s linear infinite;
}
.scene-index {
    position: absolute;
    top: clamp(12px, 2.4vw, 30px);
    right: clamp(20px, 3vw, 44px);
    font-size: clamp(96px, 15vw, 190px);
    font-weight: 700;
    line-height: 1;
    letter-spacing: -.04em;
    color: transparent;
    -webkit-text-stroke: 1px rgba(var(--accent-rgb), .3);
    pointer-events: none;
}
.slide-copy {
    position: relative;
    z-index: 2;
    max-width: 640px;
}
.slide-kicker {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    color: var(--accent);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: .2em;
}
.slide-kicker::before {
    content: '';
    width: 26px;
    height: 1px;
    background: currentColor;
}
.slide-copy h3 {
    margin: 18px 0 0;
    font-size: clamp(28px, 3.8vw, 52px);
    font-weight: 650;
    line-height: 1.12;
    letter-spacing: -.02em;
}
.slide-desc {
    max-width: 520px;
    margin: 18px 0 0;
    color: var(--ax-muted);
    font-size: 15px;
    line-height: 1.75;
}
.slide-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin: 26px 0 0;
    padding: 0;
    list-style: none;
}
.slide-tags li {
    padding: 7px 14px;
    border: 1px solid rgba(var(--accent-rgb), .28);
    border-radius: 999px;
    background: rgba(var(--accent-rgb), .08);
    color: #dce6ff;
    font-size: 12px;
    letter-spacing: .06em;
}
.slide-metric {
    position: absolute;
    right: clamp(26px, 4vw, 54px);
    bottom: clamp(26px, 4vw, 54px);
    z-index: 2;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
    text-align: right;
}
.slide-metric strong {
    font-size: clamp(26px, 3vw, 40px);
    font-weight: 700;
    line-height: 1;
    letter-spacing: -.02em;
    color: var(--accent);
}
.slide-metric span {
    color: var(--ax-muted);
    font-size: 12px;
    letter-spacing: .16em;
}
.slide-mask {
    position: absolute;
    inset: 0;
    z-index: 3;
    pointer-events: none;
    background: linear-gradient(180deg, rgba(4, 6, 12, .18), transparent 24%, transparent 68%, rgba(4, 6, 12, .58));
}

.carousel-bar {
    display: flex;
    align-items: center;
    gap: 24px;
    margin-top: 20px;
    padding: 0 6px;
}
.counter {
    color: var(--ax-muted);
    font-size: 12px;
    letter-spacing: .16em;
    font-variant-numeric: tabular-nums;
}
.counter b {
    color: var(--ax-text);
    font-weight: 600;
}
.counter i {
    margin: 0 6px;
    font-style: normal;
    opacity: .5;
}
.dots {
    display: flex;
    align-items: center;
    gap: 10px;
}
.dot {
    width: 26px;
    height: 3px;
    padding: 0;
    border: 0;
    border-radius: 99px;
    background: rgba(140, 170, 255, .22);
    cursor: pointer;
    transition: width .3s ease, background .3s ease;
}
.dot:hover {
    background: rgba(140, 170, 255, .48);
}
.dot.is-active {
    width: 46px;
    background: var(--ax-cyan);
}
.progress {
    position: relative;
    flex: 1;
    height: 2px;
    overflow: hidden;
    border-radius: 99px;
    background: rgba(140, 170, 255, .12);
}
.progress span {
    position: absolute;
    inset: 0;
    transform-origin: left center;
    background: linear-gradient(90deg, var(--ax-cyan), var(--ax-violet));
    animation: progress-run linear forwards;
}
/* 纵向模式下进度改为从上往下走，呼应播放方向 */
.carousel.vertical .progress span {
    transform-origin: center top;
    animation-name: progress-drop;
}

@keyframes progress-run {
    from { transform: scaleX(0); }
    to { transform: scaleX(1); }
}
@keyframes progress-drop {
    from { transform: scaleY(0); }
    to { transform: scaleY(1); }
}
@keyframes rings-spin {
    to { transform: translateY(-50%) rotate(360deg); }
}
@keyframes orb-drift {
    0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
    50% { transform: translate3d(-4%, 5%, 0) scale(1.08); }
}

@media (max-width: 980px) {
    .scene-head {
        flex-direction: column;
        align-items: flex-start;
        gap: 22px;
    }
    .scene-tools {
        width: 100%;
        justify-content: space-between;
    }
    .viewport {
        height: clamp(480px, 68vh, 620px);
        border-radius: 22px;
    }
    .slide-metric {
        display: none;
    }
}
@media (max-width: 640px) {
    .scene-section {
        padding-bottom: 84px;
    }
    .viewport {
        height: 500px;
    }
    .scene-index {
        font-size: 88px;
        opacity: .7;
    }
    .scene-rings {
        width: 78%;
        right: -24%;
        opacity: .45;
    }
    .slide-desc {
        font-size: 14px;
    }
    .carousel-bar {
        gap: 16px;
    }
    .dots {
        gap: 6px;
    }
    .dot {
        width: 18px;
    }
    .dot.is-active {
        width: 30px;
    }
}

@media (prefers-reduced-motion: reduce) {
    .slide {
        transition: none;
    }
    .scene-orb,
    .scene-rings,
    .progress span {
        animation: none;
    }
}
</style>
