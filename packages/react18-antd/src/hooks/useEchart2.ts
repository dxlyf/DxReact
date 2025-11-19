import {init,registerLoading,registerTheme,registerPostInit} from 'echarts'
import type {ECharts,EChartsOption,SetOptionOpts,EChartsInitOpts} from 'echarts'
import { useEffect, useLayoutEffect,useRef,useState } from 'react'
import useMemoizedFn from './useMemoizedFn'
export type {
    EChartsOption
}
type UseEchatProps={
    theme?:string
    opts?:EChartsInitOpts
    autoResize?:boolean
    autoBind?:boolean,
    params?:any
    deps?:any[]
    onInit?:(instance:ECharts)=>void,
    request?:(params:any,instance:ECharts)=>Promise<any>,
    onOption:(data:any,instance:ECharts)=>EChartsOption
}
registerTheme('blue',{
    color: [ '#3491FA', '#14C9C9','#F53F3F', '#D91AD9', '#722ED1','#00B42A', '#F77234', '#FF7D00', '#F7BA1E', '#FADC19', '#9FDB1D','#165DFF', '#F5319D', '#23C09B', '#86909c'],
    backgroundColor:'#fff',
    title:{
        show:false,
    },
    grid:{
        //top:100
    },
    legend:{
        left:'right',
        top:'top'
    },
    // axisPointer:{
    //     show:true,
    //     triggerEmphasis:false,
    //     triggerTooltip:false,
    //     //type:'cross'
    // },
    tooltip:{
        show:true,
        trigger:'item',
    
       
    },
    toolbox:{
        show:true,
        feature:{
            saveAsImage:{
                title:'保存图片',
                type:'png',

            }
        }
    },
    bar:{
        label:{
            show:true,
            position:'top'
        }
    } as EChartsOption['series'],
    line:{
        // tooltip:{
        //      show:false,
        //      trigger:'item',
        //      triggerOn:'mousemove',
        // },
        // lineStyle:{
        //     width:1,
        //     type:'solid',
        //     color:'#165DFF'
        // }
    } as EChartsOption['series'],
    valueAxis:{
        axisTick:{show:true},
        axisLine:{
            show:true
        },
        splitArea:{
           show:false
        },
        splitLine:{
            show:true,
            lineStyle:{
                type:'dashed'
            }
        }
    } as EChartsOption['xAxis'],
    categoryAxis:{
        axisTick:{
            show:true
        }
        // axisLabel:{
        //     color:'#fff',
        //     fontSize:12,
        //     fontFamily:'PingFang SC'
        // },
        // axisLine:{
        //     lineStyle:{
        //         color:'rgba(255,255,255,.2)'
        //     }
        // },
        // splitLine:{
        //     show:true,
        //     lineStyle:{
        //         type:'dashed',
        //         color:'rgba(255,255,255,.1)'
        //     }
    } as EChartsOption['xAxis']

} as EChartsOption)

const emptyArray:any[]=[]
const useEchart=(props:UseEchatProps)=>{
    const {theme='blue',deps=emptyArray,autoBind=true,params:propParams,opts,autoResize=false,onInit:propOnInit,onOption:propGetOption,request:propRequest}=props
    const chartRef=useRef<HTMLDivElement>(null)
    const chartInstance=useRef<ECharts>()
    const updateChart=useMemoizedFn(async (params:any={},opts?:SetOptionOpts)=>{
         chartInstance.current!.showLoading()
         const data=await propRequest?.(params,chartInstance.current)
         const option=propGetOption(data,chartInstance.current)
         chartInstance.current!.setOption(option,opts) 
         chartInstance.current!.hideLoading() 
    })
    useLayoutEffect(()=>{
        if(chartInstance.current&&propParams){
            updateChart(propParams)
        }
    },deps)
    useEffect(()=>{
        if(chartRef.current){
          const instance=chartInstance.current=init(chartRef.current,theme,opts)
          propOnInit?.(instance)
          if(autoBind){
             updateChart(propParams)
          }
          return ()=>{
            instance.dispose()

          }
        }
    },[chartRef.current])
    useEffect(()=>{
         if(autoResize){
            const handleResize=()=>{
                const width=chartRef.current.clientWidth
                const height=chartRef.current.clientHeight
                if(width>0&&height>0){
                    chartInstance.current!.resize({
                        width,
                        height
                    })
                }
            }
            let animationId:ReturnType<typeof requestAnimationFrame>=null
            const observer=new ResizeObserver((entries)=>{
                if(animationId){
                    cancelAnimationFrame(animationId)
                    animationId=null
                }
                animationId=requestAnimationFrame(()=>{
                  handleResize()
               })
            })
            observer.observe(chartRef.current)
            handleResize()
            return ()=>{
               observer.disconnect()
            }
          }
    },[autoResize])
  
    return [chartRef,{updateChart,chartInstance}] as const
}
export default useEchart