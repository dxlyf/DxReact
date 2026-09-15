<script setup lang="ts">
import {ref,onMounted,onUnmounted,watch} from 'vue'
import {createDeviceWithAdapter, BufferUsage,BindingType,ShaderStage,mat3} from '@dxyl/gpu-device-api'
import {Stats,Renderer,Stage,Element} from '@dxyl/math2'
const canvasRef = ref<HTMLCanvasElement>()

onMounted(async ()=>{
    const context=await createDeviceWithAdapter({
        backend:'webgl2',
        canvas: canvasRef.value,
    })
    context.context.setSize(500,500,true)
    
    const mod=context.device.createShaderModule({
        label:'sdf',
        code:{
           vs:`
            layout(location=0) in vec2 aPosition;
            layout(std140) uniform MatricesBlock{
                mat3 uProjMatrix;
                mat3 uModelMatrix;
            };
            void main(){
                vec3 position =uProjMatrix*uModelMatrix * vec3(aPosition,1.);
                gl_Position = vec4(position.xy,0.,1.0);
            }
           `,
           fs:`
            out vec4 fragColor;
            void main(){
                vec4 color = vec4(1.0,0.0,0.0,1.0);
                fragColor = color;
            }
           ` 
        }
    })
  
    const encoder=context.device.createCommandEncoder()
    const vertices=new Float32Array([
        100,100,
        200,100,
        200,200,
    ])
    const buffer=context.device.createBuffer({
        label:'position',
        usage:BufferUsage.Vertex,
        size:vertices.byteLength
    })
    context.device.queue.writeBuffer(buffer,0,vertices)
   
    const projMatrix=mat3.create()
    const model=mat3.create()
    mat3.identity(projMatrix)
    mat3.identity(model)
    mat3.set(projMatrix,2/500,0,0,0,-2/500,0,-1,1,0)


    const blockData=new Float32Array(24)

    const copyMat3=(target:Float32Array,m:Float32Array,offset:number)=>{
        for(let i=0;i<3;i++){
            target[offset+i*4+0]=m[i*3+0]
            target[offset+i*4+1]=m[i*3+1]
            target[offset+i*4+2]=m[i*3+2]
            target[offset+i*4+3]=0
        }
      
    }
    copyMat3(blockData,projMatrix,0)
    copyMat3(blockData,model,12)
   
    const blockBuffer=context.device.createBuffer({
        label:'block',
        usage:BufferUsage.Uniform,
        size:blockData.byteLength,
    })
    context.device.queue.writeBuffer(blockBuffer,0,blockData)
    const groupLayout=context.device.createBindGroupLayout({
        entries:[
            {
                binding:0,
                type:BindingType.Uniform,
                visibility:ShaderStage.Fragment|ShaderStage.Vertex,
                name:'MatricesBlock',
            }
        ]
    })
    const group=context.device.createBindGroup({
        layout:groupLayout,
        entries:[
            {
                binding:0,
                resource:{
                    buffer:blockBuffer,
                    offset:0,
                    size:blockData.byteLength
                }
            }
        ]
    })
    const layoutPipe=context.device.createPipelineLayout({
        bindGroupLayouts:[groupLayout]
    })
      const pipeline=context.device.createRenderPipeline({
        label:'sdf',
        layout:layoutPipe,
        vertex:{
            module:mod,
            buffers:[
                {
                    arrayStride:8,
                    stepMode:'vertex',
                    attributes:[
                        {
                            shaderLocation:0,
                            format:'float32x2',
                            offset:0
                        }
                    ]
                }
            ]
        },  
        fragment:{
            module:mod
        },
        primitive:{
            topology:'triangle-list'
        },
        depthStencil:{
            format:null
        }
    })
    const pass=encoder.beginRenderPass({
        colorAttachments:[
            {
                view:context.context.getCurrentFrameTarget().view,
                loadOp:'clear',
                storeOp:'store',
                clearValue:[0.0,0.0,0.0,1.0],
            }
        ],
    
    })
    //WebGL2RenderingContext.prototype.scissor
   // pass.setViewport(0,0,750,700)
 //   pass.setScissorRect(0,0,750,750)
   // pass.setViewport(0,0,200,200)
    pass.setVertexBuffer(0,buffer,0,vertices.byteLength)
    pass.setBindGroup(0,group)
    pass.setPipeline(pipeline)
    pass.draw({
        vertexCount:3
    })
    pass.end()
    context.device.queue.submit([encoder.finish()])
})
</script>
<template>
    <canvas ref="canvasRef" width="500" height="500"></canvas>
</template>