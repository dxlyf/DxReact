import { Form, Collapse, Tabs, Row, Space, Col, Input, Select, Upload, Checkbox, DatePicker, Table, Descriptions, Grid, Button, InputNumber, Popover, Alert, message, Switch, Modal } from 'antd'
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
const NEIPAI_OPTIONS = [{
    label: '内派',
    value: '内派'
}, {
    label: '港聘',
    value: '港聘'
}]
function getTotal(...args: any[]) {
    return args.reduce((sum, v) => {
        return sum + (Number.isFinite(v) ? v : 0)
    }, 0)
}

const ProFormItemInnerWrap=(props:any)=>{
    return props.children
}
const ProFormItemInner = (props: any) => {
    const { children, ...restProps } = props
    const [open, setOpen] = useState(false)
    const { errors } = Form.Item.useStatus()
    const popoverContent = (
        <>
        <div style={{ color: '#ff4d4f', fontSize: '12px' }}>
            {errors.map((error, index) => (
                <div key={index}>{error}</div>
            ))}
        </div>
        </>
    );
    const hasError = errors.length > 0
    return <>
        <Popover
            content={popoverContent}
            trigger="focus" // 获得焦点时显示（例如点击或 tab 聚焦）
            open={hasError } // 有错误且字段被操作过时才打开
            placement='top' // 提示出现的位置
        >
                {React.cloneElement(children, restProps)}
        </Popover>
    </>
}
const ProFormItem = (props: any) => {
    const { children, ...restProps } = props
    return <Form.Item noStyle {...restProps}>
        <ProFormItemInner {...(children?.props??{})}>{children}</ProFormItemInner>
    </Form.Item>
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
    const handleFinish = useMemoizedFn(async (values) => {
        console.log('values', values)
        //  console.log('allValues',form.getFieldsValue(true))
    })
    const handleFinishFail = useMemoizedFn(async (values) => {
        //  console.log('values',values)
        // console.log('allValues',form.getFieldsValue(true))
    })
    const bonus=Form.useWatch('bonus',form)
    const tabItems = useMemo<TabsProps['items']>(() => {
        const collapseItems: CollapseProps['items'] = [{
            key: 'time',
            label: '表单',
            children: <>
            <Row>
                <Col span={12}>
                <Form.Item label='自定下拉内容' name='opNames'>
                    <Select options={[
                    {
                        value:'1',
                        label:'李三', 
                        age:18     
                    },{
                        value:'2',
                        label:'张龙',
                        age:20
                    },{
                        value:'3',
                        label:'王虎',
                        age:30
                    }
                ]} onChange={(value,option)=>{
                    console.log('option',option)  
                }} optionRender={(oriOption,info)=>{
                    return <>
                        <p>{oriOption.data.label}</p>
                        <p>{oriOption.data.age}</p>
                    </>
                }}></Select>
                </Form.Item>
                </Col>
            </Row>
                <Row>
                    <Col>
                        <Form.Item label='是否保密' name='secret' rules={[{
                            type: 'boolean',
                            required: true,
                            message: '请选择'
                        }]}>
                            <Switch checkedChildren={'是'} unCheckedChildren={'否'}></Switch>
                        </Form.Item>
                    </Col>
                    <Col>
                        <Form.Item label='是否保密2' name='secret2' getValueFromEvent={(e) => {
                            return e.target.checked
                        }} valuePropName='checked' rules={[{
                            type: 'boolean',
                            required: true,
                            message: '请选择'
                        }]}>
                            <Checkbox value={1} ></Checkbox>
                        </Form.Item>
                    </Col>
                    <Col>
                        <Form.Item label='是否保密3' name='secret3' rules={[{
                            type: 'number',
                            required: true,
                            message: '请选择'
                        }]}>
                            <Select options={[{ label: '是', value: 1 }, { label: '否', value: 0 }]}></Select>
                        </Form.Item>
                    </Col>
                </Row>
                <Row gutter={6}>
                    <Col span={6}>
                        <ProFormItem label='金额' name='price' validateFirst rules={[{
                            type: 'number',
                            required: true,
                            message: '请输入${label}'
                        }, {
                            type: 'number',
                            validator: async (rule, value) => {
                                if (value <= 10) {
                                    throw '金额必须大于10'
                                }
                            }

                        }]}>
                            <InputNumber></InputNumber>
                        </ProFormItem>
                    </Col>
                    <Col span={6}>
                        <Form.Item label='百分比' name='precent'>
                            <InputNumber addonAfter='%' ></InputNumber>
                        </Form.Item>
                    </Col>
                </Row>
                <Row>
                    <Col flex={'auto'}>
                        <Form.Item name='user' label='用户'>
                            <Select onChange={(value, option) => {
                                if (option) {
                                    console.log('option', option)
                                    form.setFieldValue('username', option.userName)
                                }
                            }} options={[
                                {
                                    label: '李三',
                                    value: 'lisha',
                                    userName: '李三(lissha)'
                                }, {
                                    label: '李五',
                                    value: 'liwu',
                                    userName: '李五(liwu)'
                                }
                            ]}></Select>
                        </Form.Item>
                    </Col>
                    <Col>
                        <Form.Item noStyle dependencies={['user']}>{() => {
                            return <Form.Item name='username' label='用户名'>
                                <Input></Input>
                            </Form.Item>
                        }}</Form.Item>
                    </Col>
                </Row>
                <Row>
                    <Col>
                        <Form.Item name='file' valuePropName='fileList' >
                            <ProUpload></ProUpload>
                        </Form.Item>
                    </Col>
                </Row>
                <Row>

                    <Col>
                        <Form.Item name="num" label='数字'>
                            <InputNumber></InputNumber>
                        </Form.Item>
                        <Form.Item label='年份' name='year'>
                            <DatePicker.YearPicker></DatePicker.YearPicker>
                        </Form.Item>
                    </Col>
                    <Col>
                        <Form.Item label='季度' name='quarter'>
                            <DatePicker picker='quarter'></DatePicker>
                        </Form.Item>
                    </Col>
                </Row>
            </>
        },  {
                key:'dayn_anttable',
                label:'antTable行编辑',
                children:<AntTableEditDemo form={form}></AntTableEditDemo>
            }, {
            key: 'a',
            label: '表单上传',
            children: <>
                <Row>
                    <Col>

                        <Form.Item label='点击上传' getValueFromEvent={(e) => {
                            return e.fileList
                        }} valuePropName="fileList" rules={[{
                            type: 'array',
                            required: true,
                            message: '请上传文件'
                        }]} name={'myFile'}>
                            <Upload headers={{
                                'Content-Type': 'multipart/form-data'
                            }} action={'/api/upload'} name='files'>
                                <Button>点击上传</Button>
                            </Upload>
                        </Form.Item>
                    </Col>
                </Row>
            </>
        }, {
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
                                    return <Popover title='应急演习' placement='topLeft' open={errors.length > 0} content={<div style={{ fontSize: 12, color: 'red' }}>
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
                                                        <Select allowClear onChange={(value, option) => {
                                                            if (option) {
                                                                form.setFieldValue(['exerciseList', field.name, 'exerciseThemeName'], option.label)
                                                            } else {
                                                                form.setFieldValue(['exerciseList', field.name, 'exerciseThemeName'], undefined)
                                                            }
                                                            console.log('value', value, 'option', option)
                                                            if (value !== undefined) {

                                                            }
                                                        }} style={{ width: '80%' }} size='small' options={[{ value: 'aaa', label: '湖南' }, { value: 'bbb', label: '广东' }]}></Select>
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
                                                <td colSpan={2}>{record.exerciseTheme + '——' + record.exerciseThemeName}</td>
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
                                        <th><Form.Item noStyle shouldUpdate>{(form) => {
                                            const data = form.getFieldValue('exerciseList')
                                            return data.reduce((sum: number, record: any) => {
                                                return sum + (Number.isFinite(record.exercisePersonnel) ? record.exercisePersonnel : 0)
                                            }, 0)
                                        }}</Form.Item></th>
                                    </tr>
                                </tfoot>
                            </table>
                        </>
                    }}
                </Form.List>
            </>
        }, {
            key: 'ba343',
            label: '奖金明细',
            children: <>
                <ProFormItem noStyle name='bonus' label='总奖金' rules={[{
                    required: true,
                    type: 'number',
                    message: '请输入奖金'
                }]}>
                    <InputNumber></InputNumber>
                </ProFormItem>
                <Form.List name={'bonusDetails'}>
                    {(fields, operation) => {
                        const listPrefix = 'bonusDetails'
                        const data = form.getFieldValue(listPrefix)
                        const validateFieldNames = ['employeeName', 'employeeNo', 'position', 'employeeType', 'bonus', 'hasAssistant']
                        return <>
                            <Row justify={'end'} style={{ marginBottom: 6 }}>
                                <Col flex={'none'}>
                                    <Space size={'small'}>
                                        <Button size={'small'} icon={<PlusOutlined></PlusOutlined>} onClick={() => {
                                            const curRowIndex = selectedIndex === -1 ? 0 : selectedIndex
                                            const validateFields = validateFieldNames.map(name => [listPrefix, curRowIndex, name])
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
                                            const validateFields = validateFieldNames.map(name => [listPrefix, curRowIndex, name])
                                            switchRowSubmit(validateFields).then(() => {
                                                const { ...copyData } = form.getFieldValue([listPrefix, curRowIndex])

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
                                        <Button size='small' icon={<DeleteOutlined></DeleteOutlined>} onClick={()=>{
                                            Modal.confirm({
                                                title:'温馨提示',
                                                content:'确认要删除全部？',
                                                onOk:()=>{
                                                   form.setFieldValue(listPrefix,[])
                                                   setSelectedIndex(-1)
                                                }
                                            })
                                        }}>删除全部</Button>
                                    </Space>
                                </Col>
                            </Row>

                            <div style={{ overflowX: 'auto' }}>
                                <table className={styles.table} style={{ tableLayout: 'fixed' }}>
                                    <colgroup>
                                        <col width={60}></col>
                                        <col width={120}></col>
                                        <col width={120}></col>
                                        <col width={120}></col>
                                        <col width={120}></col>
                                        <col width={140}></col>
                                        <col width={120}></col>
                                        <col width={140}></col>
                                        <col width={180}></col>
                                    </colgroup>
                                    <thead>
                                        <tr>
                                            <th>序號</th>
                                            <th>姓名</th>
                                            <th>員工編號</th>
                                            <th>職位</th>
                                            <th>内派/招聘</th>
                                            <th>獎金(港幣)</th>
                                            <th>百分比</th>
                                            <th>是否助縂及以上</th>
                                            <th>備注</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {
                                            fields.map((field, i) => {
                                                const selected = selectedIndex === i
                                                const record = form.getFieldValue([listPrefix, field.name])
                                                const trProps = {
                                                    className: classNames({
                                                        [styles.rowSelected]: selected
                                                    }),
                                                    ...(!selected ? {
                                                        onClick: async () => {

                                                            const curRowIndex = selectedIndex === -1 ? 0 : selectedIndex
                                                            const validateFields = validateFieldNames.map(name => [listPrefix, curRowIndex, name])
                                                            switchRowSubmit(validateFields).then(() => {
                                                                setSelectedIndex(i)
                                                            }, () => {
                                                                message.info('請先填寫完當前行，再切换行')
                                                            })
                                                        }
                                                    } : {})
                                                }

                                                return selected ? <tr key={field.key} {...trProps}>
                                                    <td>{i + 1}</td>
                                                    <td>
                                                        <Form.Item name={'employeeName'} noStyle rules={[{
                                                            type: "string",
                                                            whitespace: true,
                                                            message: '请输入name'
                                                        }]}>
                                                            <Input></Input>
                                                        </Form.Item>
                                                    </td>

                                                    <td >
                                                        <Form.Item noStyle name={[field.name, 'employeeNo']} rules={[{
                                                            required: true,
                                                            message: '請填寫員工編號'
                                                        }]}>
                                                            <Input style={{ width: '80%' }}  ></Input>
                                                        </Form.Item>
                                                    </td>
                                                    <td >
                                                        <Form.Item noStyle name={[field.name, 'position']} rules={[{
                                                            required: true,
                                                            message: '請填寫職位'
                                                        }]}>
                                                            <Input style={{ width: '80%' }}  ></Input>
                                                        </Form.Item>
                                                    </td>
                                                    <td >
                                                        <Form.Item noStyle name={[field.name, 'employeeType']} rules={[{
                                                            required: true,
                                                            message: '請選擇内派/港聘'
                                                        }]}>
                                                            <Select options={NEIPAI_OPTIONS}></Select>
                                                        </Form.Item>
                                                    </td>
                                                    <td>
                                                        <ProFormItem noStyle name={[field.name, 'bonus']} required rules={[{
                                                            type: 'number',
                                                            required:true,
                                                            validator: async (rule, value) => {
                                                                console.log('bonusbonus',bonus)
                                                                if (!Number.isFinite(Number(bonus))) {
                                                                    throw '先设置总奖金额度'
                                                                }
                                                                if(!Number.isFinite(value)){
                                                                     throw '请填写奖金'
                                                                }
                                                                if(Number(value)>Number(bonus)){
                                                                    throw '金额不能大于奖金'
                                                                }
                                                             
                                                            }
                                                        }]}>
                                                            <InputNumber style={{ width: '80%' }}  ></InputNumber>
                                                        </ProFormItem>
                                                    </td>
                                                    <td>
                                                        {/* <Form.Item shouldUpdate>{(form)=>{
                                                            const value=form.getFieldValue([listPrefix,field.name,'percent'])
                                                            return (value==undefined?0:value)+'%'
                                                        }}</Form.Item> */}
                                                       <Form.Item noStyle shouldUpdate>{(form) => {
                                                        const data = form.getFieldValue(listPrefix)||[]
                                                            const sum=data.reduce((sum,d)=>sum+(Number.isFinite(d.bonus)?d.bonus:0),0)
                                                        const percent=sum/Number(bonus)
                                                        return (Number.isFinite(percent)?Number(Number(percent*100).toFixed(2)):0)+'%'
                                                    }}</Form.Item>
                                                    </td>
                                                    <td>
                                                        <Form.Item noStyle name={[field.name, 'hasAssistant']}>
                                                            <Switch checkedChildren={'是'} unCheckedChildren={'否'}></Switch>
                                                        </Form.Item>
                                                    </td>
                                                    <td>
                                                        <Form.Item noStyle name={[field.name, 'notes']}>
                                                            <Input ></Input>
                                                        </Form.Item>
                                                    </td>
                                                </tr> : <tr key={field.key}  {...trProps} >
                                                    <td>{i + 1}</td>
                                                    <td>{record.employeeName}</td>
                                                    <td>{record.employeeNo}</td>
                                                    <td>{record.position}</td>
                                                    <td>{record.employeeType}</td>
                                                    <td>{record.bonus}</td>
                                                    <td><Form.Item noStyle dependencies={[[listPrefix,field.name, 'bonus'],['bonus']]}>
                                                            {()=>{
                                                              let percent=record.bonus/Number(bonus)
                                                                
                                                              return <span>{Number.isFinite(percent)?Number(Number(percent*100).toFixed(2)):0}%</span>
                                                            }}
                                                        </Form.Item></td>
                                                    <td>{record.hasAssistant ? '是' : '否'}</td>
                                                    <td>{record.notes}</td>
                                                </tr>
                                            })
                                        }
                                    </tbody>
                                    <tfoot>
                                        <tr>
                                            <th>合計</th>
                                            <th colSpan={4}></th>
                                            <th><Form.Item noStyle shouldUpdate>{(form) => {
                                                const data = form.getFieldValue(listPrefix)||[]
                                                const sum=data.reduce((sum,d)=>sum+(Number.isFinite(d.bonus)?d.bonus:0),0)
                                                // const sum = data.reduce((sum: Decimal, d: any) => {
                                                //     const bonusDecmal = Number.isFinite(d.bonus) ? Decimal(d.bonus) : null
                                                //     if (Decimal.isDecimal(bonusDecmal)) {
                                                //         return sum.add(bonusDecmal)
                                                //     }
                                                //     return sum
                                                // }, Decimal(0)) as Decimal
                                                return sum
                                            }}</Form.Item></th>
                                            <th><Form.Item noStyle shouldUpdate>{(form) => {
                                                 const data = form.getFieldValue(listPrefix)||[]
                                                    const sum=data.reduce((sum,d)=>sum+(Number.isFinite(d.bonus)?d.bonus:0),0)
                                                const percent=sum/Number(bonus)
                                                return (Number.isFinite(percent)?Number(Number(percent*100).toFixed(2)):0)+'%'
                                            }}</Form.Item></th>
                                            <th colSpan={4}></th>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </>
                    }}
                </Form.List>
            </>
        }]
        return [{
            key: 'jb',
            label: '一般表单',
            // 8
            children: (<Form variant='outlined' onFinishFailed={handleFinishFail} onFinish={handleFinish} scrollToFirstError initialValues={{
                dipan: null,
                num: '322',
                myFile: [],
                machineryList: [{ editState: 'add' }],
                machineryListEditIndex: 0,
                bonusDetails: [],
                exerciseList: [] // 应急

            }} form={form} layout='vertical' wrapperCol={{ span: 24 }}>
                <Collapse bordered={false} ghost style={{ width: '100%' }} items={collapseItems} accordion={false} defaultActiveKey={collapseItems.map(d => d.key as string)} ></Collapse>
            </Form>)
        }]
    }, [selectedIndex,bonus])
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