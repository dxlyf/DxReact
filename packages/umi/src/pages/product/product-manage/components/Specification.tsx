
import React, { useState,useCallback, useRef } from 'react'
import {Select,Form,Tag,Row,Button,Space,Card} from 'antd'
import {useControlledValue} from 'ahooks'
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';

const formProps: Record<string, any> = {
    wrapperCol: {
        lg: { span: 10 },
        md: { span: 10 }
    },
    labelCol: {
        lg: { span: 4 },
        md: { span: 4 }
    },
    layout: "horizontal"
}

let Specification:React.FC<any>=React.memo((props)=>{


    let [specifications,setSpecifications]=useControlledValue(props,{
        defaultValue:[{id:1,name:"重量",properties:[{id:1,name:"2磅"}]}]
    })
    let [specList,setSpecList]=useState(()=>{
        return [{id:1,name:"重量",properties:[{id:1,name:"2磅"},{id:2,name:"3磅"}]},
            {id:2,name:"单位",properties:[{id:1,name:"2磅"},{id:2,name:"3磅"}]}]
    })
    let renderSpecsFormList=useCallback(()=>{
      
        return <Form.List name="specs" initialValue={specifications}>
            {
                (fields,{add,remove},{errors})=>{
                    return fields.map(field=>{
                        console.log('field',field)
                        return <Form.Item label="规格名称">
                        <Form.Item noStyle name={[field.name,'name']} fieldKey={[field.fieldKey,'name']}>
                            <Select style={{width:'60%'}}>{specList.map(d=>{
                            return <Select.Option key={d.id} value={d.id}>{d.name}</Select.Option>
                            })}</Select>
                        </Form.Item>
                        <Space style={{marginLeft:10}}>
                        <a>添加属性</a>
                        <MinusCircleOutlined onClick={onRemoveSpec.bind(null,field)} style={{marginLeft:10}}></MinusCircleOutlined>
                        </Space>
                    </Form.Item>
                    })
                }
            }
            </Form.List>
    },[specList])

    const onRemoveSpec=useCallback((spec)=>{

    },[])
    let renderSpecs=useCallback(()=>{
        return specifications?.map((spec,index)=>{
            let currentSpec:any=specList.find(d=>d.id==spec.id)
            return <Card key={spec.id}>
                <Form.Item label="规格名称" wrapperCol={formProps.wrapperCol} labelCol={formProps.labelCol} >
                <Form.Item noStyle name={['specs',index,'name']} initialValue={spec.id}><Select style={{width:'60%'}}>{specList.map(d=>{
                    return <Select.Option key={d.id} value={d.id}>{d.name}</Select.Option>
                })}</Select></Form.Item>
                <Space style={{marginLeft:10}}>
                <MinusCircleOutlined onClick={onRemoveSpec.bind(null,spec)} style={{marginLeft:10}}></MinusCircleOutlined>
                </Space>
                </Form.Item>
                <Form.Item label='规格值' name={['specs',index,'properties']} initialValue={spec.properties.map(d=>d.id)} style={{marginTop:5}} wrapperCol={formProps.wrapperCol} labelCol={formProps.labelCol} >
                    <Select mode="tags">
                        {currentSpec.properties.map((d:any)=>{
                            return <Select.Option key={d.id} value={d.id}>{d.name}</Select.Option>
                        })}
                    </Select>
                 </Form.Item>
                {/* <div><span>规格值:</span></div> */}
            </Card>
        })
    },[specifications,specList])
    return <Space direction="vertical" style={{width:'100%'}}>
         <div><Button type="primary">添加规格</Button></div>
         <div>
            {/* {renderSpecsFormList()} */}
            {renderSpecs()}
         </div>
    </Space>
})

const Specification2=React.memo<any>(()=>{
    
})
export default Specification