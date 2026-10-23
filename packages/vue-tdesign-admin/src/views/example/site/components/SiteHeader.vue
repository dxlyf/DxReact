<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

const scrolled=ref(false)
const menuOpen=ref(false)

const links=[
    {label:'产品',href:'#product'},
    {label:'特性',href:'#features'},
    {label:'参数',href:'#specs'},
    {label:'生态',href:'#ecosystem'}
]

function onScroll(){
    scrolled.value=window.scrollY>24
}

onMounted(()=>{
    onScroll()
    window.addEventListener('scroll',onScroll,{passive:true})
})

onUnmounted(()=>window.removeEventListener('scroll',onScroll))
</script>

<template>
    <header class="site-header" :class="{ 'is-scrolled': scrolled, 'is-open': menuOpen }">
        <div class="ax-container header-inner">
            <a class="brand" href="#top" @click="menuOpen=false">
                <svg class="brand-mark" viewBox="0 0 32 32" aria-hidden="true">
                    <defs>
                        <linearGradient id="brandMarkGradient" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0" stop-color="#22d3ee"/>
                            <stop offset="1" stop-color="#7c5cff"/>
                        </linearGradient>
                    </defs>
                    <path d="M16 2.5 28 9.2v13.6L16 29.5 4 22.8V9.2z" fill="none" stroke="url(#brandMarkGradient)" stroke-width="1.6"/>
                    <path d="M16 9.5l6.4 3.7v7.6L16 24.5l-6.4-3.7v-7.6z" fill="url(#brandMarkGradient)" opacity=".85"/>
                </svg>
                <span class="brand-name">AXION</span>
                <span class="brand-sub">SPATIAL</span>
            </a>

            <nav class="nav" aria-label="主导航">
                <a v-for="link in links" :key="link.href" :href="link.href">{{ link.label }}</a>
            </nav>

            <div class="header-actions">
                <a class="btn btn-sm btn-primary" href="#reserve">预约体验</a>
            </div>

            <button
                class="menu-toggle"
                type="button"
                :aria-expanded="menuOpen"
                aria-label="切换导航菜单"
                @click="menuOpen=!menuOpen"
            >
                <span></span>
                <span></span>
            </button>
        </div>

        <transition name="drawer">
            <div v-if="menuOpen" class="mobile-panel">
                <a v-for="link in links" :key="link.href" :href="link.href" @click="menuOpen=false">{{ link.label }}</a>
                <a class="btn btn-primary" href="#reserve" @click="menuOpen=false">预约体验</a>
            </div>
        </transition>
    </header>
</template>

<style scoped>
.site-header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 50;
    transition: background .35s ease, border-color .35s ease, backdrop-filter .35s ease;
    border-bottom: 1px solid transparent;
}
.site-header.is-scrolled {
    background: rgba(4,6,12,.72);
    border-bottom-color: rgba(140,170,255,.12);
    backdrop-filter: blur(18px) saturate(140%);
}
.header-inner {
    display: flex;
    align-items: center;
    gap: 40px;
    height: 76px;
}
.brand {
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--ax-text);
    text-decoration: none;
    letter-spacing: .16em;
}
.brand-mark {
    width: 30px;
    height: 30px;
    filter: drop-shadow(0 0 10px rgba(34,211,238,.45));
}
.brand-name {
    font-size: 17px;
    font-weight: 700;
}
.brand-sub {
    font-size: 10px;
    color: var(--ax-muted);
    letter-spacing: .3em;
    padding-left: 2px;
    transform: translateY(1px);
}
.nav {
    display: flex;
    align-items: center;
    gap: 34px;
    margin-left: auto;
}
.nav a {
    position: relative;
    color: var(--ax-muted);
    font-size: 14px;
    text-decoration: none;
    padding: 6px 0;
    transition: color .25s ease;
}
.nav a::after {
    content: '';
    position: absolute;
    left: 0;
    right: 100%;
    bottom: 0;
    height: 1px;
    background: linear-gradient(90deg, var(--ax-cyan), var(--ax-violet));
    transition: right .3s ease;
}
.nav a:hover {
    color: var(--ax-text);
}
.nav a:hover::after {
    right: 0;
}
.header-actions {
    display: flex;
    align-items: center;
}
.menu-toggle {
    display: none;
    flex-direction: column;
    justify-content: center;
    gap: 5px;
    width: 40px;
    height: 40px;
    margin-left: auto;
    padding: 0 9px;
    background: transparent;
    border: 1px solid var(--ax-line);
    border-radius: 10px;
    cursor: pointer;
}
.menu-toggle span {
    display: block;
    height: 1.5px;
    background: var(--ax-text);
    transition: transform .3s ease, opacity .3s ease;
}
.is-open .menu-toggle span:first-child {
    transform: translateY(3.25px) rotate(45deg);
}
.is-open .menu-toggle span:last-child {
    transform: translateY(-3.25px) rotate(-45deg);
}
.mobile-panel {
    display: none;
    padding: 8px 24px 24px;
    background: rgba(4,6,12,.96);
    border-bottom: 1px solid var(--ax-line);
    backdrop-filter: blur(18px);
}
.mobile-panel a {
    display: block;
    padding: 14px 2px;
    color: var(--ax-text);
    text-decoration: none;
    font-size: 15px;
    border-bottom: 1px solid rgba(140,170,255,.08);
}
.mobile-panel a.btn {
    margin-top: 16px;
    border-bottom: none;
    text-align: center;
}
.drawer-enter-active,
.drawer-leave-active {
    transition: opacity .25s ease, transform .25s ease;
}
.drawer-enter-from,
.drawer-leave-to {
    opacity: 0;
    transform: translateY(-8px);
}
@media (max-width: 900px) {
    .nav,
    .header-actions {
        display: none;
    }
    .menu-toggle,
    .mobile-panel {
        display: flex;
    }
    .mobile-panel {
        display: block;
    }
}
</style>
