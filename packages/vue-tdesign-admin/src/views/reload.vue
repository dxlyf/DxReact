<script lang="ts">
import { computed, nextTick, onBeforeMount, onMounted, defineComponent } from 'vue'
import { useRoute, useRouter } from 'vue-router'

export default defineComponent({
    name: 'Reload',
    beforeRouteEnter(to, form, next) {
        console.log('beforeRouteEnter', to.query.redirect)
        next(function (vm) {
            vm.$router.replace(vm.redirect)
        })
    },
    setup() {
        const route = useRoute()
        const router = useRouter()
        /**
         * 用于强制刷新某个路由：
         * 1. 先跳转到空路由（/reload)
         * 2. 空路由跳转到目标路由（redirect）
         */
        //console.log('reload',route,route.name,'mate',route.meta)
        const redirect = route.query.redirect as string
        // if (redirect) {
        //     router.replace({
        //         path: redirect
        //     })
        // }
        const handleReturn = () => {
            router.replace({
                path: redirect
            })
        }
        return {
            redirect,
            handleReturn
        }
    }
})
</script>
<template>
 <div class="flex flex-col items-center justify-center h-full">
    <t-dialog header="切换">

    </t-dialog>
 </div>

</template>
