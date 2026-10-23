import { onMounted, onUnmounted, type Ref } from 'vue'

/**
 * 容器内所有带 data-reveal 属性的元素在进入视口时添加 is-visible 类，
 * 具体的过渡效果由 site.vue 里的全局样式定义。
 * data-reveal 的值用作延迟序号（0 开始），每级 80ms。
 * @param root 页面/区块根元素
 */
export function useReveal(root:Ref<HTMLElement|undefined|null>){
    let observer:IntersectionObserver|undefined
    onMounted(()=>{
        const el=root.value
        if(!el){
            return
        }
        const items=el.querySelectorAll<HTMLElement>('[data-reveal]')
        // 不支持 IntersectionObserver 时直接展示，避免内容不可见
        if(!('IntersectionObserver' in window)){
            items.forEach(item=>item.classList.add('is-visible'))
            return
        }
        observer=new IntersectionObserver(entries=>{
            for(const entry of entries){
                if(!entry.isIntersecting){
                    continue
                }
                const target=entry.target as HTMLElement
                target.classList.add('is-visible')
                observer?.unobserve(target)
                // 进场结束后清掉延迟，避免影响元素自身的 hover 过渡
                const delay=Math.min(Number(target.dataset.reveal)||0,8)*80
                window.setTimeout(()=>{
                    target.style.transitionDelay=''
                },delay+800)
            }
        },{threshold:0.12,rootMargin:'0px 0px -8% 0px'})
        items.forEach(item=>{
            const delay=Number(item.dataset.reveal)||0
            item.style.transitionDelay=`${Math.min(delay,8)*80}ms`
            observer!.observe(item)
        })
    })
    onUnmounted(()=>observer?.disconnect())
}
