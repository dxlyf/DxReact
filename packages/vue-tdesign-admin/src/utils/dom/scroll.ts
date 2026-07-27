
export const getScrollTOp=()=>{
    return window.pageYOffset||document.documentElement.scrollTop||document.body.scrollTop
}
export const scrollIntoView=(el:Element)=>{
    el.scrollIntoView({
        behavior:'smooth',
        block:"center"
    })
}
export function findScrollElement(targetEl:HTMLElement):HTMLElement|Window{
    // 1. 向上查找第一个可滚动的祖先元素
    let container = targetEl.parentElement;
    while (container) {
        const style = window.getComputedStyle(container);
        const overflowY = style.overflowY;
        // 判断是否能垂直滚动
        if (overflowY === 'auto' || overflowY === 'scroll') {
            // 进一步检查实际内容是否溢出 (避免找到虽然设置了auto但内容没溢出的容器)
            if (container.scrollHeight > container.clientHeight) {
                break; // 找到了可滚动的容器
            }
        }
        container = container.parentElement;
    }

    // 2. 如果没找到任何容器，降级使用 window (body/html)
    if (!container) {
        return window
    }
    return container
}
//手动向上查找“可滚动”容器（精准控制）
function scrollToElement(targetEl:HTMLElement) {
    
    const container=findScrollElement(targetEl)
    // 3. 计算目标元素相对于容器的偏移量，执行滚动
    const rect = targetEl.getBoundingClientRect();
  
    
    // 如果是 window，滚动到目标元素的绝对位置
    if (container === window) {
        window.scrollTo({
            top: rect.top + window.pageYOffset - 100, // 减100是为了留点边距
            behavior: 'smooth'
        });
    } else {
        const containerRect = (container as HTMLElement).getBoundingClientRect();
        // 如果是普通容器，计算相对距离
        container.scrollTo({
            top: (container as HTMLElement).scrollTop + (rect.top - containerRect.top) - 100,
            behavior: 'smooth'
        });
    }
}

