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