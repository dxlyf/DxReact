import { Col, Radio, Row } from 'antd'
import useEchart, { type EChartsOption } from 'src/hooks/useEchart2'


export default function WLTJChart() {
    const [echartRef] = useEchart({
        autoResize: true,
        theme:null,
        request: async () => {
            return {
                category: ['基础工程', '医疗工程', '基建工程', '装修工程', '其他工程'],
                series: [
                    {
                        name: '安全违例',
                        data: [1, 5, 6, 3, 8]
                    },
                    {
                        name: '环保违例',
                        data: [4, 2, 2, 3, 6]
                    },
                    {
                        name: '蚊虫违例',
                        data: [5, 4, 3, 1, 2]
                    }
                ]
            }
        },
        onOption(d) {

            return {
                backgroundColor:'#fff',
                color:['#ff8855','#00ccaa','#aaaaff'],
                title: {
                    show: false,
                    text: '各工程部门违例检控数量统计'
                },
                legend: {
                   // orient:'vertical',
                    align:'left',
                    top:'top',
                    left:'center'
                },
                grid:{
                    left:40,
                    right:40
                },
                tooltip: {},
                xAxis: {
                    type: 'category',
                    //name:'工程部门',
                    data: d.category,
                    axisLabel: {
                     //   rotate: 45,
                    },
                    nameLocation:'middle',
                    nameTextStyle:{
                        fontSize:16,
                        fontWeight:'bold',
                    },
                    axisLine:{
                        lineStyle:{
                            color:'#DBDBDB'
                        }
                    }
                },
                yAxis: {
                    type: 'value',
                    //name: '数量',
                    nameLocation:'middle',
                    nameTextStyle:{
                        fontSize:16,
                        fontWeight:'bold',
                    },
                    splitLine:{
                        lineStyle:{
                            color:'#DBDBDB'
                        }
                    }
                },
                series: d.series.map((d) => {
                    return {
                        type: 'bar',
                        name: d.name,
                        data: d.data,
                        label:{
                            show:true,
                            position:'top'
                        }
                    } as EChartsOption['series']
                })
            }


        }
    })
    return <>
    <div ref={echartRef} style={{ width: '100%', height: 500 }}>

    </div></>
}