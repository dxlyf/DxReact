import { Form, Collapse, Tabs, Row, Space, Col, Input, Select, Upload, Checkbox, DatePicker, Table, Descriptions, Grid, Button, InputNumber, Popover, Alert, message } from 'antd'
import type { FormItemProps, TabsProps, CollapseProps, GetProp, GetProps, GetRef, FormListOperation } from 'antd'
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import dayjs from 'dayjs'
import styles from './index.module.scss'
import { InfoCircleOutlined, MinusOutlined, PlusOutlined, CopyOutlined, DeleteOutlined } from '@ant-design/icons'
import { useMemoizedFn, useLatest, useUpdateEffect, useClickAway } from 'ahooks'
import classNames from 'classnames'
const defaultWrapperCol = {
    //>=1600
    xxl: {
        span: 8
    },
    //>=1200
    xl: {
        span: 6
    },
    // >=992
    lg: {
        span: 5,
    },
    // >=768
    md: {
        span: 3
    },
    // >=576
    sm: {
        span: 2
    },
    // < 576
    xs: {
        span: 1
    }
}
const defaultColProps = {
    xs: 24,
    sm: 12,
    md: 8,
    lg: 5,
    xl: 6,
    xxl: 3,
}

function getTotal(...args: any[]) {
    return args.reduce((sum, v) => {
        return sum + (Number.isFinite(v) ? v : 0)
    }, 0)
}

const EditPage = () => {
    const [form] = Form.useForm()

    const [selectedIndex, setSelectedIndex] = useState(-1)

    const switchRowSubmit = useCallback(async (dataIndex?: any) => {
        try {
            const values = await form.validateFields(dataIndex)
            console.log('switchRowSubmit', values)
        } catch (e) {
            return Promise.reject()
        }
    }, [])
    const tabItems = useMemo<TabsProps['items']>(() => {
        const collapseItems: CollapseProps['items'] = [{
            key: 'aaaaa',
            label: '应急演习',
            children: <>

                <Form.List name={'exerciseList'}>
                    {(fields, operation) => {
                        const data = form.getFieldValue('exerciseList')
                        console.log('list', data)
                        const validateFieldNames = ['exerciseTheme', 'exercisePersonnel', 'exerciseDate']
                        return <>
                            <Row justify={'end'} style={{ marginBottom: 6 }}>
                                <Col flex={'none'}>
                                    <Space size={'small'}>
                                        <Button size={'small'} icon={<PlusOutlined></PlusOutlined>} onClick={() => {
                                            const curRowIndex = selectedIndex === -1 ? 0 : selectedIndex
                                            const validateFields = validateFieldNames.map(name => ['exerciseList', curRowIndex, name])
                                            switchRowSubmit(validateFields).then(() => {
                                                if (selectedIndex === -1) {
                                                    setSelectedIndex(fields.length)
                                                    operation.add({})
                                                } else {
                                                    setSelectedIndex(selectedIndex + 1)
                                                    operation.add({}, selectedIndex + 1)
                                                }
                                            }, () => {
                                                message.info('請先填寫完當前行，再插入行')
                                            })

                                        }}>插入行</Button>
                                        <Button onClick={() => {
                                            if (fields.length <= 0 || selectedIndex == -1) {
                                                message.info('請先選擇要復制的行')
                                                return
                                            }
                                            const curRowIndex = selectedIndex === -1 ? 0 : selectedIndex
                                            const validateFields = validateFieldNames.map(name => ['exerciseList', curRowIndex, name])
                                            switchRowSubmit(validateFields).then(() => {
                                                const { ...copyData } = form.getFieldValue(['exerciseList', curRowIndex])

                                                operation.add({
                                                    ...copyData
                                                }, curRowIndex + 1)
                                                setSelectedIndex(curRowIndex + 1)
                                            }, () => {
                                                message.info('請先填寫完當前行，再複製行')
                                            })
                                        }} size={'small'} icon={<CopyOutlined></CopyOutlined>}>複製行</Button>
                                        <Button onClick={() => {
                                            if (fields.length <= 0 || selectedIndex == -1) {
                                                message.info('請先選擇要復制的行')
                                                return
                                            }
                                            const validateFields = validateFieldNames.map(name => ['exerciseList', selectedIndex, name])
                                            form.setFields(validateFields.map(name => ({
                                                name: name,
                                                errors: []
                                            })))
                                            operation.remove(selectedIndex)
                                            setSelectedIndex(-1)

                                        }} size={'small'} icon={<DeleteOutlined></DeleteOutlined>}>刪除行</Button>
                                    </Space>
                                </Col>
                            </Row>
                            <Form.Item noStyle shouldUpdate>
                                {(form) => {
                                    const errors = Array.from(new Set(form.getFieldsError().filter(d => d.name.includes('exerciseList')).flatMap(d => d.errors)))
                                    return <Popover placement='topLeft' open={errors.length > 0} content={<div style={{ fontSize: 12, color: 'red' }}>
                                        <Form.ErrorList errors={errors}></Form.ErrorList>
                                    </div>}><div></div></Popover>
                                }}
                            </Form.Item>
                            <table className={styles.table}>
                                <colgroup>
                                    <col width={60}></col>
                                    <col width={140}></col>
                                     <col></col>
                                    <col width={140}></col>
                                    <col width={200}></col>
                                </colgroup>
                                <thead>
                                    <tr>
                                        <th>序號</th>
                                        <th colSpan={2}>演習主題</th>
                                        <th>人數</th>
                                        <th>日期</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {
                                        fields.map((field, i) => {
                                            const selected = selectedIndex === i
                                            const record = form.getFieldValue(['exerciseList', field.name])
                                            const trProps = {
                                                className: classNames({
                                                    [styles.rowSelected]: selected
                                                }),
                                                ...(!selected ? {
                                                    onClick: async () => {
                                                        const curRowIndex = selectedIndex === -1 ? 0 : selectedIndex
                                                        const validateFields = validateFieldNames.map(name => ['exerciseList', curRowIndex, name])
                                                        switchRowSubmit(validateFields).then(() => {
                                                            setSelectedIndex(i)
                                                        }, () => {
                                                            message.info('請先填寫完當前行，再切换行')
                                                        })
                                                    }
                                                } : {})
                                            }
                                            console.log('trProps', trProps)
                                            return selected ? <tr key={field.key} {...trProps}>
                                                <td>{i + 1}</td>
                                                <td colSpan={2}>
                                                    <Form.Item rules={[{
                                                        required: true,
                                                        message: '請填寫主題'
                                                    }]} noStyle name={[field.name, 'exerciseTheme']}>
                                                        <Input style={{ width: '80%' }} size='small'></Input>
                                                    </Form.Item>
                                                </td>
                                                <td >
                                                    <Form.Item rules={[{
                                                        required: true,
                                                        type: 'integer',
                                                        message: '請填寫人數'
                                                    }]} noStyle name={[field.name, 'exercisePersonnel']}>
                                                        <InputNumber style={{ width: '80%' }} size='small' min={0} precision={0} ></InputNumber>
                                                    </Form.Item>
                                                </td>
                                                <td>
                                                    <Form.Item rules={[{
                                                        required: true,
                                                        type: 'object',
                                                        message: '請選擇日期'
                                                    }]} noStyle name={[field.name, 'exerciseDate']}>
                                                        <DatePicker style={{ width: '80%' }} size='small' format="YYYY-MM-DD"></DatePicker>
                                                    </Form.Item>
                                                </td>
                                            </tr> : <tr key={field.key}  {...trProps} >
                                                <td>{i + 1}</td>
                                                <td colSpan={2}>{record.exerciseTheme}</td>
                                                <td>{record.exercisePersonnel}</td>
                                                <td>{record.exerciseDate ? record.exerciseDate.format('YYYY-MM-DD') : record.exerciseDate}</td>
                                            </tr>
                                        })
                                    }
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <th></th>
                                        <th>演習次數</th>
                                        <th>{data.length}</th>
                                        <th>主題人數</th>
                                        <th><Form.Item noStyle shouldUpdate>{(form)=>{
                                            const data=form.getFieldValue('exerciseList')
                                            return data.reduce((sum:number,record:any)=>{
                                            return sum+(Number.isFinite(record.exercisePersonnel)?record.exercisePersonnel:0)
                                        },0)
                                        }}</Form.Item></th>
                                    </tr>
                                </tfoot>
                            </table>
                        </>
                    }}
                </Form.List>
            </>
        }]
        return [{
            key: 'jb',
            label: '一般表单',
            // 8
            children: (<Form variant='outlined' scrollToFirstError initialValues={{
                dipan: null,
                num: null,
                machineryList: [{ editState: 'add' }],
                machineryListEditIndex: 0,
                exerciseList: [] // 应急

            }} form={form} layout='vertical' wrapperCol={{ span: 24 }}>
                <Collapse bordered={false} ghost style={{ width: '100%' }} items={collapseItems} accordion={false} defaultActiveKey={collapseItems.map(d => d.key as string)} ></Collapse>
            </Form>)
        }]
    }, [selectedIndex])
    const handleSubmit = useCallback(async () => {
        try {
            console.log('formData', form.getFieldsValue())
            let values = await form.submit()
            //  form.scrollToField(['exerciseList'])
            console.log('values', values)
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