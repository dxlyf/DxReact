import { Card, Col, Row,Grid } from 'antd'
import { locale } from 'dayjs'
import {init,dataTool,registerTheme,registerLoading} from 'echarts'
import type {ChartView,SeriesModel,BarSeriesOption,ResizeOpts,SetOptionOpts,EChartsInitOpts,EChartsOption, EChartsType} from 'echarts'
import { use } from 'echarts/types/src/extension.js'
import { debounce } from 'lodash-es'
import { useEffect, useMemo, useReducer, useRef, useState } from 'react'
import useEchart from 'src/hooks/useEchart2'
const {useBreakpoint }=Grid
type BarDataItem={
    [key:string]:any
}
const lineDataSet:BarDataItem[]=[{
    name:'张三',
    age:1
},{
    name:'李四',
    age:0
}]

function delay(time:number){
    return new Promise((resolve)=>{
        setTimeout(()=>{
            resolve('')
        },time)
    })
}

const BarDemo=()=>{
     const [chartRef]=useEchart({
      request:async ()=>{
         //   await delay(2000)
           return lineDataSet
      },
      onOption:(data)=>{
          return {
              dataset:{
                dimensions:['name',{
                    name:'age',
                    displayName:'年龄(岁)'
                }],
                source:data??[]
              },
              xAxis:[{
                type:'category',
              }],
              yAxis:{
                type:'value',
                name:'年',
              //  min:0,
                max:(value)=>Math.min(Math.ceil(value.max/5)*5,5),
                minInterval:1,
             //   maxInterval:5,
                splitNumber:5,
               
              
              },
              series:[{type:'bar'}]
          }
      }
  })
  return <div ref={chartRef} style={{width:'100%',height:400}}></div>
}

const LineDemo=()=>{
     const [chartRef]=useEchart({
      //theme:null,
      request:async ()=>{
         //   await delay(2000)
           return lineDataSet
      },
      onOption:(data)=>{
          return {
              legend:{
                type:'',
                data:['年龄','得分']
              },
            //   axisPointer:{
            //     // show:true,
            //     // triggerTooltip:false,
            //     // triggerEmphasis:false,
            //     // type:'line'
            //   },
              tooltip:{
                 //formatter:'{a}:{b}::{c}'
              },
              xAxis:[{
                type:'category',
                data:['张三','李四']
              }],
              yAxis:[{
                type:'value'
              }],
              series:[{
                type:'line',
                name:'年龄',
                data:[1,0]
              },{
                type:'bar',
                name:'得分',
                data:[0,1]
              }]
          }
      }
  })
  return <div ref={chartRef} style={{width:'100%',height:400}}></div>
}
export default function Line(){

 
    const screens=useBreakpoint()
    const colProps=useMemo(()=>{
        const screenKey=Object.keys(screens).find((key)=>{ return screens[key as keyof typeof screens] as boolean})
         const config= ({
            xxl:8,//{span:3,offset:0,order:0,pull:0,push:0},// >=1660
            xl:12,// >=1200
            lg:12,// >=996
            md:24,// >=768
            sm:24,// >=576
            xs:24,// <576
           // xss:1,// <320
         })
         return config
    },[JSON.stringify(screens)])
    return <>
        <Row gutter={8} wrap>
            <Col {...colProps} >
            <Card title='折线图'>
                <LineDemo></LineDemo>
            </Card>
        
            </Col>
            <Col {...colProps} >
            <Card title='柱状图'>
               <BarDemo></BarDemo>
            </Card>
        
            </Col>
        </Row>
    </>
}