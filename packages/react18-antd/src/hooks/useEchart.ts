import { faIRIntl } from '@ant-design/pro-components'
import {init,dataTool,registerTheme,registerLoading} from 'echarts'
import type {ChartView,SeriesModel,BarSeriesOption,ResizeOpts,SetOptionOpts,EChartsInitOpts,EChartsOption, EChartsType} from 'echarts'
import { debounce } from 'lodash-es'
import { useEffect, useReducer, useRef, useState } from 'react'


registerTheme('dx',{
    title:{
        show:false,
    },
    color: [
        '#5470C6', '#91CC75', '#EE6666', '#3CA272', '#FC8452', '#9A60B4',
        '#EA7CCC'
    ],
    legend:{
        top:'top',
        left:'right',
        textStyle:{
        }
    },
    grid:{
       
    },
    tooltip:{
        show:false
    },
    series:{
         tooltip:{
            show:true
        },
    },
    backgroundColor:'#fff',
  //  backgroundColor: 'rgba(0,0,0,0)',
    textStyle: {},
    // axisPointer:{
    //     show:true,
    //     type:'line'
    // },
    xAxis:{
        
    },
    valueAxis:{
        //show:true,
        axisLine:{
            show:true
        },
        axisTick:{
            show:true,
        },
                minorTick:{
            show:true,
        },
        splitLine:{
            lineStyle:{
                type:'dashed',
                color:'#333'
            }
        }

    },
    categoryAxis:{
        show:true,
        axisLine:{
            show:true,
            lineStyle:{
              //  type:'solid',//'solid''dashed''dotted'
              //  color:'#333'
            }
        },
        axisTick:{
            show:true,
            lineStyle:{
               // type:'solid'
            }
        },
        axisLabel:{

        },
        axisPointer:{
            show:true
        }
      
    },
    bar:{
        
    }
 

} as EChartsOption&{
    bar:EChartsOption
})

type ProEchartOptions=EChartsInitOpts&{
    useDefaultOptions?:boolean
    dom:HTMLDivElement,
    theme?:string,
}
type ProEchartRequestHandle<Data>=(params:any)=>Promise<Data>
type ProEchartCallbacks<Data>={
        onRequestStart?:(instance:ProEchart<Data>,params:any)=>void
        onRequest?:ProEchartRequestHandle<Data>
        onRequestSuccess?:(instance:ProEchart<Data>,data:Data)=>void 
        onRequestError?:(instance:ProEchart<Data>,error:any)=>void 
        onRequestComplete?:(instance:ProEchart<Data>)=>void
    
}
class ProEchart<Data>{
    options:ProEchartOptions
    data:Data
    echart:EChartsType
    resizeObserver:ResizeObserver
    callbacks:ProEchartCallbacks<Data>={}
    constructor(){
  
    }
    init(options:ProEchartOptions){
        const {useDefaultOptions=true,dom,theme=null,...initOptions}=options
        this.options={
            useDefaultOptions,
            dom,
            theme,
            ...initOptions
        }
        this.echart=init(dom,theme,initOptions)
        this.resize=debounce(this.resize.bind(this))
        if(options.width==undefined&&options.height==undefined){
            this.initResize()
        }
    }
    use(callbacks:ProEchartCallbacks<Data>){
        Object.assign(this.callbacks,callbacks)
    }
    async request(params:any){
        try{
            this.callbacks.onRequestStart?.(this,params)
            const data=await this.callbacks.onRequest?.(params)
            this.data=data
            this.callbacks.onRequestSuccess?.(this,data)
        }catch(e){
            this.callbacks.onRequestError?.(this,e)
        }finally{
            this.callbacks.onRequestComplete?.(this)
        }
    }
    dispose(){
        if(this.resizeObserver){
            this.resizeObserver.disconnect()
            this.resizeObserver=null
        }
        this.echart.dispose()
    }
    initResize(){
        const resizeObserver=this.resizeObserver=new ResizeObserver((entries)=>{
            for(let entry of entries){
                if(entry.target===this.options.dom){
                    this.resize()
                }
            }
        })
        resizeObserver.observe(this.options.dom)
        
    }
    getDefaultOptions(options:EChartsOption):EChartsOption{
        return {
            title:{
                ...(options.title??{}),
            },
            tooltip:{
                trigger:'axis',
                axisPointer:{
                    type:'cross',
                    label:{
                        backgroundColor:'#6a7985'
                    }
                },
                ...(options.tooltip??{}),
            },
            legend:{
                 ...(options.legend??{}),
            },
            grid:{
                left:'3%',
                right:'4%',
                bottom:'3%',
                containLabel:true,
                ...(options.grid??{}),
            },
            xAxis:Array.isArray(options.xAxis)?options.xAxis:[{
                type:'category',
                ...(options.xAxis??{}),
            }]  as EChartsOption['xAxis'],
            yAxis:Array.isArray(options.yAxis)?options.yAxis:[{
                type:'category',
                ...(options.yAxis??{}),
            }] as EChartsOption['yAxis'],
        }
    }
    /**
     * @params {setOptions} 
     *  notMerge 可选。是否不跟之前设置的 option 进行合并。默认为 false。即表示合并。合并的规则，详见 组件合并模式。如果为 true，表示所有组件都会被删除，然后根据新 option 创建所有新组件。
        replaceMerge 可选。用户可以在这里指定一个或多个组件，如：xAxis, series，这些指定的组件会进行 "replaceMerge"。如果用户想删除部分组件，也可使用 "replaceMerge"。详见 组件合并模式。
        lazyUpdate 可选。在设置完 option 后是否不立即更新图表，默认为 false，即同步立即更新。如果为 true，则会在下一个 animation frame 中，才更新图表。
        silent 可选。阻止调用 setOption 时抛出事件，默认为 false，即抛出事件。
     */
    setOption(options:EChartsOption,setOptions?:SetOptionOpts){
        this.echart.setOption(options,setOptions)
    }
    resize(options?:ResizeOpts){
        this.echart.resize(options)
    }
    showLoading(){
        this.echart.showLoading()
    }
    hideLoading(){
        this.echart.hideLoading()
    }
}
type UseEchartProps<Data>={
    // 手动
    manualRequest?:boolean
    autoSetOptions?:boolean,
    width?:number|'auto',
    height?:number|'auto',
    request:ProEchartRequestHandle<Data>,
    onOption:(data:Data|null,instance:ProEchart<Data>)=>EChartsOption
    deps?:any[]
    params?:any
}
const useEchart=<Data=any>(props:UseEchartProps<Data>)=>{
        const {manualRequest=false,autoSetOptions=true,params={},deps=[],width,height}=props
        const chartRef=useRef<HTMLDivElement>(null)

        const [instance,setInstance]=useState(()=>{
            return new ProEchart<Data>()
        })
        const [options,setOptions]=useState<EChartsOption>(()=>{
            return props.onOption(undefined,instance)
        })
        instance.use({
            onRequest:props.request,
            onRequestStart:(instance)=>{
                instance.showLoading()
            },
            onRequestSuccess:(instance,data)=>{        
                if(autoSetOptions){
                    instance.setOption(props.onOption(data,instance))
                }
                setOptions(options)  
            },
            onRequestComplete:(instance)=>{
                instance.hideLoading()
            }
        })
        useEffect(()=>{
             instance.init({
                dom:chartRef.current!,
                devicePixelRatio:window.devicePixelRatio,
                width,
                height,
                theme:'dx',
                renderer:'canvas'
             })
            instance.setOption(options)
            return ()=>{
                instance.dispose()
            }
        },[])
        useEffect(()=>{
            if(Number.isFinite(width)&&Number.isFinite(height)){
                instance.resize({
                    width,
                    height
                })
            }
        },[width,height])
        useEffect(()=>{
            if(!manualRequest){
                instance.request(params)
            }
        },deps)
        return [chartRef,{options,instance}] as const
}

export default useEchart