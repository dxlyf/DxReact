<script  lang="ts">
    import { useRouter } from 'vue-router'
    import { defineComponent } from 'vue'
   // const router=useRouter()

    // const dispose= router.beforeEach((to, from, next) => {
    //     next((d)=>{
    //         console.log('refresh',from)
    //         d.$router.replace(from)
    //     })
    // })
    export default defineComponent({
        name:'Refresh',
        beforeRouteEnter (to, from, next) {
            next(vm => {
              //  console.log('refresh',from)
                // 通过 `vm` 访问组件实例
                vm.$router.replace(from.path)
            })
        },
        setup(){
            return {}
        }
    })

</script>
<template>

</template>