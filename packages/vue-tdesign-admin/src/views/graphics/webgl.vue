<script setup lang="ts">
    import { onMounted, ref } from 'vue'
    import { GLSLShaderSource,GLSLPrimitiveType,GLProgram } from 'src/views/graphics/engine/renderer/webgl/program'
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

        let GLTypeInfo=Object.create(null)
      
        Object.keys(gl.constructor.prototype).forEach((key) => {
            if(typeof gl[key] === 'number'){
                GLTypeInfo[key]=gl[key]
            }
        })
        console.log('GLTypeInfo',JSON.stringify(GLTypeInfo,null,2))

  
    })
</script>
<template>
        <canvas ref="canvasRef" width="500" height="500"></canvas>
</template>