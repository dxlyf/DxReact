<script setup lang="ts">
interface Feature {
    tag:string
    title:string
    desc:string
    paths:string[]
}

const features:Feature[]=[
    {
        tag:'AI ENGINE',
        title:'端侧 AI 引擎',
        desc:'12 TOPS NPU 在本地完成视觉识别、语音理解与场景重建，敏感数据不出设备。',
        paths:[
            'M12 3.2 14.4 9l5.8 2.4-5.8 2.4L12 19.6 9.6 13.8 3.8 11.4 9.6 9z',
            'M19 4.2v3M17.5 5.7h3'
        ]
    },
    {
        tag:'SPATIAL',
        title:'毫米级空间感知',
        desc:'四组鱼眼摄像头与 dToF 深度传感器融合，实时重建室内网格、平面与障碍物。',
        paths:[
            'M12 3 20.5 7.8v8.4L12 21l-8.5-4.8V7.8z',
            'M12 3v9l8.5 4.2M12 12 3.5 16.2'
        ]
    },
    {
        tag:'GESTURE',
        title:'亚毫秒手势追踪',
        desc:'26 个手部关键点以 1 kHz 采样，捏合、拖拽、滑动都无需学习成本。',
        paths:[
            'M9 11.5V6.4a1.5 1.5 0 0 1 3 0v4.6',
            'M12 11V5.6a1.5 1.5 0 0 1 3 0V11',
            'M15 11.2V7.4a1.5 1.5 0 0 1 3 0V14a6.2 6.2 0 0 1-6.2 6.2h-.6A6.2 6.2 0 0 1 5 14v-1.2a1.6 1.6 0 0 1 2.9-.9L9 14'
        ]
    },
    {
        tag:'VOICE',
        title:'全双工语音',
        desc:'6 麦克风阵列支持打断式对话，嘈杂环境下的唤醒与识别准确率仍达 98%。',
        paths:[
            'M12 3.5a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0v-5a3 3 0 0 1 3-3z',
            'M5.5 11.5a6.5 6.5 0 0 0 13 0',
            'M12 18v2.5'
        ]
    },
    {
        tag:'PRIVACY',
        title:'隐私计算',
        desc:'生物特征与空间数据在安全岛内加密处理，身份校验全程离线完成。',
        paths:[
            'M12 3.2 19 6v6.1c0 4.2-2.9 7.7-7 8.9-4.1-1.2-7-4.7-7-8.9V6z',
            'M12 9.6a1.8 1.8 0 0 1 1 3.3V15h-2v-2.1a1.8 1.8 0 0 1 1-3.3z'
        ]
    },
    {
        tag:'POWER',
        title:'18h 全天续航',
        desc:'双芯异构调度与定制散热结构，重度混合负载下依然安静、稳定、不降频。',
        paths:[
            'M5 8h10.5a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2z',
            'M20 10.5v3',
            'M11.2 9.6 8.6 12.6h2.3L10 14.8l3.2-3.2h-2.4z'
        ]
    }
]
</script>

<template>
    <section id="features" class="ax-section features-section">
        <div class="ax-container">
            <div class="ax-section-head" data-reveal="0">
                <p class="ax-eyebrow">CAPABILITIES</p>
                <h2>为空间而生的<span class="gradient-text">每一处细节</span></h2>
                <p>芯片、光学、传感器与算法被放在同一块主板上重新设计，才有 210 克里完整的空间计算。</p>
            </div>

            <div class="feature-grid">
                <article
                    v-for="(feature,index) in features"
                    :key="feature.title"
                    class="feature-card"
                    :data-reveal="index % 3 + 1"
                >
                    <span class="card-index">0{{ index + 1 }}</span>
                    <div class="icon-box">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <path v-for="(path,pathIndex) in feature.paths" :key="pathIndex" :d="path"/>
                        </svg>
                    </div>
                    <span class="card-tag">{{ feature.tag }}</span>
                    <h3>{{ feature.title }}</h3>
                    <p>{{ feature.desc }}</p>
                </article>
            </div>
        </div>
    </section>
</template>

<style scoped>
.features-section {
    position: relative;
}
.feature-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 18px;
}
.feature-card {
    position: relative;
    overflow: hidden;
    padding: 30px 28px 32px;
    border: 1px solid rgba(140,170,255,.12);
    border-radius: 18px;
    background: linear-gradient(160deg, rgba(255,255,255,.035), rgba(255,255,255,.008));
    transition: transform .35s ease, border-color .35s ease, box-shadow .35s ease;
}
.feature-card::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(320px circle at 82% -10%, rgba(34,211,238,.16), transparent 62%);
    opacity: 0;
    transition: opacity .4s ease;
    pointer-events: none;
}
.feature-card:hover {
    transform: translateY(-6px);
    border-color: rgba(124,158,255,.34);
    box-shadow: 0 24px 60px rgba(0,0,0,.42);
}
.feature-card:hover::before {
    opacity: 1;
}
.card-index {
    position: absolute;
    top: 26px;
    right: 26px;
    color: rgba(150,175,220,.32);
    font-size: 11px;
    letter-spacing: .18em;
}
.icon-box {
    display: grid;
    place-items: center;
    width: 46px;
    height: 46px;
    border-radius: 13px;
    border: 1px solid rgba(34,211,238,.28);
    background: linear-gradient(145deg, rgba(34,211,238,.16), rgba(124,92,255,.12));
    color: #7ee9f7;
    box-shadow: inset 0 0 20px rgba(34,211,238,.12);
}
.icon-box svg {
    width: 23px;
    height: 23px;
}
.card-tag {
    display: block;
    margin-top: 26px;
    color: rgba(140,168,210,.72);
    font-size: 10px;
    letter-spacing: .24em;
}
.feature-card h3 {
    margin: 10px 0 12px;
    font-size: 19px;
    font-weight: 650;
    letter-spacing: .01em;
}
.feature-card p {
    margin: 0;
    color: var(--ax-muted);
    font-size: 13.5px;
    line-height: 1.85;
}
@media (max-width: 980px) {
    .feature-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}
@media (max-width: 640px) {
    .feature-grid {
        grid-template-columns: 1fr;
    }
    .feature-card {
        padding: 26px 22px 28px;
    }
}
</style>
