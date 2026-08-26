<script setup lang="ts">
import { ref,shallowRef ,onMounted,onUnmounted} from 'vue';
import { init } from 'zrender';
import {Empty} from 'tdesign-vue-next'

const canvasref=shallowRef<HTMLCanvasElement>()

class TestExample{
    canvas:HTMLCanvasElement
    
    width:number
    height:number
    constructor(){
        
    }
    init(opts:{canvas:HTMLCanvasElement,type:string,width:number,height:number,dpr:number}){
        const {canvas,width,height,type='canvas',dpr=1}=opts
        this.canvas=canvas
        this.width=Math.round(width*dpr)
        this.height=Math.round(height*dpr)
        this.canvas.style.width=width+'px'
        this.canvas.style.height=height+'px'
    }
}
</script>

<template>
    <canvas ref="canvasref"></canvas>
    <t-empty>fdafds</t-empty>
</template>