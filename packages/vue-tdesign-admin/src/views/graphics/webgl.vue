<script setup lang="ts">
    import { onMounted, ref } from 'vue'
    import { GLSLShaderSource,GLProgram } from 'src/views/graphics/engine/renderer/webgl'
    const canvasRef = ref<HTMLCanvasElement>()

   

    onMounted(() => {
        const gl = canvasRef.value?.getContext('webgl2')
        if (!gl) {
            return
        }
        const program = GLProgram.getProgram(gl,{
            vertexShader:`#version 300 es
            layout(location=0) in vec2 aPosition;
            uniform struct Lights{
                vec3 light;
                vec3 color;
                float intensity[4];
            } lights;
            uniform MatriceBlock{
                mat4 model;
                mat4 view;
                mat4 projection;
            } matrices;
            uniform Lights plotLights[2];
            out vec3 vLight;
            void main(){
                vLight = lights.light*plotLights[1].intensity[0];
                gl_Position = vec4(aPosition,0.,1.0);
            }
            `,
            fragmentShader:`#version 300 es
            precision highp float;
            uniform vec3 uColor;
            out vec4 fragColor;
            in vec3 vLight;
            void main(){
                vec4 color = vec4(uColor,1.0);
                fragColor = color;
            }
            `,
        })

        console.log('attributes',program.attributes)
        console.log('uniforms',program.uniforms)
        console.log('unifromBlocks',program.unifromBlocks)

  
    })
</script>
<template>
        <canvas ref="canvasRef" width="500" height="500"></canvas>
</template>