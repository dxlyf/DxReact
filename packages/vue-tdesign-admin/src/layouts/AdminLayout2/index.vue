<script setup lang="ts">
import { ref } from 'vue';
import SideMenu from './SideMenu.vue'
import NavHeader from './NavHeader.vue'

const collapsed = ref(false)
</script>

<template>

    <div class="f2-layout" :class="{ 'f2-layout-collapsed': collapsed }">
        <header class="f2-main-header">
            <NavHeader />
        </header>
        <div class="f2-main">
            <aside class="f2-aside">
                <SideMenu v-model:collapsed="collapsed" />
            </aside>
            <main class="f2-main-content">
                <router-view />
            </main>
        </div>
    </div>
</template>
<style>
.f2-layout {
    min-height: 100vh;
    background-color: #f5f5f5;
    --f2-aside-width: 232px;
}

.f2-layout.f2-layout-collapsed {
    --f2-aside-width: 64px;
}

.f2-layout .f2-aside {
    width: var(--f2-aside-width);
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    padding-top: 56px;
    box-sizing: border-box;
    background-color: #fff;
    transition: width 0.3s cubic-bezier(0, 1, 0, 1);
    z-index: 99;
    box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
    /* box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1); */
}

.f2-layout .f2-main {
    margin-left: var(--f2-aside-width);
    transition: margin-left 0.3s cubic-bezier(0, 1, 0, 1);
    padding-top: 56px;
}

.f2-layout .f2-main-header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 56px;
    z-index: 100;
    box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
}

.f2-layout .f2-main-content {
    padding: 20px;

}
</style>