<script setup lang="ts">
/** 生态品牌 / 行业滚动条 */
const items=[
    'DESIGN STUDIO',
    'MOTION LAB',
    'ARCHITECTURE',
    'MEDICAL',
    'EDUCATION',
    'INDUSTRY 4.0',
    'XR STUDIO',
    'DIGITAL TWIN',
    'AUTOMOTIVE'
]
</script>

<template>
    <section id="ecosystem" class="marquee-section">
        <div class="ax-container marquee-head" data-reveal="0">
            <p class="ax-eyebrow">ECOSYSTEM</p>
            <h2>已有 <span class="gradient-text">200+</span> 团队用它构建空间应用</h2>
        </div>

        <div class="marquee" data-reveal="1" aria-label="合作伙伴与行业">
            <div class="marquee-track">
                <!-- 渲染两份相同内容，配合 -50% 位移实现无缝循环 -->
                <div
                    v-for="copy in 2"
                    :key="copy"
                    class="marquee-group"
                    :aria-hidden="copy === 2"
                >
                    <span v-for="item in items" :key="`${copy}-${item}`" class="marquee-item">
                        {{ item }}
                    </span>
                </div>
            </div>
        </div>

        <div class="ax-container marquee-foot" data-reveal="2">
            <span>38 个国家</span>
            <i></i>
            <span>1,200 万小时空间交互</span>
            <i></i>
            <span>94% 开发者留存</span>
        </div>
    </section>
</template>

<style scoped>
.marquee-section {
    position: relative;
    padding: 84px 0 96px;
    border-top: 1px solid rgba(140,170,255,.08);
    border-bottom: 1px solid rgba(140,170,255,.08);
    background: linear-gradient(180deg, rgba(10,16,30,.5), transparent 55%);
    overflow: hidden;
}
.marquee-head {
    margin-bottom: 48px;
    text-align: center;
}
.marquee-head .ax-eyebrow {
    justify-content: center;
}
.marquee-head h2 {
    margin: 18px 0 0;
    font-size: clamp(24px, 2.8vw, 36px);
    font-weight: 650;
    letter-spacing: -.01em;
}
.marquee {
    position: relative;
    padding: 22px 0;
    border-top: 1px solid rgba(140,170,255,.1);
    border-bottom: 1px solid rgba(140,170,255,.1);
    background: rgba(255,255,255,.015);
    -webkit-mask-image: linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent);
    mask-image: linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent);
}
.marquee-track {
    display: flex;
    width: max-content;
    animation: marquee-scroll 38s linear infinite;
}
.marquee:hover .marquee-track {
    animation-play-state: paused;
}
.marquee-group {
    display: flex;
    align-items: center;
}
.marquee-item {
    display: inline-flex;
    align-items: center;
    gap: 48px;
    color: #93a6c8;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: .28em;
    white-space: nowrap;
    transition: color .3s ease;
}
.marquee-item::after {
    content: '';
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--ax-cyan), var(--ax-violet));
    opacity: .7;
}
.marquee-item:hover {
    color: #e9efff;
}
.marquee-foot {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 22px;
    margin-top: 34px;
    color: var(--ax-muted);
    font-size: 12px;
    letter-spacing: .14em;
}
.marquee-foot i {
    width: 1px;
    height: 10px;
    background: rgba(140,170,255,.28);
}
@keyframes marquee-scroll {
    to { transform: translateX(-50%); }
}
@media (max-width: 640px) {
    .marquee-section {
        padding: 64px 0 72px;
    }
    .marquee-item {
        gap: 32px;
        font-size: 12px;
    }
    .marquee-foot {
        flex-wrap: wrap;
        gap: 12px;
    }
    .marquee-foot i {
        display: none;
    }
}
@media (prefers-reduced-motion: reduce) {
    .marquee-track {
        animation: none;
    }
}
</style>
