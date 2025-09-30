import { Collapse, Tabs } from 'antd'
import type { CollapseProps } from 'antd'
import { ProForm, EditableProTable, ProFormItem, ProFormDependency, ProFormSelect, ProFormText, ProFormGroup, ProFormDatePicker, ProFormDateRangePicker } from '@ant-design/pro-components'
import type { ProFormProps, ProFormInstance, ProFormItemProps, ProFormFieldProps } from '@ant-design/pro-components'
import React, { useImperativeHandle, useMemo, useRef, useState } from 'react'
import dayjs from 'dayjs'


type EditPageInstance = {
    submit: () => void
}
const EditPage = (props: { editRef: React.Ref<EditPageInstance> }) => {
    const { editRef } = props
    const formRef = useRef<ProFormInstance>()
    const [data, setData] = useState([])
    const collapseItems = useMemo<Required<CollapseProps>['items']>(() => {
        return [
            {
                key: 'a',
                label: '基本信息',
                children: (
                    <>
                        <ProFormGroup>
                            <ProFormSelect colProps={{ sm: 8 }} label='地盘编号' name={'dipanno'}></ProFormSelect>
                            <ProFormSelect colProps={{ sm: 8 }} label='工程公司' name={'gongsi'}></ProFormSelect>
                            <ProFormText colProps={{ sm: 8 }} label='地盘名称' name={'dipanname'}></ProFormText>
                        </ProFormGroup>
                        <ProFormGroup>
                            <ProFormDatePicker.Month colProps={{ sm: 8 }} label='月报月份' name={'yuebaoyuefen'}></ProFormDatePicker.Month>
                            <ProFormDatePicker dependencies={['endDate']} rules={[{
                                required: true,
                                type: 'object',
                                async validator(rule, value, callback) {
                                    let endDate = formRef.current?.getFieldValue('endDate')
                                    if (!endDate || !value) {
                                        return
                                    } else {
                                        if (dayjs(value).isAfter(endDate, 'date')) {
                                            throw '开始日期不能大于结束日期'
                                        }
                                    }
                                },
                            }]} colProps={{ sm: 8 }} label='开始日期' name={'beginDate'}></ProFormDatePicker>
                            <ProFormDatePicker dependencies={['beginDate']} rules={[{
                                required: true,
                                type: 'object',
                                async validator(rule, value, callback) {
                                    let beginDate = formRef.current?.getFieldValue('beginDate')
                                    if (!beginDate || !value) {
                                        return
                                    } else {
                                        if (dayjs(value).isBefore(beginDate, 'date')) {
                                            throw '结束日期不能小于开始日期'
                                        }
                                    }
                                },
                            }]} colProps={{ sm: 8 }} label='结束日期' name={'endDate'}></ProFormDatePicker>
                        </ProFormGroup>


                        <EditableProTable rowKey={'id'} columns={[{
                            title: '姓名',
                            dataIndex: 'name',
                            valueType: 'text'
                        }, {
                            title: '年龄',
                            dataIndex: 'age',
                            valueType: 'digit'
                        }, {
                            title: '操作',
                            valueType:'option',
                            render(dom, record, index, action) {
                                return [<a
                                    key="editable"
                                    onClick={() => {
                                        action?.startEditable?.(record.id);
                                    }}
                                >
                                    编辑
                                </a>,
                                <a
                                    key="delete"
                                    onClick={() => {

                                    }}
                                >
                                    删除
                                </a>,]
                            }
                        }]} value={data} onDataSourceChange={(value: any[]) => {
                            console.log('dataSource', value)
                        }} onValuesChange={(value: any[]) => {
                            console.log('value', value)
                            setData(value)
                        }} recordCreatorProps={{
                            record: (index) => {
                                return {
                                    id:index,
                                    name: '李三'
                                }
                            },
                            newRecordType:"cache",
                            position:'bottom'
                        }}></EditableProTable>
                    </>

                )
            }
        ]
    }, [data])
    return <>
        <ProForm formRef={formRef} layout='vertical' grid={true} >
            <Collapse style={{ width: '100%' }} items={collapseItems} defaultActiveKey={collapseItems.map(d => d.key as string)}></Collapse>
        </ProForm>
    </>
}

export default EditPage