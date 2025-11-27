import { Card, Col, Row, Grid, Tabs, type GetProp } from 'antd'
import { locale } from 'dayjs'
import { init, dataTool, registerTheme, registerLoading } from 'echarts'
import type { ChartView, SeriesModel, BarSeriesOption, ResizeOpts, SetOptionOpts, EChartsInitOpts, EChartsOption, EChartsType } from 'echarts'
import { use } from 'echarts/types/src/extension.js'
import { debounce } from 'lodash-es'
import { useEffect, useMemo, useReducer, useRef, useState } from 'react'
import useEchart from 'src/hooks/useEchart2'

const { useBreakpoint } = Grid
type BarDataItem = {
  [key: string]: any
}
const lineDataSet: BarDataItem[] = [{
  name: '张三',
  age: 1
}, {
  name: '李四',
  age: 0
}]

function delay(time: number) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve('')
    }, time)
  })
}

const ScrollBarChart = () => {
  const [chartRef] = useEchart({
    autoBind: true,
    autoResize: true,
    request: async () => {
      return [{
        name: '我的FDA城字很长的标题',
        value: 10
      }, {
        name: '我的FDA城字很长的标题2',
        value: 2
      }, {
        name: '我的FDA城字很长的标题3',
        value: 4
      }, {
        name: '我的FDA城字很长的标题4',
        value: 8
      }, {
        name: '我的FDA城字很长的标题5',
        value: 3
      }, {
        name: '我的FDA城字很长的标题6',
        value: 5
      }, {
        name: '我的FDA城字很长的标题7',
        value: 8
      }, {
        name: '我的FDA城字很长的标题8',
        value: 1
      }, {
        name: '我的FDA城字很长的标题10',
        value: 5
      }, {
        name: '我的FDA城字很长的标题11',
        value: 2
      }, {
        name: '我的FDA城字很长的标题12',
        value: 6
      }, {
        name: '我的FDA城字很长的标题13',
        value: 2
      }]
    },
    onOption(data) {
      return {
        title: {
          text: 'Demo'
        },
        dataZoom: [
          {
            type: 'slider', // 滑动条型数据区域缩放组件
            xAxisIndex: 0, // 控制哪个xAxis，默认第一个
            left: '10%',   // 组件离容器左侧的距离
            right: '10%',  // 组件离容器右侧的距离
            bottom: 20,    // 组件离容器底部的距离，可调整以防止遮挡其他元素
            start: 0,      // 数据窗口范围的起始百分比，范围0~100[citation:5]
            end: 30        // 数据窗口范围的结束百分比，范围0~100[citation:5]
          },
          {
            type: 'inside', // 内置型数据区域缩放组件
            xAxisIndex: 0,
            start: 0,
            end: 30,
            zoomLock: true // 是否锁定选择区域（或叫做数据窗口）的大小。如果设置为true，则禁止缩放，只能平移[citation:10]。
          }
        ],
        tooltip: {},
        xAxis: {
          name: '分类',
          type: 'category',
          data: data.map(item => item.name)
        },
        yAxis: {
          name: '数量'
        },
        series: {
          type: 'bar',
          data: data.map(item => item.value)

        }
      }
    }
  })
  return <div ref={chartRef} style={{ width: '100%', height: 400 }}></div>
}

export default function ChartDemo() {
  const items: GetProp<typeof Tabs, 'items'> = [
    {
      key: '带滚动条的图表',
      label: '带滚动条的图表',
      children: <ScrollBarChart></ScrollBarChart>
    }
  ]
  return <Tabs items={items}></Tabs>
}