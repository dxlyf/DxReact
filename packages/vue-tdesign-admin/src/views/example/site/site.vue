<script setup lang="ts">
import { ref } from 'vue'
import SiteHeader from './components/SiteHeader.vue'
import HeroSection from './components/HeroSection.vue'
import BrandMarquee from './components/BrandMarquee.vue'
import ProductShowcase from './components/ProductShowcase.vue'
import SceneCarousel from './components/SceneCarousel.vue'
import FeatureGrid from './components/FeatureGrid.vue'
import SpecSection from './components/SpecSection.vue'
import CtaSection from './components/CtaSection.vue'
import SiteFooter from './components/SiteFooter.vue'
import { useReveal } from './composables/useReveal'
import { useTitle } from '../../../hooks/useTitle'

const rootRef=ref<HTMLElement>()
// 统一接管页面内所有 data-reveal 元素的进场动画
useReveal(rootRef)
useTitle(ref('AXION — 空间计算终端'))
</script>

<template>
    <div ref="rootRef" class="axion-site">
        <SiteHeader/>

        <main>
            <HeroSection/>
            <BrandMarquee/>
            <ProductShowcase/>
            <!-- 大轮播默认纵向滚动，可在组件内切换为横向 -->
            <SceneCarousel/>
            <FeatureGrid/>
            <SpecSection/>
            <CtaSection/>
        </main>

        <SiteFooter/>
    </div>
</template>

<style>
/* 官网全局设计令牌与公共样式，统一挂在 .axion-site 下，避免污染后台其它页面 */
.axion-site {
    --ax-bg: #04060c;
    --ax-panel: rgba(255, 255, 255, .03);
    --ax-line: rgba(140, 170, 255, .14);
    --ax-text: #e9efff;
    --ax-muted: #8b9bb8;
    --ax-cyan: #22d3ee;
    --ax-violet: #7c5cff;
    --ax-pink: #ff4ecd;

    position: relative;
    isolation: isolate;
    min-height: 100vh;
    overflow-x: hidden;
    color: var(--ax-text);
    font-family: 'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI',
        'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background:
        radial-gradient(1200px 700px at 78% -8%, rgba(124, 92, 255, .16), transparent 62%),
        radial-gradient(900px 520px at 6% 4%, rgba(34, 211, 238, .09), transparent 60%),
        var(--ax-bg);
}
.axion-site *,
.axion-site *::before,
.axion-site *::after {
    box-sizing: border-box;
}
.axion-site h1,
.axion-site h2,
.axion-site h3,
.axion-site h4,
.axion-site p,
.axion-site dl,
.axion-site dd {
    margin: 0;
}
.axion-site a {
    color: inherit;
}
.axion-site section[id] {
    scroll-margin-top: 88px;
}
.axion-site ::selection {
    color: #fff;
    background: rgba(34, 211, 238, .3);
}
/* 细微噪点，让大面积深色背景不至于太平 */
.axion-site::after {
    content: '';
    position: fixed;
    inset: 0;
    z-index: 60;
    pointer-events: none;
    opacity: .022;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)'/%3E%3C/svg%3E");
}

.axion-site .ax-container {
    width: min(1200px, calc(100% - 48px));
    margin-inline: auto;
}
.axion-site .ax-section {
    position: relative;
    padding: 112px 0;
}
.axion-site .ax-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    color: #8ba0c4;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: .26em;
}
.axion-site .ax-eyebrow::before {
    content: '';
    width: 26px;
    height: 1px;
    background: linear-gradient(90deg, var(--ax-cyan), rgba(124, 92, 255, .2));
}
.axion-site .ax-section-head {
    max-width: 720px;
    margin-bottom: 52px;
}
.axion-site .ax-section-head h2 {
    margin-top: 18px;
    font-size: clamp(30px, 3.6vw, 46px);
    font-weight: 700;
    line-height: 1.16;
    letter-spacing: -.02em;
}
.axion-site .ax-section-head > p:not(.ax-eyebrow) {
    margin-top: 18px;
    color: var(--ax-muted);
    font-size: 15px;
    line-height: 1.9;
}
.axion-site .gradient-text {
    color: transparent;
    background: linear-gradient(100deg, #22d3ee 8%, #7c5cff 48%, #ff4ecd 92%);
    -webkit-background-clip: text;
    background-clip: text;
}

/* 按钮 */
.axion-site .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    height: 48px;
    padding: 0 26px;
    color: var(--ax-text);
    font-family: inherit;
    font-size: 14px;
    font-weight: 600;
    letter-spacing: .02em;
    text-decoration: none;
    border: 1px solid transparent;
    border-radius: 999px;
    cursor: pointer;
    appearance: none;
    transition: transform .25s ease, box-shadow .25s ease, background .25s ease, border-color .25s ease;
}
.axion-site .btn svg {
    width: 16px;
    height: 16px;
}
.axion-site .btn-primary {
    color: #04070f;
    background: linear-gradient(100deg, #22d3ee, #7c5cff);
    box-shadow: 0 12px 34px rgba(80, 120, 255, .32);
}
.axion-site .btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 18px 46px rgba(80, 120, 255, .46);
}
.axion-site .btn-ghost {
    color: var(--ax-text);
    background: rgba(255, 255, 255, .03);
    border-color: rgba(140, 170, 255, .22);
}
.axion-site .btn-ghost:hover {
    transform: translateY(-2px);
    background: rgba(34, 211, 238, .08);
    border-color: rgba(34, 211, 238, .55);
}
.axion-site .btn-sm {
    height: 40px;
    padding: 0 20px;
    font-size: 13px;
}

/* 滚动进场 */
.axion-site [data-reveal] {
    opacity: 0;
    transform: translateY(24px);
    transition: opacity .7s ease, transform .7s cubic-bezier(.22, .61, .36, 1);
}
.axion-site [data-reveal].is-visible {
    opacity: 1;
    transform: none;
}

@media (max-width: 768px) {
    .axion-site .ax-container {
        width: calc(100% - 32px);
    }
    .axion-site .ax-section {
        padding: 76px 0;
    }
    .axion-site .ax-section-head {
        margin-bottom: 36px;
    }
}

html:has(.axion-site) {
    scroll-behavior: smooth;
}
@media (prefers-reduced-motion: reduce) {
    html:has(.axion-site) {
        scroll-behavior: auto;
    }
    .axion-site [data-reveal] {
        opacity: 1;
        transform: none;
        transition: none;
    }
    .axion-site * {
        animation-duration: .001ms !important;
        animation-iteration-count: 1 !important;
    }
}
</style>
