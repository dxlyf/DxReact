<script setup lang="ts">
interface FooterColumn {
    title:string
    links:{ label:string, href:string }[]
}

const columns:FooterColumn[]=[
    {
        title:'产品',
        links:[
            {label:'全息视界',href:'#product'},
            {label:'空间感知',href:'#product'},
            {label:'实时协同',href:'#product'},
            {label:'技术参数',href:'#specs'}
        ]
    },
    {
        title:'支持',
        links:[
            {label:'开发者文档',href:'#specs'},
            {label:'固件更新',href:'#specs'},
            {label:'开发者社区',href:'#ecosystem'},
            {label:'联系我们',href:'#reserve'}
        ]
    },
    {
        title:'公司',
        links:[
            {label:'关于 AXION',href:'#top'},
            {label:'加入我们',href:'#reserve'},
            {label:'行业案例',href:'#ecosystem'},
            {label:'媒体资料',href:'#ecosystem'}
        ]
    }
]

const year=new Date().getFullYear()
</script>

<template>
    <footer class="site-footer">
        <div class="ax-container">
            <div class="footer-top">
                <div class="footer-brand">
                    <a class="brand" href="#top">
                        <svg class="brand-mark" viewBox="0 0 32 32" aria-hidden="true">
                            <defs>
                                <linearGradient id="footerBrandGradient" x1="0" y1="0" x2="1" y2="1">
                                    <stop offset="0" stop-color="#22d3ee"/>
                                    <stop offset="1" stop-color="#7c5cff"/>
                                </linearGradient>
                            </defs>
                            <path d="M16 2.5 28 9.2v13.6L16 29.5 4 22.8V9.2z" fill="none" stroke="url(#footerBrandGradient)" stroke-width="1.6"/>
                            <path d="M16 9.5l6.4 3.7v7.6L16 24.5l-6.4-3.7v-7.6z" fill="url(#footerBrandGradient)" opacity=".85"/>
                        </svg>
                        <span class="brand-name">AXION</span>
                    </a>
                    <p>把数字世界叠加到现实。<br/>为创作者构建下一代空间计算终端。</p>
                    <div class="socials">
                        <a href="#ecosystem">微博</a>
                        <a href="#ecosystem">微信</a>
                        <a href="#ecosystem">Bilibili</a>
                    </div>
                </div>

                <nav
                    v-for="column in columns"
                    :key="column.title"
                    class="footer-column"
                    :aria-label="column.title"
                >
                    <h4>{{ column.title }}</h4>
                    <a v-for="link in column.links" :key="link.label" :href="link.href">{{ link.label }}</a>
                </nav>
            </div>

            <div class="footer-wordmark" aria-hidden="true">AXION</div>

            <div class="footer-bottom">
                <span>© {{ year }} AXION Labs. All rights reserved.</span>
                <div class="legal">
                    <a href="#top">隐私政策</a>
                    <a href="#top">使用条款</a>
                    <a href="#top">Cookie 设置</a>
                </div>
            </div>
        </div>
    </footer>
</template>

<style scoped>
.site-footer {
    position: relative;
    padding-top: 88px;
    border-top: 1px solid rgba(140,170,255,.1);
    background: linear-gradient(180deg, transparent, rgba(3,5,10,.9));
    overflow: hidden;
}
.footer-top {
    display: grid;
    grid-template-columns: 1.6fr repeat(3, 1fr);
    gap: 48px;
}
.brand {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    color: var(--ax-text);
    text-decoration: none;
    letter-spacing: .16em;
}
.brand-mark {
    width: 30px;
    height: 30px;
    filter: drop-shadow(0 0 10px rgba(34,211,238,.4));
}
.brand-name {
    font-size: 17px;
    font-weight: 700;
}
.footer-brand p {
    max-width: 300px;
    margin: 20px 0 0;
    color: var(--ax-muted);
    font-size: 13px;
    line-height: 1.9;
}
.socials {
    display: flex;
    gap: 10px;
    margin-top: 24px;
}
.socials a {
    padding: 7px 14px;
    color: #9fb3d9;
    font-size: 12px;
    text-decoration: none;
    border: 1px solid rgba(140,170,255,.16);
    border-radius: 999px;
    transition: color .25s ease, border-color .25s ease, background .25s ease;
}
.socials a:hover {
    color: var(--ax-text);
    border-color: rgba(34,211,238,.45);
    background: rgba(34,211,238,.08);
}
.footer-column {
    display: flex;
    flex-direction: column;
    gap: 12px;
}
.footer-column h4 {
    margin: 4px 0 10px;
    color: #dbe6f9;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: .18em;
}
.footer-column a {
    color: var(--ax-muted);
    font-size: 13px;
    text-decoration: none;
    transition: color .25s ease, transform .25s ease;
}
.footer-column a:hover {
    color: var(--ax-cyan);
    transform: translateX(3px);
}
.footer-wordmark {
    margin: 72px 0 -12px;
    color: transparent;
    font-size: clamp(80px, 17vw, 230px);
    font-weight: 800;
    line-height: .82;
    letter-spacing: .08em;
    text-align: center;
    -webkit-text-stroke: 1px rgba(140,170,255,.13);
    user-select: none;
    pointer-events: none;
}
.footer-bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    padding: 26px 0 34px;
    border-top: 1px solid rgba(140,170,255,.1);
    color: rgba(140,160,195,.6);
    font-size: 12px;
}
.legal {
    display: flex;
    gap: 22px;
}
.legal a {
    color: inherit;
    text-decoration: none;
    transition: color .25s ease;
}
.legal a:hover {
    color: var(--ax-text);
}
@media (max-width: 980px) {
    .footer-top {
        grid-template-columns: 1fr 1fr;
        gap: 36px;
    }
    .footer-brand {
        grid-column: 1 / -1;
    }
}
@media (max-width: 560px) {
    .site-footer {
        padding-top: 64px;
    }
    .footer-top {
        grid-template-columns: 1fr;
    }
    .footer-bottom {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
    }
    .legal {
        flex-wrap: wrap;
        gap: 14px;
    }
}
</style>
