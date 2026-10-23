<script setup lang="ts">
import { onMounted, onUnmounted, shallowRef } from 'vue'
import CountUp from './CountUp.vue'

const canvasRef=shallowRef<HTMLCanvasElement>()

interface Dot {
    x:number
    y:number
    vx:number
    vy:number
}

let raf=0
let resizeObserver:ResizeObserver|undefined

/** 首屏背景：漂浮粒子 + 邻近连线，形成数据星图的效果 */
function startCanvas(){
    const canvas=canvasRef.value
    const ctx=canvas?.getContext('2d')
    if(!canvas||!ctx){
        return
    }

    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let width=0
    let height=0
    let dots:Dot[]=[]

    const resize=()=>{
        const rect=canvas.getBoundingClientRect()
        const dpr=Math.min(window.devicePixelRatio||1,2)
        width=rect.width
        height=rect.height
        canvas.width=Math.max(1,Math.round(width*dpr))
        canvas.height=Math.max(1,Math.round(height*dpr))
        ctx.setTransform(dpr,0,0,dpr,0,0)
        const count=Math.min(86,Math.max(36,Math.round(width*height/20000)))
        dots=Array.from({length:count},()=>({
            x:Math.random()*width,
            y:Math.random()*height,
            vx:(Math.random()-.5)*.24,
            vy:(Math.random()-.5)*.24
        }))
    }

    const linkDistance=140

    const draw=(animate:boolean)=>{
        ctx.clearRect(0,0,width,height)
        for(const dot of dots){
            if(animate){
                dot.x+=dot.vx
                dot.y+=dot.vy
                if(dot.x<0||dot.x>width){
                    dot.vx*=-1
                }
                if(dot.y<0||dot.y>height){
                    dot.vy*=-1
                }
            }
        }
        // 邻近粒子连线
        for(let i=0;i<dots.length;i++){
            const a=dots[i]
            for(let j=i+1;j<dots.length;j++){
                const b=dots[j]
                const dx=a.x-b.x
                const dy=a.y-b.y
                const distance=Math.hypot(dx,dy)
                if(distance>linkDistance){
                    continue
                }
                ctx.strokeStyle=`rgba(110,170,255,${(1-distance/linkDistance)*.22})`
                ctx.lineWidth=1
                ctx.beginPath()
                ctx.moveTo(a.x,a.y)
                ctx.lineTo(b.x,b.y)
                ctx.stroke()
            }
        }
        // 粒子本体
        for(let i=0;i<dots.length;i++){
            const dot=dots[i]
            ctx.fillStyle=i%3===0?'rgba(34,211,238,.85)':'rgba(150,175,255,.55)'
            ctx.beginPath()
            ctx.arc(dot.x,dot.y,i%3===0?1.7:1.1,0,Math.PI*2)
            ctx.fill()
        }
        if(animate){
            raf=requestAnimationFrame(()=>draw(true))
        }
    }

    resize()
    draw(!reduced)
    resizeObserver=new ResizeObserver(()=>{
        resize()
        if(reduced){
            draw(false)
        }
    })
    resizeObserver.observe(canvas)
}

onMounted(startCanvas)

onUnmounted(()=>{
    cancelAnimationFrame(raf)
    resizeObserver?.disconnect()
})
</script>

<template>
    <section id="top" class="hero">
        <canvas ref="canvasRef" class="hero-canvas" aria-hidden="true"></canvas>
        <div class="hero-aurora" aria-hidden="true"></div>

        <div class="ax-container hero-inner">
            <div class="hero-copy">
                <p class="eyebrow" data-reveal="0">
                    <span class="dot"></span>
                    NEXT-GEN SPATIAL COMPUTING
                </p>
                <h1 data-reveal="1">
                    把数字世界<br/>
                    <span class="gradient-text">叠加</span>到现实
                </h1>
                <p class="lead" data-reveal="2">
                    AXION ONE 是首款面向创作者的空间计算终端。12 TOPS 端侧算力、8ms 全息延迟，
                    让三维交互像呼吸一样自然。
                </p>
                <div class="hero-actions" data-reveal="3">
                    <a class="btn btn-primary" href="#reserve">
                        预约体验
                        <svg viewBox="0 0 16 16" aria-hidden="true">
                            <path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </a>
                    <a class="btn btn-ghost" href="#product">
                        <span class="play-dot"></span>
                        观看演示
                    </a>
                </div>

                <dl class="hero-stats" data-reveal="4">
                    <div>
                        <dt><CountUp :value="12" suffix=" TOPS"/></dt>
                        <dd>端侧算力</dd>
                    </div>
                    <div>
                        <dt><CountUp :value="8" suffix=" ms"/></dt>
                        <dd>全息延迟</dd>
                    </div>
                    <div>
                        <dt><CountUp :value="210" suffix=" g"/></dt>
                        <dd>整机重量</dd>
                    </div>
                    <div>
                        <dt><CountUp :value="6" suffix=" DoF"/></dt>
                        <dd>空间追踪</dd>
                    </div>
                </dl>
            </div>

            <div class="hero-visual" aria-hidden="true">
                <div class="core-glow"></div>

                <svg class="ring ring-a" viewBox="0 0 400 400">
                    <defs>
                        <linearGradient id="heroRingA" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0" stop-color="#22d3ee" stop-opacity=".95"/>
                            <stop offset="1" stop-color="#7c5cff" stop-opacity=".2"/>
                        </linearGradient>
                    </defs>
                    <circle cx="200" cy="200" r="178" fill="none" stroke="url(#heroRingA)" stroke-width="1.2" stroke-dasharray="2 9"/>
                    <circle cx="200" cy="22" r="3" fill="#22d3ee"/>
                </svg>

                <svg class="ring ring-b" viewBox="0 0 400 400">
                    <defs>
                        <linearGradient id="heroRingB" x1="1" y1="0" x2="0" y2="1">
                            <stop offset="0" stop-color="#ff4ecd" stop-opacity=".8"/>
                            <stop offset="1" stop-color="#7c5cff" stop-opacity=".1"/>
                        </linearGradient>
                    </defs>
                    <circle cx="200" cy="200" r="142" fill="none" stroke="url(#heroRingB)" stroke-width="1.6" stroke-dasharray="150 260" stroke-linecap="round"/>
                </svg>

                <svg class="ring ring-c" viewBox="0 0 400 400">
                    <circle cx="200" cy="200" r="106" fill="none" stroke="rgba(160,190,255,.22)" stroke-width="1"/>
                    <circle cx="200" cy="94" r="2.5" fill="#a9c2ff"/>
                </svg>

                <svg class="core" viewBox="0 0 400 400">
                    <defs>
                        <linearGradient id="heroCore" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0" stop-color="#22d3ee" stop-opacity=".9"/>
                            <stop offset="1" stop-color="#7c5cff" stop-opacity=".9"/>
                        </linearGradient>
                        <filter id="heroCoreBlur" x="-60%" y="-60%" width="220%" height="220%">
                            <feGaussianBlur stdDeviation="12"/>
                        </filter>
                    </defs>
                    <polygon points="200,142 250,171 250,229 200,258 150,229 150,171" fill="url(#heroCore)" opacity=".35" filter="url(#heroCoreBlur)"/>
                    <polygon points="200,142 250,171 250,229 200,258 150,229 150,171" fill="none" stroke="url(#heroCore)" stroke-width="1.6"/>
                    <polygon points="200,170 228,186 228,218 200,234 172,218 172,186" fill="none" stroke="rgba(210,230,255,.5)" stroke-width="1"/>
                    <circle cx="200" cy="200" r="4" fill="#e6f4ff"/>
                </svg>

                <div class="chip chip-1">
                    <span class="chip-value">12 TOPS</span>
                    <span class="chip-label">NPU 算力</span>
                </div>
                <div class="chip chip-2">
                    <span class="chip-value">8 ms</span>
                    <span class="chip-label">端到端延迟</span>
                </div>
                <div class="chip chip-3">
                    <span class="chip-value">6 DoF</span>
                    <span class="chip-label">空间追踪</span>
                </div>
            </div>
        </div>

        <div class="scroll-hint" aria-hidden="true">
            <span class="scroll-line"></span>
            SCROLL
        </div>
    </section>
</template>

<style scoped>
.hero {
    position: relative;
    overflow: hidden;
    min-height: 100vh;
    padding: 150px 0 96px;
    display: flex;
    align-items: center;
}
.hero-canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    opacity: .85;
}
.hero-aurora {
    position: absolute;
    width: 900px;
    height: 900px;
    top: -420px;
    right: -220px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(124,92,255,.28), rgba(34,211,238,.12) 42%, transparent 68%);
    filter: blur(30px);
    pointer-events: none;
}
.hero-inner {
    position: relative;
    display: grid;
    grid-template-columns: 1.08fr .92fr;
    align-items: center;
    gap: 40px;
}
.eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    margin: 0 0 26px;
    padding: 7px 14px;
    border: 1px solid rgba(140,170,255,.2);
    border-radius: 999px;
    background: rgba(120,150,255,.06);
    color: #9fb3d9;
    font-size: 11px;
    letter-spacing: .22em;
}
.eyebrow .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--ax-cyan);
    box-shadow: 0 0 10px var(--ax-cyan);
}
.hero h1 {
    margin: 0;
    font-size: clamp(44px, 6vw, 82px);
    line-height: 1.06;
    font-weight: 700;
    letter-spacing: -.02em;
}
.gradient-text {
    background: linear-gradient(100deg, #22d3ee 8%, #7c5cff 48%, #ff4ecd 92%);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
}
.lead {
    max-width: 520px;
    margin: 26px 0 0;
    color: var(--ax-muted);
    font-size: 16px;
    line-height: 1.9;
}
.hero-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 14px;
    margin-top: 36px;
}
.play-dot {
    width: 0;
    height: 0;
    border-style: solid;
    border-width: 5px 0 5px 8px;
    border-color: transparent transparent transparent currentColor;
}
.hero-stats {
    display: flex;
    flex-wrap: wrap;
    gap: 40px;
    margin: 56px 0 0;
    padding-top: 28px;
    border-top: 1px solid rgba(140,170,255,.14);
}
.hero-stats div {
    min-width: 96px;
}
.hero-stats dt {
    font-size: 24px;
    font-weight: 650;
    letter-spacing: .01em;
    background: linear-gradient(180deg, #ffffff, #9db4e6);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
}
.hero-stats dd {
    margin: 6px 0 0;
    color: var(--ax-muted);
    font-size: 12px;
    letter-spacing: .12em;
}

/* 右侧全息内核 */
.hero-visual {
    position: relative;
    display: grid;
    place-items: center;
    min-height: 540px;
}
.core-glow {
    position: absolute;
    width: 460px;
    height: 460px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(124,92,255,.42), rgba(34,211,238,.14) 45%, transparent 70%);
    filter: blur(24px);
    animation: core-breathe 7s ease-in-out infinite;
}
.ring,
.core {
    position: absolute;
    width: min(470px, 100%);
    aspect-ratio: 1;
}
.ring-a {
    animation: spin 46s linear infinite;
}
.ring-b {
    animation: spin 26s linear infinite reverse;
}
.ring-c {
    animation: spin 18s linear infinite;
}
.core {
    width: min(380px, 82%);
    animation: core-float 7s ease-in-out infinite;
}
.chip {
    position: absolute;
    display: flex;
    flex-direction: column;
    gap: 3px;
    padding: 12px 16px;
    border: 1px solid rgba(140,170,255,.18);
    border-radius: 12px;
    background: rgba(10,16,30,.6);
    backdrop-filter: blur(12px);
    box-shadow: 0 16px 40px rgba(0,0,0,.35);
    animation: chip-float 8s ease-in-out infinite;
}
.chip-value {
    font-size: 15px;
    font-weight: 650;
    color: #eaf2ff;
}
.chip-label {
    font-size: 10px;
    letter-spacing: .18em;
    color: var(--ax-muted);
}
.chip-1 {
    top: 12%;
    left: 0;
}
.chip-2 {
    top: 38%;
    right: -2%;
    animation-delay: -2.4s;
}
.chip-3 {
    bottom: 12%;
    left: 6%;
    animation-delay: -4.8s;
}
.scroll-hint {
    position: absolute;
    left: 50%;
    bottom: 26px;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    color: rgba(160,180,215,.6);
    font-size: 9px;
    letter-spacing: .3em;
}
.scroll-line {
    width: 1px;
    height: 44px;
    background: linear-gradient(180deg, transparent, rgba(34,211,238,.8));
    animation: scroll-move 2.2s ease-in-out infinite;
}
@keyframes spin {
    to { transform: rotate(360deg); }
}
@keyframes core-float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-12px); }
}
@keyframes core-breathe {
    0%, 100% { opacity: .75; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.04); }
}
@keyframes chip-float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
}
@keyframes scroll-move {
    0% { opacity: 0; transform: scaleY(.2); transform-origin: top; }
    50% { opacity: 1; transform: scaleY(1); transform-origin: top; }
    100% { opacity: 0; transform: scaleY(1) translateY(14px); }
}
@media (max-width: 980px) {
    .hero {
        padding-top: 128px;
    }
    .hero-inner {
        grid-template-columns: 1fr;
    }
    .hero-visual {
        min-height: 400px;
        margin-top: 20px;
    }
    .ring,
    .core {
        width: min(360px, 86%);
    }
    .core-glow {
        width: 340px;
        height: 340px;
    }
}
@media (max-width: 560px) {
    .hero-stats {
        gap: 24px;
    }
    .hero-stats dt {
        font-size: 20px;
    }
    .chip-1 {
        left: -4%;
    }
    .chip-2 {
        right: -4%;
    }
}
</style>
