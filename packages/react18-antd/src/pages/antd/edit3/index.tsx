import { Form, Collapse, Tabs, Row, Space, Col, Input, Select, Upload, Checkbox, DatePicker, Table, Descriptions, Grid, Button, InputNumber, Popover, Alert, message, Switch, Modal, Typography, Radio } from 'antd'
import type { FormItemProps, TabsProps, CollapseProps, GetProp, GetProps, GetRef, FormListOperation } from 'antd'
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import dayjs from 'dayjs'
import styles from './index.module.scss'
import { InfoCircleOutlined, MinusOutlined, PlusOutlined, CopyOutlined, DeleteOutlined } from '@ant-design/icons'
import { useMemoizedFn, useLatest, useUpdateEffect, useClickAway } from 'ahooks'
import classNames from 'classnames'
import { ProUpload } from '../components/ProUpload'
import Decimal from 'decimal.js'
import { chain, pick } from 'lodash-es'
import AntTableEditDemo from './AntTableEditDemo'

const text=`蚂蚁集团的企业级产品是一个庞大且复杂的系统，数量多且功能复杂，而且变动和并发频繁，常常需要设计者与开发者能快速做出响应。同时这类产品中存在很多类似的页面以及组件，我们可以通过抽象得到一些稳定且高复用性的内容。

随着商业化的趋势，越来越多的企业级产品对更好的用户体验有了进一步的要求。带着这样的一个终极目标，我们（蚂蚁集团体验技术部）经过大量项目实践和总结，逐步打磨出一个服务于企业级产品的设计体系 —— Ant Design。基于「自然」、「确定性」、「意义感」、「生长性」四大设计价值观，通过模块化解决方案，降低冗余的生产成本，让设计者专注于更好的用户体验。`
// 是否有效数学，包括字符数字
export const isNum=(value)=>{
    return value!==null&&Number.isFinite(Number(value))
}

//'1234567'.replace(/\d{1,3}(?=(\d{3})+$)/g,'$&,')
// 格式化显示金额
export function formatAmount(amount, precision = 2) {
    // 将数字转换为字符串
    const str = isNum(amount) ? (new decimal(amount)).toFixed(precision) : '';
    // 使用正则表达式进行格式化
    return str.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
export function roundPrecision(value:any,percision=2){
    return Math.round(value*Math.pow(10,percision))/Math.pow(10,percision)
}
export function formatAmount2(amount:any, precision = 2) {
    // 将数字转换为字符串
    const str = isNum(amount) ? amount.toFixed(precision) : '';
    // 使用正则表达式进行格式化
    return str.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
const EditPage = () => {
    const [form] = Form.useForm()


    const switchRowSubmit = useCallback(async (dataIndex?: any) => {
        try {
            const values = await form.validateFields(dataIndex)
            console.log('switchRowSubmit', values)
        } catch (e) {
            return Promise.reject()
        }
    }, [])
    const handleFinish = useMemoizedFn(async (values) => {
        console.log('values', values)
        //  console.log('allValues',form.getFieldsValue(true))
    })
    const handleFinishFail = useMemoizedFn(async (values) => {
        //  console.log('values',values)
        // console.log('allValues',form.getFieldsValue(true))
    })

    const tabItems = useMemo<TabsProps['items']>(() => {
   
        return [{
            key: 'jb',
            label: '一般表单',
            // 8
            children: (<Form variant='outlined' onFinishFailed={handleFinishFail}  onFinish={handleFinish} scrollToFirstError initialValues={{
                selectUser:{value:'wangwu',label:'王五'}
            }} form={form} layout='vertical' wrapperCol={{ span: 24 }}>     
            <Input.TextArea rows={3}></Input.TextArea>
                        <Form.Item label={true?'上鎖/解鎖':'上鎖狀態'}>
                            {true?'解鎖':'上鎖'}
                        </Form.Item>

                                <Form.Item label={'身份证'} name='cid' rules={[{
                                    required:true,
                                    message:'请输入${label}'
                                },{
                                    pattern:/^\d{17}[\dXx]$/,
                                    message:'身份证格式不正确'
                                }]}>
                                <Input></Input>
                        </Form.Item>

                        <Row>
                            <Col span={8}>
                                <Form.Item label='数量' name='quantity' rules={[{
                                    type:'integer',
                                    required:true,
                                    message:'请输入数量'
                                },{
                                    type:'integer',
                                    min:0,
                                    max:100,
                                    message:'输入范围为${min}至${max}'
                                }]}>
                                    <InputNumber  style={{width:'100%',textAlign:"right"}} min={0} precision={0}></InputNumber>
                                </Form.Item>
                            </Col>
                              <Col span={8}>
                                <Form.Item label='金额' name={'amount'} >
                                      <InputNumber parser={(display)=>{
                                        return display?.replace(',','')
                                      }} formatter={(value)=>{
                                          if(value==null){
                                             return ''
                                          }
                                          return String(value).replace(/\d{1,3}(?=(\d{3})+$)/g,'$&,')
                                      }}  style={{width:'100%'}} precision={2}></InputNumber>
                                </Form.Item>
                            </Col>

                        </Row>
                        <Row>
                            <Col span={8}>
                                <Form.Item label='下拉框' name={'selectUser'}>
                                    <Select labelInValue options={[{value:'lisha',label:'李三'}]}></Select>
                                      </Form.Item>
                            </Col>
                        </Row>
                        <Row>
                          <Col span={8}>
                                      <Form.Item label='文本'>
                                          <Typography.Text style={{width:'100%'}} ellipsis={{
                                            tooltip:text
                                          }}>{text}</Typography.Text>
                                      </Form.Item>
                            </Col>
                                  <Col span={8}>
                                      <Form.Item label='段落'>
                                          <Typography.Paragraph ellipsis={{
                                            rows:2,
                                            tooltip:text,
                                            expandable:true
                                          }}>{text}</Typography.Paragraph>
                                      </Form.Item>
                            </Col>
                        </Row>
            </Form>)
        }]
    }, [])
    const handleSubmit = useCallback(async () => {
        try {
            console.log('formData', form.getFieldsValue(true))
            form.submit()
            //  form.scrollToField(['exerciseList'])
            //  console.log('values', values)
        } catch { }
    }, [])

    return <>
        <Row justify={'end'}>
            <Col flex="none">
                <Space><Button type="primary" onClick={handleSubmit}>提交</Button></Space>
            </Col>
        </Row>
        <Tabs items={tabItems} defaultActiveKey='jb' style={{ background: '#fff' }}></Tabs>

    </>
}

export default EditPage