
export const getScrollTOp=()=>{
    return window.pageYOffset||document.documentElement.scrollTop||document.body.scrollTop
}
export const scrollIntoView=(el:Element)=>{
    el.scrollIntoView({
        behavior:'smooth',
        block:"center"
    })
}