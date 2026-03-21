<script setup lang="ts">
import { WinkIcon } from 'tdesign-icons-vue-next';
import { onMounted, reactive, ref, shallowRef } from 'vue';


const elementRef=shallowRef<HTMLDivElement>()

const drawBoxDimension=()=>{
    const element=elementRef.value
    const width=element.clientWidth
    const height=element.clientHeight
}
const state=reactive({
    width:0,
    height:0,
    border:{
        left:0,
        top:0,
        right:0,
        bottom:0,
    },
    offset:{
        left:0,
        top:0
    },
    padding: {
        top: 0,
        left: 0,
        bottom: 0,
        right: 0
    },
    margin:{
        top: 0,
        left: 0,
        bottom: 0,
        right: 0
    }
})
type GraphicElement={
    props:any
    type:'path'|'rect'|'text'|'circle',
        text?:string
}
type Graphic={
    left:number,
    top:number,
    viewWidth:number,
    viewHeight:number,
    children?:GraphicElement[],

}
const elements=ref<Graphic[]>([])
// onMounted(()=>{
//     const rect=elementRef.value.getBoundingClientRect()
// })
const handleMove=(e)=>{
    const rect=elementRef.value.getBoundingClientRect()
    const css=window.getComputedStyle(elementRef.value)
    const borderLeftWidth=parseFloat(css.getPropertyValue('border-left-width'))
    const borderRightWidth=parseFloat(css.getPropertyValue('border-right-width'))
    const borderTopWidth=parseFloat(css.getPropertyValue('border-top-width'))
    const borderBottomWidth=parseFloat(css.getPropertyValue('border-bottom-width'))
    const paddingLeft=parseFloat(css.getPropertyValue('padding-left'))
    const paddingRight=parseFloat(css.getPropertyValue('padding-right'))
    const paddingTop=parseFloat(css.getPropertyValue('padding-top'))
    const paddingBottom=parseFloat(css.getPropertyValue('padding-bottom'))

    const svgRoot:Graphic={
        left:0,
        top:0,
        viewWidth:window.innerWidth,
        viewHeight:window.innerHeight,
        children:[]
    }
    svgRoot.children.push({
       // outer width
        props:{
            x:rect.left,
            y:rect.top,
            width:rect.width,
            height:rect.height,
            fill:'red'
        },
        type:'rect'
    },{
        // inner width 不包含border
        props:{
            x:rect.left+borderLeftWidth,
            y:rect.top+borderTopWidth,
            width:rect.width-borderLeftWidth-borderRightWidth,
            height:rect.height-borderTopWidth-borderBottomWidth,
            fill:'#000'
        },
        type:'rect'
    },{
        //  width 不包含border,padding
        props:{
            x:rect.left+borderLeftWidth+paddingLeft,
            y:rect.top+borderTopWidth+paddingTop,
            width:rect.width-borderLeftWidth-borderRightWidth-paddingLeft-paddingRight,
            height:rect.height-borderTopWidth-borderBottomWidth-paddingTop-paddingBottom,
            fill:'#ffff00'
        },
        type:'rect'
    })
    svgRoot.children.push({
        props:{
            x:rect.right+10,
            y:rect.top+10,
            fill:'red'
        },
        text:'outer',
        type:'text'
    })
    elements.value=[svgRoot]
}
const handleLeave=()=>{
    elements.value=[]
}
</script>

<template>
     <div ref="elementRef" class="box-dimension" @mouseleave="handleLeave" @mouseenter="handleMove"></div>
     <svg v-for="(svg) in elements" :style="{top:svg.top+'px',left:svg.left+'px',pointerEvents:'none',position:'absolute',zIndex:1000}"  :width="svg.viewWidth" :height="svg.viewHeight">
        <template v-for="(child,i) in svg.children" :key="i">
            <rect v-if="child.type=='rect'" v-bind="child.props"></rect>
            <path v-if="child.type=='path'" v-bind="child.props"></path>
            <circle v-if="child.type=='circle'" v-bind="child.props"></circle>
            <text v-if="child.type=='text'" v-bind="child.props">{{ child.text }}</text>
        </template>
     </svg>
</template>

<style scoped lang="scss">
.box-dimension {
    border: 10px solid #000000;
    width: 100px;
    height: 100px;
    margin-top: 100px;
    margin-left: 100px;
    padding: 20px;
}
</style>
