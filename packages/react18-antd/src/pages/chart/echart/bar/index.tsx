import { Card, Col, Row,Grid } from 'antd'
import { locale } from 'dayjs'
import {init,dataTool,registerTheme,registerLoading} from 'echarts'
import type {ChartView,SeriesModel,BarSeriesOption,ResizeOpts,SetOptionOpts,EChartsInitOpts,EChartsOption, EChartsType} from 'echarts'
import { use } from 'echarts/types/src/extension.js'
import { debounce } from 'lodash-es'
import { useEffect, useMemo, useReducer, useRef, useState } from 'react'
import useEchart from 'src/hooks/useEchart'
const {useBreakpoint }=Grid
type BarDataItem={
    [key:string]:any
}
const barDataSet:BarDataItem[]=[{
    name:'苹果',
    '一月':7.8,
    '二月':8.2,
    '三月':8.5,
    '四月':8.7,
    '五月':8.9,
},{
    name:'橙子',
     '一月':4.8,
    '二月':3.2,
    '三月':4.5,
    '四月':6.7,
    '五月':7.9,
},{
    name:'桃子',
    '一月':7.8,
    '二月':4.2,
    '三月':5.5,
    '四月':5.7,
    '五月':3.9,
},{
    name:'梨子',
    '一月':3.8,
    '二月':4.2,
    '三月':3.5,
    '四月':3.7,
    '五月':5.9,
}]

function delay(time:number){
    return new Promise((resolve)=>{
        setTimeout(()=>{
            resolve('')
        },time)
    })
}

export default function Bar(){

  const [chartRef]=useEchart({
      request:async ()=>{
            await delay(2000)
           return barDataSet
      },
      onOption:(data)=>{
          return {
              dataset:{
                dimensions:['name','一月','二月'],
                source:data??[]
              },
              xAxis:[{
                type:'category',
              }],
              yAxis:[{
                type:'value',
                name:'价格(元)',
              
              }],
              series:[{type:'bar'},{type:'bar'}]
          }
      }
  })
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
         console.log('config[screenKey]',config[screenKey])
         return config
    },[JSON.stringify(screens)])
    return <>
        <Row gutter={8} wrap>
            <Col {...colProps} >
            <Card title='违例检控数据'>
                <div ref={chartRef} style={{width:'100%',height:'100%',minWidth:100,minHeight:300}}></div>
            </Card>
        
            </Col>
        </Row>
    </>
}