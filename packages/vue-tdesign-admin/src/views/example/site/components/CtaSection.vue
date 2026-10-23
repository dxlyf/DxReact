<script setup lang="ts">
import { ref } from 'vue'

const email=ref('')
const error=ref('')
const submitted=ref(false)

/** 简单校验邮箱格式，通过后进入成功态 */
function submit(){
    const value=email.value.trim()
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)){
        error.value='请输入有效的邮箱地址'
        return
    }
    error.value=''
    email.value=value
    submitted.value=true
}

function reset(){
    submitted.value=false
}
</script>

<template>
    <section id="reserve" class="ax-section cta-section">
        <div class="ax-container">
            <div class="cta-panel" data-reveal="0">
                <div class="cta-aurora" aria-hidden="true"></div>
                <svg class="cta-ring cta-ring-a" viewBox="0 0 600 600" aria-hidden="true">
                    <circle cx="300" cy="300" r="280" fill="none" stroke="rgba(34,211,238,.18)" stroke-width="1" stroke-dasharray="2 12"/>
                </svg>
                <svg class="cta-ring cta-ring-b" viewBox="0 0 600 600" aria-hidden="true">
                    <circle cx="300" cy="300" r="212" fill="none" stroke="rgba(124,92,255,.22)" stroke-width="1" stroke-dasharray="120 320" stroke-linecap="round"/>
                </svg>

                <div class="cta-content">
                    <p class="ax-eyebrow">EARLY ACCESS</p>
                    <h2>准备好，<span class="gradient-text">进入空间</span>了吗？</h2>
                    <p class="cta-desc">
                        首批 500 台开发者套件现已开放预约。留下邮箱，我们会发送专属体验邀请与 SDK 文档。
                    </p>

                    <transition name="swap" mode="out-in">
                        <form v-if="!submitted" key="form" class="reserve-form" novalidate @submit.prevent="submit">
                            <div class="field" :class="{ 'is-invalid': error }">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                    <path d="M4 6.5h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1z"/>
                                    <path d="m4 7 8 6 8-6"/>
                                </svg>
                                <input
                                    v-model="email"
                                    type="email"
                                    name="email"
                                    autocomplete="email"
                                    placeholder="you@studio.com"
                                    aria-label="邮箱地址"
                                />
                            </div>
                            <button class="btn btn-primary" type="submit">预约体验</button>
                        </form>

                        <div v-else key="success" class="reserve-success" role="status">
                            <span class="check">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="m5 12.5 4.5 4.5L19 7"/>
                                </svg>
                            </span>
                            <div class="success-copy">
                                <strong>预约成功</strong>
                                <span>{{ email }} 已加入首批体验名单，请留意收件箱。</span>
                            </div>
                            <button class="link-btn" type="button" @click="reset">更换邮箱</button>
                        </div>
                    </transition>

                    <p class="form-hint" :class="{ 'is-error': error }">
                        {{ error || '我们会在 48 小时内发送邀请，不会发送任何营销邮件。' }}
                    </p>
                </div>
            </div>
        </div>
    </section>
</template>

<style scoped>
.cta-section {
    padding-top: 40px;
}
.cta-panel {
    position: relative;
    overflow: hidden;
    padding: 84px 32px 76px;
    border: 1px solid rgba(140,170,255,.16);
    border-radius: 28px;
    text-align: center;
    background:
        radial-gradient(circle at 50% 0%, rgba(124,92,255,.2), transparent 58%),
        linear-gradient(180deg, rgba(12,18,34,.9), rgba(5,8,16,.92));
    box-shadow: 0 40px 120px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.06);
}
.cta-aurora {
    position: absolute;
    left: 50%;
    top: -260px;
    width: 700px;
    height: 700px;
    transform: translateX(-50%);
    border-radius: 50%;
    background: radial-gradient(circle, rgba(34,211,238,.22), rgba(124,92,255,.12) 42%, transparent 68%);
    filter: blur(30px);
    pointer-events: none;
}
.cta-ring {
    position: absolute;
    top: 50%;
    width: 620px;
    height: 620px;
    transform: translate(-50%, -50%);
    pointer-events: none;
}
.cta-ring-a {
    left: 50%;
    animation: spin 60s linear infinite;
}
.cta-ring-b {
    left: 50%;
    animation: spin 34s linear infinite reverse;
}
.cta-content {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
}
.cta-content .ax-eyebrow {
    justify-content: center;
}
.cta-content h2 {
    margin: 20px 0 0;
    font-size: clamp(32px, 4.4vw, 58px);
    line-height: 1.12;
    letter-spacing: -.025em;
    font-weight: 700;
}
.cta-desc {
    max-width: 520px;
    margin: 20px 0 0;
    color: var(--ax-muted);
    font-size: 15px;
    line-height: 1.9;
}
.reserve-form {
    display: flex;
    align-items: center;
    gap: 10px;
    width: min(520px, 100%);
    margin-top: 36px;
}
.field {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 10px;
    height: 52px;
    padding: 0 16px;
    border: 1px solid rgba(140,170,255,.2);
    border-radius: 999px;
    background: rgba(3,6,14,.6);
    color: var(--ax-muted);
    transition: border-color .25s ease, box-shadow .25s ease;
}
.field:focus-within {
    border-color: rgba(34,211,238,.6);
    box-shadow: 0 0 0 4px rgba(34,211,238,.1);
}
.field.is-invalid {
    border-color: rgba(255,92,110,.6);
    box-shadow: 0 0 0 4px rgba(255,92,110,.1);
}
.field svg {
    flex: none;
    width: 18px;
    height: 18px;
}
.field input {
    flex: 1;
    min-width: 0;
    height: 100%;
    padding: 0;
    color: var(--ax-text);
    font-family: inherit;
    font-size: 14px;
    background: transparent;
    border: none;
    outline: none;
}
.field input::placeholder {
    color: rgba(140,160,195,.5);
}
.reserve-form .btn {
    flex: none;
    height: 52px;
    padding: 0 28px;
}
.form-hint {
    margin: 16px 0 0;
    color: rgba(140,160,195,.6);
    font-size: 12px;
    letter-spacing: .02em;
    transition: color .25s ease;
}
.form-hint.is-error {
    color: #ff7c8c;
}
.reserve-success {
    display: flex;
    align-items: center;
    gap: 16px;
    width: min(560px, 100%);
    margin-top: 36px;
    padding: 16px 20px;
    border: 1px solid rgba(34,211,238,.35);
    border-radius: 18px;
    background: rgba(34,211,238,.08);
    text-align: left;
}
.check {
    display: grid;
    place-items: center;
    flex: none;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: linear-gradient(140deg, #22d3ee, #7c5cff);
    color: #04060c;
    box-shadow: 0 0 24px rgba(34,211,238,.4);
}
.check svg {
    width: 20px;
    height: 20px;
}
.success-copy {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
}
.success-copy strong {
    font-size: 14px;
    color: #eaf2ff;
}
.success-copy span {
    color: var(--ax-muted);
    font-size: 12.5px;
}
.link-btn {
    flex: none;
    padding: 0;
    color: var(--ax-cyan);
    font-family: inherit;
    font-size: 12px;
    background: transparent;
    border: none;
    cursor: pointer;
    text-decoration: underline;
    text-underline-offset: 4px;
}
.swap-enter-active,
.swap-leave-active {
    transition: opacity .28s ease, transform .28s ease;
}
.swap-enter-from {
    opacity: 0;
    transform: translateY(8px);
}
.swap-leave-to {
    opacity: 0;
    transform: translateY(-6px);
}
@keyframes spin {
    to { transform: translate(-50%, -50%) rotate(360deg); }
}
@media (max-width: 640px) {
    .cta-panel {
        padding: 60px 18px 56px;
        border-radius: 22px;
    }
    .reserve-form {
        flex-direction: column;
        align-items: stretch;
    }
    .field,
    .reserve-form .btn {
        width: 100%;
    }
    .reserve-success {
        flex-wrap: wrap;
    }
}
</style>
