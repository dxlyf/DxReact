import useEchart, { type EChartsOption } from 'src/hooks/useEchart2'


export default function WLTJChart() {
    const [echartRef] = useEchart({
        autoResize: true,
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
                title: {
                    show: true,
                    text: '各工程部门违例检控数量统计'
                },
                legend: {
                    orient:'vertical',
                    align:'left'
                },
                tooltip: {},
                xAxis: {
                    type: 'category',
                    name:'工程部门',
                    data: d.category,
                    axisLabel: {
                        rotate: 45,
                    },
                    nameLocation:'middle',
                    nameTextStyle:{
                        fontSize:16,
                        fontWeight:'bold',
                    }
                },
                yAxis: {
                    type: 'value',
                    name: '数量',
                    nameLocation:'middle',
                    nameTextStyle:{
                        fontSize:16,
                        fontWeight:'bold',
                    }
                },
                series: d.series.map((d) => {
                    return {
                        type: 'bar',
                        name: d.name,
                        data: d.data
                    } as EChartsOption['series']
                })
            }


        }
    })
    return <>
    <div ref={echartRef} style={{ width: '100%', height: 500 }}>

    </div></>
}