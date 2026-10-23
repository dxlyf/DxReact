<script setup lang="ts">
interface SpecItem {
    label:string
    value:string
}

interface SpecGroup {
    name:string
    items:SpecItem[]
}

const groups:SpecGroup[]=[
    {
        name:'计算平台',
        items:[
            {label:'处理器',value:'AXION A1 · 8 核 3.2 GHz'},
            {label:'NPU',value:'12 TOPS 端侧推理'},
            {label:'内存 / 存储',value:'16 GB LPDDR5X · 512 GB NVMe'}
        ]
    },
    {
        name:'显示与光学',
        items:[
            {label:'显示',value:'2 × 4K micro-OLED'},
            {label:'刷新率',value:'120 Hz 自适应'},
            {label:'视场角 / 亮度',value:'120° · 1200 nits'}
        ]
    },
    {
        name:'空间感知',
        items:[
            {label:'空间追踪',value:'6 DoF 空间定位'},
            {label:'端到端延迟',value:'8 ms'},
            {label:'手势识别',value:'26 关键点 · 1 kHz'}
        ]
    },
    {
        name:'机身与连接',
        items:[
            {label:'重量',value:'210 g'},
            {label:'续航',value:'18 h 混合使用'},
            {label:'连接',value:'Wi-Fi 7 · BT 5.4 · USB-C'}
        ]
    }
]
</script>

<template>
    <section id="specs" class="ax-section specs-section">
        <div class="ax-container specs-layout">
            <aside class="specs-aside" data-reveal="0">
                <p class="ax-eyebrow">SPECIFICATIONS</p>
                <h2>把参数<br/>写在<span class="gradient-text">台面上</span></h2>
                <p class="aside-desc">
                    AXION ONE 开发者版即日起开放预约，随箱附带空间调试套件与完整的 SDK 访问权限。
                </p>
                <a class="btn btn-ghost" href="#reserve">获取开发者套件</a>
                <p class="aside-note">* 以上数据来自 AXION 实验室，实际表现受使用环境影响。</p>
            </aside>

            <div class="specs-list">
                <section
                    v-for="(group,index) in groups"
                    :key="group.name"
                    class="spec-group"
                    :data-reveal="index % 4"
                >
                    <h3>{{ group.name }}</h3>
                    <dl>
                        <div v-for="item in group.items" :key="item.label" class="spec-row">
                            <dt>{{ item.label }}</dt>
                            <dd>{{ item.value }}</dd>
                        </div>
                    </dl>
                </section>
            </div>
        </div>
    </section>
</template>

<style scoped>
.specs-section {
    position: relative;
    border-top: 1px solid rgba(140,170,255,.08);
    background: linear-gradient(180deg, rgba(10,16,30,.42), transparent 40%);
}
.specs-layout {
    display: grid;
    grid-template-columns: .82fr 1.18fr;
    gap: 72px;
    align-items: start;
}
.specs-aside {
    position: sticky;
    top: 118px;
}
.specs-aside h2 {
    margin: 18px 0 0;
    font-size: clamp(30px, 3.4vw, 44px);
    line-height: 1.18;
    letter-spacing: -.02em;
    font-weight: 650;
}
.aside-desc {
    max-width: 340px;
    margin: 22px 0 28px;
    color: var(--ax-muted);
    font-size: 14px;
    line-height: 1.9;
}
.specs-aside .btn {
    height: 44px;
    padding: 0 22px;
    font-size: 13px;
}
.aside-note {
    max-width: 320px;
    margin: 26px 0 0;
    color: rgba(140,160,195,.55);
    font-size: 11px;
    line-height: 1.8;
}
.specs-list {
    display: grid;
    gap: 14px;
}
.spec-group {
    padding: 26px 28px;
    border: 1px solid rgba(140,170,255,.12);
    border-radius: 16px;
    background: rgba(255,255,255,.022);
    transition: border-color .3s ease, background .3s ease;
}
.spec-group:hover {
    border-color: rgba(34,211,238,.32);
    background: rgba(34,211,238,.045);
}
.spec-group h3 {
    margin: 0 0 8px;
    color: #dce7fb;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: .16em;
}
.spec-group dl {
    margin: 0;
}
.spec-row {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 24px;
    padding: 14px 0;
    border-bottom: 1px solid rgba(140,170,255,.08);
}
.spec-row:last-child {
    padding-bottom: 2px;
    border-bottom: none;
}
.spec-row dt {
    flex: none;
    color: var(--ax-muted);
    font-size: 13px;
}
.spec-row dd {
    margin: 0;
    color: #e8effc;
    font-size: 14px;
    text-align: right;
    font-variant-numeric: tabular-nums;
}
@media (max-width: 980px) {
    .specs-layout {
        grid-template-columns: 1fr;
        gap: 40px;
    }
    .specs-aside {
        position: static;
    }
}
@media (max-width: 560px) {
    .spec-group {
        padding: 22px 20px;
    }
    .spec-row {
        gap: 14px;
    }
    .spec-row dd {
        font-size: 13px;
    }
}
</style>
