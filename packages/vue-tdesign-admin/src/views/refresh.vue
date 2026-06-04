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
        beforeRouteEnter(to, from, next) {
          //  console.log('to',from.fullPath)a
          console.log('refresh',from.path)
            next(vm => {
               // console.log('form',from.fullPath)
              //  console.log('refresh',from)
                // 通过 `vm` 访问组件实例
                vm.$router.replace({
                path: from.path,
                query: { ...from.query, _t: Date.now() } // 添加时间戳强制刷新
               })
            })
        },
        setup(){
            return {}
        }
    })

</script>
<template>
    <div>
        <h1>刷新</h1>
    </div>
</template>