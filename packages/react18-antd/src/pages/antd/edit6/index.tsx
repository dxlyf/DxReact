import {Tabs,Collapse, Form, Input, Button, Row, Col} from 'antd'
import type {GetProp,GetProps,GetRef} from 'antd'
import { debounce } from 'lodash-es'
import { useCallback, useEffect, useMemo } from 'react'
import {chunk} from 'src/utils/utils'
import {ProFormItemField} from '../components/Form/Item'
import ProSelect from '../components/Select'
          const a=debounce(async ()=>{
                console.log('execu')
                return 43
           },3000,{leading:false,trailing:true})

const Demo=()=>{

    const [form]=Form.useForm()

    const columns=chunk([{
            label:'国家',
            name:'country',
            valueType:'select',
           // required:true,
            fieldProps:{
                //options:[{value:'中国',label:'中国'},{value:'美国',label:'美国'}]
            },
            render(props:any){
                return <ProSelect serverFilter requestOptions={{
                   
                    request:async (params)=>{
                        const {keyword}=params
                        console.log('request',keyword)
                        return [{value:'中国',label:'中国'},{value:'美国',label:'美国'}].filter(d=>{
                            if(keyword===undefined){
                                return true
                            }
                            return d.label.includes(keyword)
                        })
                    }
                }} {...props}></ProSelect>
            }
            
    },{
            label:'省份',
            name:'province',
            valueType:'select',
           // required:true,
            fieldProps:{
                //options:[{value:'中国',label:'中国'},{value:'美国',label:'美国'}]
            },
            dependencies:['country'],
            render(props:any,form){
          
                const country=form.getFieldValue('country')
                     console.log('render',country)
                return <ProSelect   requestOptions={{
                    manualRequest:true,
                    dependencies:[country],
                    requestParams:{country},
                    request:async (params)=>{
                        console.log('params',params)
                        if(country=='中国'){
                            return [{value:'湖南',label:'湖南'},{value:'江西',label:'江西'},{value:'广东',label:'广东'}]
                        }else if(country==='美国'){
                            return [{value:'加州',label:'加州'}]
                        }
                        return []
                    }
                }} {...props}></ProSelect>
            }
            
    },{
        label:'申请日期',
        name:'applyDate',
        required:true,
        valueType:'dateRange',
        validateTipType:'popover'
    }],4).map((d,i)=>{
        return <Row key={i} gutter={16}>
            {d.map((col:any,k)=>{
                return <Col span={12} key={k}>
                    <ProFormItemField  {...col}></ProFormItemField>
                </Col>
            })}
        </Row>
    })
    const collapseItems=useMemo<GetProp<typeof Collapse,'items'>>(()=>{


        return [
            {
                key:'a',
                label:'基础表单信息',
                children:<>
                    {columns}
                </>
            }
        ]
    },[])
    const tabItems=useMemo<GetProp<typeof Tabs,'items'>>(()=>{

        return [{
            key:'a',
            label:'基本信息',
            children:<>
            <Collapse bordered={false} items={collapseItems} defaultActiveKey={collapseItems.map(d=>d.key as string)}></Collapse>
            </>
        },{
            key:'a2',
            label:'附件信息',
            children:<Test></Test>
        }]
    },[collapseItems])
    const handleFinish=useCallback<GetProp<typeof Form,'onFinish'>>(values=>{
           console.log('submit',values)
    },[])
    return <>
    <Form layout='vertical' form={form}  onFinish={handleFinish}>
        <Tabs items={tabItems} defaultActiveKey={tabItems[0].key}  style={{ background: '#fff' }}></Tabs>
        <Button htmlType='submit'>提交</Button>
    </Form>
    </>
}
function Test(){
    useEffect(()=>{
        console.log('挂载')
    },[])
    return <></>
}

export default Demo 