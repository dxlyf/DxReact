<script setup lang="ts">
import { computed, ref } from 'vue'

interface ShowcasePoint {
    title:string
    desc:string
}

interface ShowcaseTab {
    id:string
    label:string
    kicker:string
    title:string
    desc:string
    /** 主色，用于按钮、边框与光晕 */
    accent:string
    /** 主色的 RGB 分量，方便拼 rgba() */
    rgb:string
    points:ShowcasePoint[]
    metric:{ value:string, label:string }
}

const tabs:ShowcaseTab[]=[
    {
        id:'holo',
        label:'全息视界',
        kicker:'HOLOGRAPHIC DISPLAY',
        title:'把界面，放进你的房间',
        desc:'双目 4K micro-OLED 与光波导镜片叠合，虚拟窗口可以钉在任意平面，也可以跟随视线漂移。',
        accent:'#22d3ee',
        rgb:'34, 211, 238',
        points:[
            {title:'双目 4K 分辨率',desc:'单眼 3840 × 3552，像素密度 3400 ppi'},
            {title:'120° 视场角',desc:'接近人眼自然视野，边缘不裁切'},
            {title:'自适应瞳距',desc:'0.5 秒完成校准，支持多人轮换使用'}
        ],
        metric:{value:'4K ×2',label:'双目显示'}
    },
    {
        id:'spatial',
        label:'空间感知',
        kicker:'SPATIAL MAPPING',
        title:'让设备，看懂整个空间',
        desc:'四组鱼眼摄像头与 dToF 深度传感器实时融合，在 8ms 内重建房间网格，识别桌面、墙面与障碍物。',
        accent:'#7c5cff',
        rgb:'124, 92, 255',
        points:[
            {title:'6 DoF 空间锚定',desc:'内容固定在世界坐标，走动也不漂移'},
            {title:'毫米级平面检测',desc:'自动区分桌面、地面与可放置区域'},
            {title:'实时网格重建',desc:'每秒 60 次更新，动态场景同样稳定'}
        ],
        metric:{value:'6 DoF',label:'空间追踪'}
    },
    {
        id:'collab',
        label:'实时协同',
        kicker:'REAL-TIME COLLABORATION',
        title:'同一个空间，一起创作',
        desc:'全双工语音与共享空间白板让远程协作像面对面。所有空间数据端到端加密，只在参与者之间流转。',
        accent:'#ff4ecd',
        rgb:'255, 78, 205',
        points:[
            {title:'全双工语音',desc:'随时打断、自然接话，无需按键'},
            {title:'共享空间白板',desc:'多人同时标注同一个三维模型'},
            {title:'端到端加密',desc:'密钥仅保存在设备安全岛内'}
        ],
        metric:{value:'8 ms',label:'协同延迟'}
    }
]

const activeId=ref(tabs[0].id)
const active=computed(()=>tabs.find(tab=>tab.id===activeId.value)??tabs[0])
/** 把当前主色透传给舞台，CSS 里统一使用 --accent / --accent-rgb */
const stageStyle=computed<Record<string,string>>(()=>({
    '--accent':active.value.accent,
    '--accent-rgb':active.value.rgb
}))
</script>

<template>
    <section id="product" class="ax-section product-section">
        <div class="ax-container">
            <div class="ax-section-head" data-reveal="0">
                <p class="ax-eyebrow">PRODUCT</p>
                <h2>一台设备，三种<span class="gradient-text">空间能力</span></h2>
                <p>从显示到感知再到协同，AXION ONE 把完整的空间计算链路，压缩进 210 克的机身。</p>
            </div>

            <div class="showcase" :style="stageStyle" data-reveal="1">
                <div class="tabs" role="tablist" aria-label="产品能力">
                    <button
                        v-for="(tab,index) in tabs"
                        :key="tab.id"
                        class="tab"
                        :class="{ 'is-active': tab.id === activeId }"
                        type="button"
                        role="tab"
                        :aria-selected="tab.id === activeId"
                        @click="activeId = tab.id"
                    >
                        <span class="tab-index">0{{ index + 1 }}</span>
                        <span class="tab-label">{{ tab.label }}</span>
                    </button>
                </div>

                <div class="showcase-body">
                    <transition name="swap" mode="out-in">
                        <div :key="active.id" class="showcase-copy">
                            <p class="kicker" :style="{ color: active.accent }">{{ active.kicker }}</p>
                            <h3>{{ active.title }}</h3>
                            <p class="desc">{{ active.desc }}</p>

                            <ul class="points">
                                <li v-for="point in active.points" :key="point.title">
                                    <span class="point-mark" :style="{ background: active.accent }"></span>
                                    <div>
                                        <strong>{{ point.title }}</strong>
                                        <span>{{ point.desc }}</span>
                                    </div>
                                </li>
                            </ul>

                            <a class="text-link" href="#specs">
                                查看完整参数
                                <svg viewBox="0 0 16 16" aria-hidden="true">
                                    <path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </a>
                        </div>
                    </transition>

                    <div class="stage" aria-hidden="true">
                        <div class="stage-grid"></div>
                        <div class="stage-halo"></div>

                        <svg class="stage-orbit" viewBox="0 0 400 400">
                            <circle class="orbit orbit-a" cx="200" cy="200" r="156" fill="none" stroke="var(--accent)" stroke-width="1" stroke-dasharray="2 10" opacity=".55"/>
                            <circle class="orbit orbit-b" cx="200" cy="200" r="118" fill="none" stroke="var(--accent)" stroke-width="1" stroke-dasharray="42 200" stroke-linecap="round" opacity=".8"/>
                        </svg>

                        <div class="cube-wrap">
                            <div class="cube">
                                <span class="face face-front"></span>
                                <span class="face face-back"></span>
                                <span class="face face-right"></span>
                                <span class="face face-left"></span>
                                <span class="face face-top"></span>
                                <span class="face face-bottom"></span>
                            </div>
                        </div>

                        <span class="scanner"></span>

                        <div class="stage-metric">
                            <strong>{{ active.metric.value }}</strong>
                            <span>{{ active.metric.label }}</span>
                        </div>

                        <span class="corner corner-tl"></span>
                        <span class="corner corner-tr"></span>
                        <span class="corner corner-bl"></span>
                        <span class="corner corner-br"></span>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>

<style scoped>
.tabs {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-bottom: 28px;
}
.tab {
    position: relative;
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 16px 18px;
    text-align: left;
    color: var(--ax-muted);
    font-family: inherit;
    font-size: 14px;
    background: rgba(255,255,255,.02);
    border: 1px solid rgba(140,170,255,.12);
    border-radius: 14px;
    cursor: pointer;
    transition: color .28s ease, border-color .28s ease, background .28s ease, transform .28s ease;
}
.tab:hover {
    color: var(--ax-text);
    border-color: rgba(140,170,255,.26);
    transform: translateY(-2px);
}
.tab.is-active {
    color: var(--ax-text);
    border-color: var(--accent);
    background: linear-gradient(120deg, rgba(var(--accent-rgb), .14), rgba(255,255,255,.02));
    box-shadow: 0 14px 38px rgba(var(--accent-rgb), .16), inset 0 0 0 1px rgba(var(--accent-rgb), .2);
}
.showcase {
    --accent: #22d3ee;
    --accent-rgb: 34, 211, 238;
}
.tab-index {
    font-size: 11px;
    letter-spacing: .16em;
    color: var(--accent);
    opacity: .85;
}
.tab-label {
    font-weight: 600;
    letter-spacing: .04em;
}
.showcase-body {
    display: grid;
    grid-template-columns: .92fr 1.08fr;
    align-items: center;
    gap: 52px;
    padding: 44px;
    border: 1px solid rgba(140,170,255,.12);
    border-radius: 24px;
    background:
        linear-gradient(140deg, rgba(255,255,255,.035), transparent 45%),
        rgba(6,10,20,.55);
}
.kicker {
    margin: 0;
    font-size: 10px;
    letter-spacing: .26em;
}
.showcase-copy h3 {
    margin: 16px 0 0;
    font-size: clamp(26px, 2.6vw, 36px);
    line-height: 1.24;
    letter-spacing: -.015em;
    font-weight: 650;
}
.desc {
    margin: 18px 0 0;
    color: var(--ax-muted);
    font-size: 15px;
    line-height: 1.9;
}
.points {
    margin: 30px 0 0;
    padding: 0;
    list-style: none;
    display: grid;
    gap: 18px;
}
.points li {
    display: flex;
    align-items: flex-start;
    gap: 12px;
}
.point-mark {
    flex: none;
    width: 6px;
    height: 6px;
    margin-top: 7px;
    border-radius: 50%;
    box-shadow: 0 0 12px currentColor;
}
.points strong {
    display: block;
    font-size: 14px;
    font-weight: 600;
    color: #e3ebfb;
}
.points span {
    display: block;
    margin-top: 4px;
    color: var(--ax-muted);
    font-size: 13px;
    line-height: 1.7;
}
.text-link {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    margin-top: 32px;
    color: var(--ax-cyan);
    font-size: 13px;
    text-decoration: none;
    letter-spacing: .04em;
}
.text-link svg {
    width: 15px;
    height: 15px;
    transition: transform .25s ease;
}
.text-link:hover svg {
    transform: translateX(4px);
}

/* 右侧 3D 舞台 */
.stage {
    position: relative;
    display: grid;
    place-items: center;
    min-height: 430px;
    overflow: hidden;
    border-radius: 20px;
    border: 1px solid rgba(var(--accent-rgb), .22);
    background:
        radial-gradient(circle at 50% 42%, rgba(var(--accent-rgb), .18), transparent 62%),
        rgba(2,5,12,.7);
    transition: border-color .4s ease, background .4s ease;
}
.stage-grid {
    position: absolute;
    left: -30%;
    right: -30%;
    bottom: -18%;
    height: 62%;
    background-image:
        linear-gradient(rgba(var(--accent-rgb), .3) 1px, transparent 1px),
        linear-gradient(90deg, rgba(var(--accent-rgb), .3) 1px, transparent 1px);
    background-size: 42px 42px;
    transform: perspective(560px) rotateX(68deg);
    transform-origin: bottom center;
    opacity: .3;
    -webkit-mask-image: linear-gradient(180deg, transparent, #000 40%, transparent 92%);
    mask-image: linear-gradient(180deg, transparent, #000 40%, transparent 92%);
}
.stage-halo {
    position: absolute;
    width: 340px;
    height: 340px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(var(--accent-rgb), .3), transparent 66%);
    filter: blur(18px);
    animation: halo-pulse 6s ease-in-out infinite;
}
.stage-orbit {
    position: absolute;
    width: min(380px, 88%);
    aspect-ratio: 1;
}
.orbit {
    transform-origin: 200px 200px;
}
.orbit-a {
    animation: spin 42s linear infinite;
}
.orbit-b {
    animation: spin 22s linear infinite reverse;
}
.cube-wrap {
    position: relative;
    perspective: 900px;
}
.cube {
    position: relative;
    width: 170px;
    height: 170px;
    transform-style: preserve-3d;
    animation: cube-spin 20s linear infinite;
}
.face {
    position: absolute;
    inset: 0;
    border: 1px solid rgba(var(--accent-rgb), .55);
    background: linear-gradient(135deg, rgba(var(--accent-rgb), .14), rgba(255,255,255,.01));
    box-shadow: inset 0 0 34px rgba(var(--accent-rgb), .16);
    transition: border-color .4s ease, background .4s ease;
}
.face-front  { transform: translateZ(85px); }
.face-back   { transform: rotateY(180deg) translateZ(85px); }
.face-right  { transform: rotateY(90deg) translateZ(85px); }
.face-left   { transform: rotateY(-90deg) translateZ(85px); }
.face-top    { transform: rotateX(90deg) translateZ(85px); }
.face-bottom { transform: rotateX(-90deg) translateZ(85px); }
.scanner {
    position: absolute;
    left: 14%;
    right: 14%;
    top: 24%;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--accent), transparent);
    box-shadow: 0 0 16px rgba(var(--accent-rgb), .9);
    animation: scan 5s ease-in-out infinite;
}
.stage-metric {
    position: absolute;
    left: 22px;
    bottom: 22px;
    display: flex;
    flex-direction: column;
    gap: 3px;
}
.stage-metric strong {
    font-size: 20px;
    font-weight: 650;
    color: #f2f7ff;
    letter-spacing: .01em;
}
.stage-metric span {
    font-size: 10px;
    letter-spacing: .2em;
    color: var(--ax-muted);
}
.corner {
    position: absolute;
    width: 16px;
    height: 16px;
    border: 1px solid rgba(var(--accent-rgb), .5);
}
.corner-tl { top: 14px; left: 14px; border-right: 0; border-bottom: 0; }
.corner-tr { top: 14px; right: 14px; border-left: 0; border-bottom: 0; }
.corner-bl { bottom: 14px; left: 14px; border-right: 0; border-top: 0; }
.corner-br { bottom: 14px; right: 14px; border-left: 0; border-top: 0; }

.swap-enter-active,
.swap-leave-active {
    transition: opacity .3s ease, transform .3s ease;
}
.swap-enter-from {
    opacity: 0;
    transform: translateY(10px);
}
.swap-leave-to {
    opacity: 0;
    transform: translateY(-8px);
}
@keyframes cube-spin {
    from { transform: rotateX(-18deg) rotateY(0deg); }
    to { transform: rotateX(-18deg) rotateY(360deg); }
}
@keyframes spin {
    to { transform: rotate(360deg); }
}
@keyframes halo-pulse {
    0%, 100% { opacity: .7; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.06); }
}
@keyframes scan {
    0% { top: 20%; opacity: 0; }
    15% { opacity: 1; }
    85% { opacity: 1; }
    100% { top: 78%; opacity: 0; }
}
@media (max-width: 980px) {
    .showcase-body {
        grid-template-columns: 1fr;
        padding: 28px;
        gap: 34px;
    }
    .stage {
        min-height: 360px;
    }
}
@media (max-width: 640px) {
    .tabs {
        gap: 8px;
    }
    .tab {
        flex-direction: column;
        align-items: flex-start;
        gap: 6px;
        padding: 12px;
        font-size: 13px;
    }
    .showcase-body {
        padding: 22px;
    }
    .cube {
        width: 130px;
        height: 130px;
    }
    .face-front  { transform: translateZ(65px); }
    .face-back   { transform: rotateY(180deg) translateZ(65px); }
    .face-right  { transform: rotateY(90deg) translateZ(65px); }
    .face-left   { transform: rotateY(-90deg) translateZ(65px); }
    .face-top    { transform: rotateX(90deg) translateZ(65px); }
    .face-bottom { transform: rotateX(-90deg) translateZ(65px); }
}
</style>
