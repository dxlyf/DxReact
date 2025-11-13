import {Tabs,Collapse, Form, Input, Button, Row, Col} from 'antd'
import type {DatePicker, GetProp,GetProps,GetRef} from 'antd'
import { debounce } from 'lodash-es'
import { useCallback, useEffect, useMemo } from 'react'
import {chunk} from 'src/utils/utils'
import {ProFormItemField, type ProFormItemFieldProps} from '../components/Form/Item'
import ProSelect from '../components/Select'
 import {request} from 'src/utils/request'
import dayjs, { type Dayjs} from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { info } from 'console'
 dayjs.extend(utc)
 function delay(wait:number) {
    return new Promise((resolve)=>{
        setTimeout(resolve,wait)
    })
}
const Demo=()=>{

    const [form]=Form.useForm()

    const buildMonthTable=(month:Dayjs)=>{
        let result:any[]=[]
        if(month){
            const days=month.daysInMonth()
          //  const obj=month.toObject()
            const start=month.startOf('month')
            const end=month.endOf('month')
            const diffDays=end.diff(start,'day')+1
            for(let i=0,cur=start.clone();i<diffDays;i++){
                result.push({
                    month:cur.format('YYYY年MM月'),
                    date:cur.format('YYYY-MM-DD'),
                    count:undefined
                })
                cur=cur.add(1,'day')
            }
            form.setFieldsValue({
                monthTable:result
            })
        }else{
              form.setFieldsValue({
                monthTable:[]
            })
        }
    }
    const columns=chunk([{
        label:'用户',
        name:'user',
        valueType:'text',
        fieldProps:{},
        initialValue:26,
        //required:true,
        render(props:any,form){
            return <ProSelect unmatchShow label='于明' {...props} serverFilter placeholder='请选择' requestOptions={{
                debounceWaitTime:100,
                request:async ({keyword})=>{
               // await delay(2000)
                const res= await request({
                    url:'/users',
                    method:'post',
                    data:{
                        keyword:keyword
                    }
                })
                return res.data.map(d=>({value:d.id,label:d.name}))
            }}}>
            </ProSelect>
    }
},{
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
                        await delay(1000)
                        return [{value:'中国',label:'中国'},{value:'美国',label:'美国'},{value:'俄罗斯',label:'俄罗斯'}].filter(d=>{
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
       // required:true,
        valueType:'dateRange',
        validateTipType:'popover'
    },{
        name:'upload',
        label:'图片',
        valueType:'proUpload',
        //required:true,
        fieldProps:{
            limit:{
                size:10,
                types:['.png','.jpeg','.jpg']
            }
        }
    },{
        label:'utc日期',
        name:'utfDate',
       // required:true,
        valueType:'date'
    },{
        label:'utc格式化',
        name:'utfDateFormat',
        dependencies:['utfDate'],
        children({form,formItemProps}){
            const utfDate=form.getFieldValue('utfDate')
            return <Form.Item label={formItemProps.label}>
                <Input value={utfDate?.utc().toISOString()}></Input>
            </Form.Item>
        }
    },{
        label:'月份',
        name:'month',
        valueType:'date',
        fieldProps:{
            format:'YYYY年MM月',
            picker:'month',
            onChange(value){
                       buildMonthTable(value)
            }
        } as GetProps<typeof DatePicker>
    },{
        label:'月份统计表格',
        name:'monthTable',
        valueType:'editable',
        fieldProps:{
            name:'monthTable',
            columns:[{
                title:'月份',
                dataIndex:'month',
                width:200,
            },{
                title:'日期',
                dataIndex:'date',
                width:200
            },{
                title:'人数',
                dataIndex:'count',
                editable:true,
                valueType:'integer'
            }]
        },
        colProps:{
            span:24
        }
    }] as ProFormItemFieldProps[],4).map((d,i)=>{
        return <Row key={i} gutter={16}>
            {d.map((col:any,k)=>{
                const {colProps={},...restProps}=col
                return <Col span={12} {...colProps} key={k}>
                    <ProFormItemField  {...restProps}></ProFormItemField>
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
       const handleFinish=useCallback<GetProp<typeof Form,'onFinish'>>(values=>{
           console.log('submit',values)
    },[])
    const tabItems=useMemo<GetProp<typeof Tabs,'items'>>(()=>{

        return [{
            key:'a',
            label:'基本信息',
            children:<>
                <Form layout='vertical' name='jb' form={form}  onFinish={handleFinish}>
            <Collapse bordered={false} items={collapseItems} defaultActiveKey={collapseItems.map(d=>d.key as string)}></Collapse>
           </Form>
            </>
        },{
            key:'b',
            label:'其它',
            children:<>
                <Form layout='vertical' name='jt' form={form}  onFinish={handleFinish}>
                <Form.Item name={'other'} label='其它'>
                    <Input></Input>
                </Form.Item>
           </Form>
            </>
        },{
            key:'a2',
            label:'附件信息',
            children:<Test></Test>
        }]
    },[collapseItems])
    useEffect(()=>{
        // form.setFieldsValue({
        //     user:26,

        // })
    },[])
    return <>

        <Tabs items={tabItems} defaultActiveKey={tabItems[0].key}  style={{ background: '#fff' }}></Tabs>
        <Button onClick={async ()=>{
            const values=await form.validateFields()
            console.log('values',values)
        }}>提交</Button>
  
    </>
}
function Test(){
    useEffect(()=>{
        console.log('挂载')
    },[])
    return <></>
}

export default Demo 