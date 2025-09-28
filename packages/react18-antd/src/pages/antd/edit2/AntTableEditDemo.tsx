import { Table, Tooltip, Row, Col, Space, Button, Popover, Form, Input, Typography, Select } from 'antd'
import { QuestionCircleOutlined } from '@ant-design/icons'
import type { GetProp, GetProps, GetRef, TableColumnType, FormItemProps, FormInstance } from 'antd'
import React, { useCallback, useMemo, useState } from 'react'
import { useMemoizedFn } from 'ahooks'
import { omit } from 'lodash-es'




type TableProps = GetProps<typeof Table>
type FormFieldContext = {
    dataIndex: string
    record: any,
    rowIndex: number,
    form: FormInstance,
    value?: any
}

type WrapperFormComponent = (children: React.ReactElement, formItemProps: FormItemProps) => React.ReactElement
type EditTableColumn = Omit<TableColumnType, 'dataIndex'> & {
    dataIndex?: string
    editable?: boolean
    editing?: ((context: FormFieldContext) => boolean)
    renderFormItem?: (context: FormFieldContext, wrapper: WrapperFormComponent) => React.ReactElement
}
type EditTableProps = Omit<TableProps, 'columns' | 'rowKey'> & {
    rowKey?: string
    table?: EditTaleStore
    columns: EditTableColumn[]
    createRowRecord?: () => any
    onValueChange?: (data: any[]) => void
}

class EditTaleStore<T = any> {
    static uid = 1
    rowKey: string = '__key__'
    dataSource: T[] = []
    currentEditRowKey: string = ''
    update?: () => void
    constructor(update?: () => void) {
        this.update = update
    }
    onValueChange(valueChange: (data: any) => void) {

    }
    refresh() {
        this.update?.()
    }
    setEditRow(record: any) {
        this.setEditKey(this.getRowKey(record))
    }
    setEditKey(key: any) {
        this.currentEditRowKey = key
        this.refresh()
    }
    getRowKey(record: any) {
        return record[this.rowKey].id
    }
    isEdit(record: any) {
        return this.currentEditRowKey === this.getRowKey(record)
    }
    setData(data: T[]) {
        this.dataSource = Array.isArray(data) ? data.map((record, index) => {
            return {
                [this.rowKey]: {
                    id: EditTaleStore.uid++,
                    isNew: false,
                },
                ...record,
            }
        }) : []
        this.refresh()
    }
    updateRow(rowIndex: number, record: T) {
        const oldRecord = this.dataSource[rowIndex]
        if (oldRecord) {
            const newRecord = {
                ...oldRecord,
                ...record,
            }
            this.dataSource[rowIndex] = newRecord
            this.refresh()
        }
    }
    insertRow(rowIndex: number, record: T) {
        this.dataSource.splice(rowIndex, 0, {
            [this.rowStatusKey]: 'new',
            ...record
        })
        this.refresh()
    }
    removeRow(rowIndex: number) {
        this.dataSource.splice(rowIndex, 1)
        this.refresh()
    }
    cancelRowEdit(record: any) {

    }
    destroy() {
        this.update = undefined
        this.dataSource = []
    }
}
const useEditTable = (table?: EditTaleStore) => {
    const [, update] = useState(false)
    const forceUpdate = useCallback(() => {
        return update(v => !v)
    }, [])
    const [tableInstance] = useState(() => {
        if (table) {
            return table
        }
        return new EditTaleStore()
    })
    tableInstance.update = forceUpdate
    return [tableInstance]
}
const defaultEmptyData: any[] = []


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
const EditTable = (props: EditTableProps) => {
    const { rowKey = '__row_key__', createRowRecord, onValueChange, columns, dataSource = defaultEmptyData, ...restTableProps } = props
    const [form] = Form.useForm()
    const [editRowKey, setEidtRowKey] = useState('')
  //  const [table] = useEditTable(propTable)
    const getRowkey = useMemoizedFn((record: any) => {
        return record[rowKey as string]
    })
    const isEdit = useMemoizedFn((record) => {
        return getRowkey(record) === editRowKey
    })
    const createNewRowRecord = useMemoizedFn(() => {
        const record = createRowRecord?.() || {}
        return {
            ...record
        }
    })
    const saveRecord = useMemoizedFn(async (item: any) => {
        try{
            await form.validateFields()
            const rowIndex = mergedataSource.findIndex(d => getRowkey(d) === getRowkey(item))
            if (rowIndex !== -1) {
                const allValues = form.getFieldsValue(true)
                const newData = [...dataSource]
                const record = dataSource[rowIndex]
                newData[rowIndex] = {
                    ...record,
                    ...allValues
                }
                setEidtRowKey('')
                onValueChange?.(newData)
            }
        }catch{}
    })
    const insertRow = useMemoizedFn((record: any, rowIndex: number) => {
        const newData = [...dataSource]
        newData.splice(rowIndex, 0,record)
        onValueChange?.(newData)
    })
    const removeRow = useMemoizedFn((rowIndex: number) => {
        const newData = [...dataSource]
        newData.splice(rowIndex, 1)
        onValueChange?.(newData)
    })
    const removeRecord = useMemoizedFn(() => {
        return ''
    })
    const wrapperFormComponent = useCallback((f: FormFieldContext) => {
        return (children: React.ReactElement, formItemProps: FormItemProps = {}) => {
            return <ProFormItem noStyle name={f.dataIndex} {...formItemProps}>
                {children}
            </ProFormItem>
        }
    }, [])
    const mergedataSource = useMemo(() => {
        return Array.isArray(dataSource) ? dataSource.map((d, index) => {
            return {
                ...d,
                [rowKey]: index
            }
        }) : []
    }, [dataSource])
    const mergeColumns = useMemo(() => {
        return columns.map(col => {
            if (!col.dataIndex || !col.editable) {
                return col
            }
            const { editable, render, renderFormItem, editing, ...resetCol } = col
            return {
                ...resetCol,
                render: (value: any, record: any, index: number) => {
                    const fieldContext: FormFieldContext = {
                        dataIndex: col.dataIndex!,
                        record,
                        value,
                        rowIndex: index,
                        form
                    }
                    const isEditing = editing ? editing(fieldContext) : isEdit(record)
                    if (isEditing) {
                        return renderFormItem!(fieldContext, wrapperFormComponent(fieldContext))
                    } else {
                        return render ? render(value, record, index) : value
                    }
                }
            }
        }).concat({
            title: '操作',
            fixed: 'right',
            width: 120,
            render: (value: any, record: any, index: number) => {
                const isEditing = isEdit(record)
                
                if (isEditing) {
                    return <Space>
                        <Button type='link' style={{padding:0}}  onClick={() => {
                            saveRecord(record)
                        }}>保存</Button>
                        <Button type='link' style={{padding:0}}  onClick={() => {

                        }}>取消</Button>
                    </Space>
                } else {
                    return <Space>
                        <Button type='link' style={{padding:0}} onClick={() => {
                            insertRow(index + 1, createNewRowRecord())
                        }}>插入</Button>
                        <Button type='link' style={{padding:0}}  onClick={() => {
                            insertRow(index + 1, {
                                ...record,
                            })
                        }}>复制</Button>
                        <Button type='link' style={{padding:0}}  onClick={() => {
                            setEidtRowKey(getRowkey(record))
                        }}>编辑</Button>
                        <Button type='link' style={{padding:0}}  onClick={() => {
                            removeRow(index)
                        }}>删除</Button>
                    </Space>
                }
            }
        })
    }, [columns, setEidtRowKey,mergedataSource])

    const rowSelection: GetProp<typeof Table, 'rowSelection'> = {
        type: 'checkbox'
    }
    return <>

        <Form form={form} component={false}>
            <Row justify={'end'}>
                <Col flex={'none'}>
                    <Space>
                        <Button onClick={()=>{
                            insertRow(createNewRowRecord(),dataSource.length)
                            setEidtRowKey(dataSource.length)
                        }}>插入行</Button>
                    </Space>
                </Col>
            </Row>
            <Table tableLayout='fixed' rowKey={rowKey} pagination={false} columns={mergeColumns as any} dataSource={mergedataSource} {...restTableProps}></Table>
        </Form>
    </>

}
const EmptyComponent=()=>{
    return <></>
}
const AntTableEditDemo = ({form}) => {

   // const form=Form.useFormInstance()
    const columns = useMemo<EditTableColumn[]>(() => {
        return [
            {
                title: '分区',
                dataIndex: 'fenqu',
                editable: true,
                width: 200,
                renderFormItem(ctx, wrapper) {
                    return wrapper(<Input></Input>, {
                        rules: [{
                            required: true,
                            message: '不能为空'
                        }]
                    })
                }
            },
            {
                title: '分区',
                dataIndex: 'fenqu2',
                editable: true,
                width: 200,
                renderFormItem(ctx, wrapper) {
                    return wrapper(<Input></Input>, {})
                }
            }
        ]
    }, [])
     const [data,setData]=useState()
    const  dataSource=Form.useWatch('tableList',form)||[]
    console.log('dataSource',dataSource)
    return <>
    <Form.Item name='tableList' hidden>
    <EmptyComponent></EmptyComponent>
    </Form.Item>
           <Form component={false}  preserve={false}>
            <Tooltip title='魂牵梦萦FDA'><QuestionCircleOutlined></QuestionCircleOutlined></Tooltip>

            <EditTable pagination={false}  dataSource={dataSource} columns={columns} onValueChange={(data)=>{
                    form.setFieldValue('tableList',data)
                    console.log('valueChange',data)
            }}>

            </EditTable>
        </Form>
        <Typography.Paragraph type='secondary'>
    備註：<br/>
    1.分區責任人可獲獎金3,000港元，協助安環管理工作的助理管工,則可獲獎金1,000港元作為獎勵；(每個獲獎分區最多可頒發2名分區助理管工);<br/>
    2.若分區無安排助理管工，則相應獎金取消，不可攤分；<br/>
    3.獲獎分區數量按分區總數決定，每足3-4個分區中可選1個，足8個分區中可選2個，即7個分區只可選1個，依次類推。獲獎分區每週評分不低於80分，且每月平均分不少於90分；<br/>
    4.地盤需隨申請附上最新《地盤安環管理分區責任人委任書》、《地盤安環管理分區責任人告示板》、當月《地盤安環管理分區檢查評分表》和《地盤安環管理分區檢查評分月度匯總表》；
      </Typography.Paragraph>
      
        
    </>
}

export default AntTableEditDemo