<script setup lang="ts">
    import { onMounted, ref } from 'vue'
    import { GLSLShaderSource,GLSLPrimitiveType,GLProgram } from '@/views/graphics/engine/renderer/webgl/GLProgram'
    const canvasRef = ref<HTMLCanvasElement>()

    const vertGLSL = new GLSLShaderSource('basic_vert')
    const fragGLSL = new GLSLShaderSource('basic_frag')
    vertGLSL
    .version(300)
    .defineAttribute('vec2','aPosition')
    .defineUniformBlock('MatricesBlock',[
        ['mat4','uMatrices'],
        ['vec3','uType'],
    ])
    .defineMain(`
        vec3 position = vec3(aPosition,0.0);
        gl_Position = vec4(position,1.0);
    `);

    fragGLSL.version(300)
    .definePrecision('float','highp')
    .defineUniform('vec3','uColor')
    .defineVarying('vec4','fragColor')
    .defineMain(`
        vec4 color = vec4(uColor,1.0);
        fragColor = color;
    `)

    onMounted(() => {
        const gl = canvasRef.value?.getContext('webgl2')
        if (!gl) {
            return
        }
        const program = GLProgram.getProgram(gl,{
            vertexShader:vertGLSL.toString(),
            fragmentShader:fragGLSL.toString(),
        })
        program.fetchActiveProgram()
        console.log('uniforms',program.uniforms)

  
    })
</script>
<template>
        <canvas ref="canvasRef" width="500" height="500"></canvas>
</template>