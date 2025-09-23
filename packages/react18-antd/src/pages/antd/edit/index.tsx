import { Form, Collapse, Tabs, Row, Space, Col, Input, Select, Upload, Checkbox, DatePicker, Table, Descriptions, Grid, Button, InputNumber, Popover, Alert } from 'antd'
import type { FormItemProps, TabsProps, CollapseProps,GetProp,GetProps,GetRef,FormListOperation } from 'antd'
import React,{ useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import dayjs from 'dayjs'
import styles from './index.module.scss'
import { InfoCircleOutlined, MinusOutlined, PlusOutlined, CopyOutlined, DeleteOutlined } from '@ant-design/icons'
import { useMemoizedFn, useLatest, useUpdateEffect ,useClickAway} from 'ahooks'
import classNames from 'classnames'
import {EditableTable} from './EditTable'
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
const form_init_data = {
    "checkList": [
        {
            "id": null,
            "checkType": "UNION_CHECK",
            "checkTypeName": "地盤聯合檢查\n（地盤安全施工計劃每月自檢+地盤安全同城聯檢+地盤自行組織的安全檢查）",
            "times": null,
            "suggestionNum": null,
            "unsafePointNum": null,
            "monthReportId": null
        },
        {
            "id": null,
            "checkType": "COMPANY_CHECK",
            "checkTypeName": "公司領導及安環部檢查\n（公司領導帶班檢查+公司安環部對地盤檢查)",
            "times": null,
            "suggestionNum": null,
            "unsafePointNum": null,
            "monthReportId": null
        },
        {
            "id": null,
            "checkType": "SPECIAL_CHECK",
            "checkTypeName": "專項檢查\n（公司安環部專項檢查+地盤整潔檢查+地盤防疫檢查+公司安環要求的專項檢查）",
            "times": null,
            "suggestionNum": null,
            "unsafePointNum": null,
            "monthReportId": null
        }
    ],
    "trainingDtoList": [
        {
            "id": null,
            "type": "SAFETY_MEETING",
            "typeName": "安全早会",
            "trainingNum": null,
            "attendance": null,
            "monthReportId": null
        },
        {
            "id": null,
            "type": "NDUCTION_TRAINING",
            "typeName": "入职安全培训",
            "trainingNum": null,
            "attendance": null,
            "monthReportId": null
        },
        {
            "id": null,
            "type": "TOOLBOX_TRAINING",
            "typeName": "工具箱训练",
            "trainingNum": null,
            "attendance": null,
            "monthReportId": null
        },
        {
            "id": null,
            "type": "PROFESSIONAL_TRAINING",
            "typeName": "专项安全培训",
            "trainingNum": null,
            "attendance": null,
            "monthReportId": null
        },
        {
            "id": null,
            "type": "MONTHLY_TRAINING",
            "typeName": "每日安全主题培训",
            "trainingNum": null,
            "attendance": null,
            "monthReportId": null
        },
        {
            "id": null,
            "type": "ENVIRONMENTAL_TRAINING",
            "typeName": "环境相关培训",
            "trainingNum": null,
            "attendance": null,
            "monthReportId": null
        },
        {
            "id": null,
            "type": "OTHER_TRAINING",
            "typeName": "其他培训讲座",
            "trainingNum": null,
            "attendance": null,
            "monthReportId": null
        }
    ]
}
function getTotal(...args: any[]) {
    return args.reduce((sum, v) => {
        return sum + (Number.isFinite(v) ? v : 0)
    }, 0)
}
const FromItemErrorWrapper = (props) => {
    const { status, errors, warnings } = Form.Item.useStatus()
    const { children } = props
    return <>
        {children}
    </>
}

const EditCell = (props: any) => {
    const { children } = props
    const [editing, setEditing] = useState(false);
    const inputRef = useRef(null);
    const form = Form.useFormInstance()
    useEffect(() => {
        if (editing) {
            inputRef.current?.focus();
        }
    }, [editing]);

    return
}
type FormInstance<T> = GetRef<typeof Form<T>>;

const EditableContext = React.createContext<FormInstance<any> | null>(null);

interface Item {
  key: string;
  name: string;
  age: string;
  address: string;
}
interface EditableCellProps {
  title: React.ReactNode;
  editable: boolean;
  dataIndex: keyof Item;
  record: Item;
  handleSave: (record: Item) => void;
}
const EditableCell: React.FC<React.PropsWithChildren<EditableCellProps>> = ({
  title,
  editable,
  children,
  dataIndex,
  record,
  handleSave,
  ...restProps
}) => {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<GetRef<typeof Input>>(null);
  const form = useContext(EditableContext)!;

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
    }
  }, [editing]);

  const toggleEdit = () => {
    setEditing(!editing);
    form.setFieldsValue({ [dataIndex]: record[dataIndex] });
  };

  const save = async () => {
    try {
      const values = await form.validateFields();

      toggleEdit();
      handleSave({ ...record, ...values });
    } catch (errInfo) {
      console.log('Save failed:', errInfo);
    }
  };

  let childNode = children;

  if (editable) {
    childNode = editing ? (
      <Form.Item
        style={{ margin: 0 }}
        name={dataIndex}
        rules={[{ required: true, message: `${title} is required.` }]}
      >
        <Input ref={inputRef} onPressEnter={save} onBlur={save} />
      </Form.Item>
    ) : (
      <div
        className="editable-cell-value-wrap"
        style={{ paddingInlineEnd: 24 }}
        onClick={toggleEdit}
      >
        {children}
      </div>
    );
  }

  return <td {...restProps}>{childNode}</td>;
};
type EditTableProps={
    formOperation:FormListOperation
}&GetProps<typeof Table>


interface EditableRowProps {
  index: number;
}

const EditableRow: React.FC<EditableRowProps> = ({ index, ...props }) => {
  const [form] = Form.useForm();
  return (
    <Form form={form} component={false}>
      <EditableContext.Provider value={form}>
        <tr {...props} />
      </EditableContext.Provider>
    </Form>
  );
};

const tableComponents = {
    body: {
      row: EditableRow,
      cell: EditableCell,
    },
};

const EditTable = (props:EditTableProps) => {
    const {columns:propcolumns,formOperation,...restProps}=props
    const columns=useMemo(()=>{
        return propcolumns?.map((col:any,i)=>{
             if(!col.editable){
                return col
             }
             return {
                ...col,
                onCell:(record:any)=>{
                    return {
                        record,
                        editable:col.editable,
                        dataIndex:col.dataIndex,
                        title:col.title,
                        handleSave:()=>{

                        }
                    }
                }
             }
        })
    },[propcolumns])
    return <>
        <Row justify={'end'}>
            <Col flex={'none'}>
                <Space>
                    <Button icon={<PlusOutlined></PlusOutlined>}>插入行</Button>
                    <Button icon={<CopyOutlined></CopyOutlined>}>複製行</Button>
                    <Button icon={<DeleteOutlined></DeleteOutlined>}>刪除行</Button>
                </Space>
            </Col>
        </Row>
        <Table columns={columns} {...restProps} ></Table>
    </>
}

const TableEditCellWrapper=(props:any)=>{
    const {children,prefix,name,formItemProps,onSave,...restProps}=props
    const form=Form.useFormInstance()
    const [editing,setEditing]=useState(false)
    const innerRef=useRef<HTMLTableCellElement>(null)
    const ref=useRef<HTMLFormElement>()
    const dataIndex=[prefix].concat(name).flat()
    const value=form.getFieldValue(dataIndex)
    useClickAway((e)=>{
        handleSave()
        console.log('fffffffff')
      //  setEditing(false)
    },[innerRef,()=>(document.querySelector('.ant-picker-panel-container')||innerRef.current)],'mousedown')

    const handleSave=useMemoizedFn(async ()=>{
       try{
        if(!editing){
            return
        }
        const value=await form.validateFields([dataIndex])
        console.log('value',value)
        onSave?.({
            prefix,
            dataIndex,
            value
        })
        setEditing(false)
       }catch(e){
            console.log('错误',e)
       }
    })
    const onBlur=useCallback((e)=>{
        setTimeout(()=>{
            if(document.activeElement!==ref.current){
              //  handleSave()
            }
        },200)
    },[handleSave])
    const handleClick=useCallback(()=>{
        if(editing){
            return
        }
        setEditing(true)
    },[editing])
    useEffect(()=>{
        if(editing&&ref.current){
                  ref.current.focus?.()
        }
    },[ref.current,editing])

    const renderDom=editing?<div key={'edit'}>
        {children({editing,onBlur,ref,value})}
    </div>:<div onClick={handleClick} key={'detail'}>
         {children({editing,onBlur,ref,value})}
    </div>
    return <td ref={innerRef} className={classNames(styles.editCell,{
            [styles.editCellEditing]:editing
        })} >
           {renderDom}
    </td>
}
const EditPage = () => {
    const [form] = Form.useForm()

    const [anquanCheck] = useState(() => [{
        desc: `地盤聯合檢查\n（地盤這全施工計劃每月自檢+地盤安全同城聯檢+地盤自行組織的安全檢查）`

    }, {
        desc: `公司領導及安環部檢查\n（公司領導帶班檢查+公司安環部對地盤檢查）`
    }, {
        desc: `專項檢查\n（公司安環部專項檢查+地盤整潔檢查+地盤防疫檢查+公司安環要求的專項檢查`
    }])

    const yjyxColumns=useMemo(()=>[
        {
            title:'演习主题',
            dataIndex:'exerciseTheme',
            editable:true,
            renderFormItem:()=>{
                return <Form.Item name="exerciseTheme">
                    <Input></Input>
                </Form.Item>
            }
        },{
            title:'人数',
            dataIndex:''
        }
    ],[])
    const [yjyxData,setYjyxData]=useState([])
    const tabItems = useMemo<TabsProps['items']>(() => {

        const renderColFormItem = (formItemProps: FormItemProps, children: React.ReactElement) => {
            return <Col  {...defaultColProps}>
                <Form.Item {...formItemProps}>
                    {children}
                </Form.Item>
            </Col>
        }
        const collapseItems: CollapseProps['items'] = [{
            key: 'jbxx',
            label: '基本信息',
            children: <>
                <Row justify={'space-between'} gutter={12}>
                    {renderColFormItem({ label: '地盘编号', name: 'dipan' }, <Select></Select>)}
                    {renderColFormItem({ label: '工程公司', name: 'gs' }, <Select></Select>)}
                    {renderColFormItem({ label: '地盘名称', name: 'dipan' }, <Input></Input>)}
                    {renderColFormItem({ label: '地盘经理', name: 'dipanmanage' }, <Select></Select>)}
                    {renderColFormItem({ label: '月报月份', name: 'ybyf' }, <DatePicker.MonthPicker onChange={(date) => {
                        form.setFieldsValue({
                            ksrq: date ? dayjs(date).startOf('month').format('YYYY-MM-DD') : undefined,
                            jsrq: date ? dayjs(date).endOf('month').format('YYYY-MM-DD') : undefined,
                        })
                    }}></DatePicker.MonthPicker>)}
                    {renderColFormItem({ label: '开始与结束日期', name: 'daterange' }, <DatePicker.RangePicker></DatePicker.RangePicker>)}
                    {renderColFormItem({ label: '开始日期', name: 'ksrq', dependencies: ['ybyf'] }, <Input></Input>)}
                    {renderColFormItem({ label: '结束日期', name: 'jsrq', dependencies: ['ybyf'] }, <Input></Input>)}
                    {renderColFormItem({ label: '填报日期', name: 'tbrq' }, <DatePicker></DatePicker>)}
                    {renderColFormItem({ label: '数量', name: 'num' }, <InputNumber></InputNumber>)}
                    <Col>
                        {/* 使用 noStyle 并自定义错误提示的 Form.Item */}
                        <Form.Item
                            label="自定义错误提示项"
                            required
                            style={{ marginBottom: 24 }} // 保留一些布局间距
                        >
                            <Form.Item
                                name="customErrorField"
                                rules={[{ required: true, message: '此项为必填项!' }]}
                                noStyle
                            >
                                {/* 使用 Form.Item 的 shouldUpdate 和 getFieldError 来监听并获取错误 */}
                                <Form.Item shouldUpdate>
                                    {() => {
                                        const errors = form.getFieldError('customErrorField');
                                        const hasError = errors.length > 0;
                                        const fieldValue = form.getFieldValue('customErrorField');

                                        // 定义 Popover 的内容
                                        const popoverContent = (
                                            <div style={{ color: '#ff4d4f', fontSize: '12px' }}>
                                                {errors.map((error, index) => (
                                                    <div key={index}>{error}</div>
                                                ))}
                                            </div>
                                        );
                                        return (
                                            <Popover
                                                content={popoverContent}
                                                trigger="focus" // 获得焦点时显示（例如点击或 tab 聚焦）
                                                open={hasError} // 有错误且字段被操作过时才打开
                                                placement="topLeft" // 提示出现的位置
                                            >
                                                <Input
                                                    placeholder="我通过 Popover 展示错误"
                                                    suffix={<InfoCircleOutlined style={{ color: '#ff4d4f', visibility: hasError ? 'visible' : 'hidden' }} />
                                                    }
                                                    status={hasError ? 'error' : ''} // 为输入框添加错误状态样式
                                                    style={{ width: '100%' }}
                                                />
                                            </Popover>
                                        );
                                    }}
                                </Form.Item>
                            </Form.Item>
                        </Form.Item>

                    </Col>
                </Row>
            </>
        }, {
            key: 'anquanjiancha',
            label: '安全检查',
            children: (<>

                <Form.List name={'checkList'}>{(fields, operation, meta) => {
                    //  const error=form.getFieldsError(['tables'])
                    //  console.log('error',meta.errors)

                    return (
                        <>
                     <Form.Item noStyle shouldUpdate>
                    {(form) => {

                        const errors = Array.from(new Set(form.getFieldsError().filter(d=>d.name.includes('checkList')).flatMap(d => d.errors)))
                        return <Popover placement='topRight' open={errors.length > 0} content={<div style={{ fontSize: 12, color: 'red' }}>
                            <Form.ErrorList errors={errors}></Form.ErrorList>
                        </div>}><div></div></Popover>
                    }}
                </Form.Item>
                            {/* <Form.Item shouldUpdate>
                                {(form) => {

                                    const filed_erros = form.getFieldsError()
                                    const table_erros = filed_erros.find(d => d.name[0] === 'tables' && d.errors.length)
                                    const erros = table_erros?.errors || []
                                    console.log('erros', erros)
                                    return <Form.ErrorList errors={erros}></Form.ErrorList>
                                }}
                            </Form.Item> */}
                            <table className={styles.table}>
                                <colgroup>
                                    <col ></col>
                                    <col width={160}></col>
                                    <col width={160}></col>
                                    <col width={160}></col>
                                </colgroup>
                                <thead>
                                    <tr>
                                        <th>类别</th>
                                        <th>次数</th>
                                        <th>建议点/改善点(个)</th>
                                        <th>不安全点(个)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {fields.map((field, index) => {
                                        const { key, name, ...restField } = field

                                        return <tr key={field.key}>
                                            <td>
                                                {form.getFieldValue(['checkList', name, 'checkTypeName'])}
                                            </td>
                                            <td>
                                                <Form.Item noStyle shouldUpdate>{(form) => {
                                                    const errors = form.getFieldError(['tables', name, 'count1'])
                                                    const popoverContent = (
                                                        <div style={{ color: '#ff4d4f', fontSize: '12px' }}>
                                                            {errors.map((error, index) => (
                                                                <div key={index}>{error}</div>
                                                            ))}
                                                        </div>
                                                    );
                                                    return <Popover open={errors.length > 0} placement='topRight' content={popoverContent}>
                                                        <div>
                                                            <Form.Item rules={[{
                                                                type: 'integer',
                                                                required: true,
                                                                message: '請填寫數量'
                                                            }]} {...restField} noStyle name={[field.name, 'times']}>
                                                                <InputNumber min={0} precision={0} size='small'></InputNumber>
                                                            </Form.Item>
                                                        </div>
                                                    </Popover>
                                                }}</Form.Item>

                                            </td>
                                            <td>
                                                <Form.Item {...restField} required noStyle rules={[{ required: true, type: 'integer', message: '請填寫' }]} name={[field.name, 'suggestionNum']}>
                                                    <InputNumber precision={0} min={0} size='small'></InputNumber>
                                                </Form.Item></td>
                                            <td>
                                                <Form.Item {...restField} required noStyle rules={[{ required: true, type: 'integer', message: '請填寫' }]} name={[field.name, 'unsafePointNum']}>
                                                    <InputNumber precision={0} min={0} size='small'></InputNumber>
                                                </Form.Item>
                                            </td>
                                        </tr>
                                    })}
                                    <Form.Item shouldUpdate noStyle>
                                        {(form) => {
                                            let count1_total = 0, count2_total = 0, count3_total = 0
                                            let tables = form.getFieldValue('tables') || []
                                            tables.forEach(d => {
                                                count1_total += Number.isFinite(d.times) ? d.times : 0
                                                count2_total += Number.isFinite(d.suggestionNum) ? d.suggestionNum : 0
                                                count3_total += Number.isFinite(d.unsafePointNum) ? d.unsafePointNum : 0
                                            })
                                            return <tr>
                                                <th>总计</th><th>{count1_total}</th><th>{count2_total}</th><th>{count3_total}</th>
                                            </tr>
                                        }}
                                    </Form.Item>
                                </tbody></table></>)
                }}</Form.List>

            </>)
        }, {
            key: 'anquanpeixun',
            label: '安全培訓',
            children: (<>

                <Form.List name={'trainingDtoList'}>{(fields, operation, meta) => {
                    //  const error=form.getFieldsError(['tables'])
                    //  console.log('error',meta.errors)

                    return <Form.Item shouldUpdate noStyle>
                        {(form) => {
                            const trainingNumErrors = form.getFieldsError(fields.map(field => {
                                return ['trainingDtoList', field.name, 'trainingNum']
                            }))
                            const attendanceErrors = form.getFieldsError(fields.map(field => {
                                return ['trainingDtoList', field.name, 'attendance']
                            }))
                            const errors = Array.from(new Set(trainingNumErrors.concat(attendanceErrors).flatMap(d => d.errors)))
                            // console.log('trainingNumErrors',trainingNumErrors,attendanceErrors)
                            return (
                                <>
                                    <Popover placement='topRight' open={errors.length > 0} content={<div style={{ fontSize: 12, color: 'red' }}>
                                        <Form.ErrorList errors={errors}></Form.ErrorList>
                                    </div>}><div></div></Popover>
                                    <table className={styles.table}>
                                        <colgroup>
                                            <col ></col>
                                            <col width={160}></col>
                                            <col width={160}></col>
                                        </colgroup>
                                        <thead>
                                            <tr>
                                                <th>类别</th>
                                                <th>培訓次数</th>
                                                <th>出席人數</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {fields.map((field, index) => {
                                                const { key, name, ...restField } = field

                                                return <tr key={field.key}>
                                                    <td>
                                                        {form.getFieldValue(['trainingDtoList', name, 'typeName'])}
                                                    </td>
                                                    <td>
                                                        <Form.Item {...restField} required noStyle rules={[{ required: true, type: 'integer', message: '請填寫培訓次数' }]} name={[field.name, 'trainingNum']}>
                                                            <InputNumber precision={0} min={0} size='small'></InputNumber>
                                                        </Form.Item></td>
                                                    <td>
                                                        <Form.Item {...restField} required noStyle rules={[{ required: true, type: 'integer', message: '請填寫出席人數' }]} name={[field.name, 'attendance']}>
                                                            <InputNumber precision={0} min={0} size='small'></InputNumber>
                                                        </Form.Item>
                                                    </td>
                                                </tr>
                                            })}
                                            <Form.Item shouldUpdate noStyle>
                                                {(form) => {
                                                    let count1_total = 0, count2_total = 0
                                                    let tables = form.getFieldValue('trainingDtoList') || []
                                                    tables.forEach(d => {
                                                        count1_total += Number.isFinite(d.trainingNum) ? d.trainingNum : 0
                                                        count2_total += Number.isFinite(d.attendance) ? d.attendance : 0
                                                    })
                                                    return <tr>
                                                        <th>总计</th><th>{count1_total}</th><th>{count2_total}</th>
                                                    </tr>
                                                }}
                                            </Form.Item>
                                        </tbody></table></>)
                        }}
                    </Form.Item>
                }}</Form.List>

            </>)
        }, {
            key: 'd1',
            label: '地盘奖励',
            children: (<>

                <div style={{ overflowX: 'auto' }}>
                    <table className={styles.table} style={{ tableLayout: 'fixed' }}>
                        <colgroup>
                            <col width={260}></col>
                            <col width={180}></col>
                            <col width={180}></col>
                            <col width={140}></col>
                            <col width={120}></col>
                            <col width={120}></col>
                            <col width={140}></col>
                            <col width={120}></col>
                            <col width={120}></col>
                        </colgroup>
                        <thead>
                            <tr>
                                <th colSpan={4}>行为安全之星活动开展情况</th>
                                <th colSpan={3}>前线分区责任制奖励</th>
                                <th colSpan={2}>分判商打理人安全管理奖励</th>
                            </tr>
                            <tr>
                                <td>已派出行为安全之星表彰卡（数量）</td>
                                <td>行为安全之星（人数）</td>
                                <td>表彰卡兑换礼券（银码）</td>
                                <td>合计奖金</td>
                                <td>管工人数</td>
                                <td>助管人数</td>
                                <td>奖金</td>
                                <td>人数</td>
                                <td>奖金</td>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>
                                    <Form.Item name={'cardNum'} rules={[{
                                        type: 'integer',
                                        required: true,
                                        message: '不能爲空'
                                    }]}>
                                        <InputNumber precision={0} min={0}></InputNumber>
                                    </Form.Item>
                                </td>
                                <td>
                                    <Form.Item name={'safetyStarNum'} rules={[{
                                        type: 'integer',
                                        required: true,
                                        message: '不能爲空'
                                    }]}>
                                        <InputNumber precision={0} min={0}></InputNumber>
                                    </Form.Item>
                                </td>
                                <td>
                                    <Form.Item name={'exchangeCoupon'}>
                                        <Input></Input>
                                    </Form.Item>
                                </td>
                                <td>
                                    <Form.Item name={'totalBonus'} rules={[{
                                        type: 'number',
                                        required: true,
                                        message: '不能爲空'
                                    }]}>
                                        <InputNumber min={0}></InputNumber>
                                    </Form.Item>
                                </td>
                                <td>
                                    <Form.Item name={'plumbersNum'} rules={[{
                                        type: 'integer',
                                        required: true,
                                        message: '不能爲空'
                                    }]}>
                                        <InputNumber min={0} precision={0}></InputNumber>
                                    </Form.Item>
                                </td>
                                <td>
                                    <Form.Item name={'assistantsNum'} rules={[{
                                        type: 'integer',
                                        required: true,
                                        message: '不能爲空'
                                    }]}>
                                        <InputNumber min={0} precision={0}></InputNumber>
                                    </Form.Item>
                                </td>
                                <td>
                                    <Form.Item name={'assistantsBonus'} rules={[{
                                        type: 'integer',
                                        required: true,
                                        message: '不能爲空'
                                    }]}>
                                        <InputNumber min={0} ></InputNumber>
                                    </Form.Item>
                                </td>
                                <td>
                                    <Form.Item name={'distributorNum'} rules={[{
                                        type: 'integer',
                                        required: true,
                                        message: '不能爲空'
                                    }]}>
                                        <InputNumber min={0} precision={0}></InputNumber>
                                    </Form.Item>
                                </td>
                                <td>
                                    <Form.Item name={'distributorBonus'} rules={[{
                                        type: 'integer',
                                        required: true,
                                        message: '不能爲空'
                                    }]}>
                                        <InputNumber min={0} ></InputNumber>
                                    </Form.Item>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div></>)
        }, {
            key: 'aaaaa',
            label: '应急演习',
            children: <>
            
                <Form.List name={'exerciseList'}>
                    {(fields, operation) => {
                        const data = form.getFieldValue('exerciseList')
                        return <>
                            <Row justify={'end'} style={{marginBottom:6}}>
                                <Col flex={'none'}>
                                    <Space size={'small'}>
                                        <Button size={'small'} icon={<PlusOutlined></PlusOutlined>} onClick={()=>{
                                            operation.add({})
                                        }}>插入行</Button>
                                        <Button size={'small'} icon={<CopyOutlined></CopyOutlined>}>複製行</Button>
                                        <Button size={'small'} icon={<DeleteOutlined></DeleteOutlined>}>刪除行</Button>
                                    </Space>
                                </Col>
                            </Row>
                                 <Form.Item noStyle shouldUpdate>
                    {(form) => {

                        const errors = Array.from(new Set(form.getFieldsError().filter(d=>d.name.includes('exerciseList')).flatMap(d => d.errors)))
                        return <Popover placement='topLeft' open={errors.length > 0} content={<div style={{ fontSize: 12, color: 'red' }}>
                            <Form.ErrorList errors={errors}></Form.ErrorList>
                        </div>}><div></div></Popover>
                    }}
                </Form.Item>
                            <table className={styles.table}>
                                <colgroup>
                                    <col width={60}></col>
                                    <col></col>
                                      <col width={140}></col>
                                        <col width={200}></col>
                                </colgroup>
                                <thead>
                                    <tr>
                                        <th>序號</th>
                                        <th>演習主題</th>
                                        <th>人數</th>
                                        <th>日期</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {
                                        fields.map((field,index)=>{
                                            const record=form.getFieldValue(['exerciseList',field.name])
                                            return <tr key={field.key}>
                                                <td>{index+1}</td>
                                                <TableEditCellWrapper prefix='exerciseList' name={[field.name,'exerciseTheme']}>{({value,editing,onBlur,ref})=>{
                                                        return editing?<Form.Item rules={[{
                                                            required:true,
                                                            message:'请输入主题',
                                                            whitespace:true
                                                        }]} noStyle name={[field.name,'exerciseTheme']}>
                                                            <Input size='small' ref={ref} onBlur={onBlur} ></Input>
                                                        </Form.Item>:value
                                                    }}</TableEditCellWrapper>
                                                     <TableEditCellWrapper  prefix='exerciseList' name={[field.name,'exercisePersonnel']}>{({value,editing,onBlur,ref})=>{
                                                        return editing?<Form.Item rules={[{
                                                            required:true,
                                                            type:'integer',
                                                            message:'請填寫人數'
                                                        }]} noStyle name={[field.name,'exercisePersonnel']}>
                                                           <InputNumber size='small' ref={ref} onBlur={onBlur}></InputNumber>
                                                        </Form.Item>:value
                                                    }}</TableEditCellWrapper>
                                                               <TableEditCellWrapper  prefix='exerciseList' name={[field.name,'exerciseDate']}>{({value,editing,onBlur,ref})=>{
                                                        const date= value
                                                        return editing?<Form.Item rules={[{
                                                    required:true,
                                                      type:'object',
                                                    message:'請填寫日期'
                                                }]} noStyle name={[field.name,'exerciseDate']}>
                                                           <DatePicker size='small' ref={ref} onBlur={onBlur} />
                                                        </Form.Item>:date?date.format('YYYY-MM-DD'):date
                                                    }}</TableEditCellWrapper>
                                            </tr>
                                        })
                                    }
                                </tbody>
                            </table>
                        </>
                    }}
                </Form.List>
            </>
        }, {
            key: 'b',
            label: '大型机械数量统计(动态行)',
            children: (<>
                <Form.List name={'machineryList'}>
                    {(fields, operation) => {
                        console.log('fields', 'f')
                        return <>
                            <Row justify={'end'} style={{ marginBottom: 5 }}>
                                <Col flex={'none'}>
                                    <Space>
                                        <Button onClick={() => {
                                            operation.add({
                                                editState: 'add'
                                            })
                                            form.setFieldValue('machineryListEditIndex', fields.length)
                                        }} size='small' type='primary' ghost icon={<PlusOutlined></PlusOutlined>}></Button>
                                        <Button size='small' danger icon={<MinusOutlined></MinusOutlined>}></Button>
                                    </Space>
                                </Col>
                            </Row>
                            <table className={styles.table}>
                                <colgroup>
                                    <col width={60}></col>
                                    <col width={160}></col>
                                    <col width={160}></col>
                                    <col width={120}></col>
                                    <col width={120}></col>
                                    <col></col>

                                </colgroup>
                                <thead>
                                    <tr>
                                        <th>序号</th>
                                        <th>机械类型</th>
                                        <th>机械名称</th>
                                        <th>机械仓机械数量</th>
                                        <th>人判机械数量</th>
                                        <th>总数量</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {
                                        fields.map((field, i) => {
                                            const record = form.getFieldValue(['machineryList', field.name])
                                            const machineryListEditIndex = form.getFieldValue('machineryListEditIndex')
                                            // console.log('record',record,'machineryListEditIndex',machineryListEditIndex)
                                            const editState = record.editState
                                            const isEdit = i === machineryListEditIndex
                                            const selected = i === machineryListEditIndex
                                            return isEdit ? <tr key={field.key} className={classNames({
                                                [styles.selectedRow]: selected
                                            })}>
                                                <td>
                                                    <Popover placement='leftBottom' getPopupContainer={(target) => {
                                                        return target.closest('.ant-collapse-content') || document.body
                                                    }} open={true} content={
                                                        <Space direction='vertical'>
                                                            <Button icon={<PlusOutlined></PlusOutlined>} onClick={() => {
                                                                operation.add({
                                                                    editState: 'add'
                                                                }, i + 1)
                                                                form.setFieldValue('machineryListEditIndex', i + 1)
                                                            }}></Button>
                                                            <Button icon={<CopyOutlined></CopyOutlined>}></Button>
                                                            <Button icon={<DeleteOutlined></DeleteOutlined>}></Button>
                                                        </Space>
                                                    }>
                                                        <div>
                                                            {i + 1}
                                                        </div>
                                                    </Popover>
                                                </td>
                                                <td>
                                                    <Form.Item rules={[{
                                                        type:'string',
                                                        required:true,
                                                        message:'请选择类型'
                                                    }]} noStyle name={[field.name, 'machineryType']}>
                                                        <Select size='small' style={{ width: '100%' }} onChange={(value) => {

                                                            form.setFieldValue(['machineryList', field.name, 'machineryName'], undefined)
                                                        }} options={[{ label: '移动机械', value: '移动机械' }, { label: '运输机械', value: '运输机械' }]}></Select>
                                                    </Form.Item>
                                                </td>
                                                <td>
                                                    <Form.Item noStyle  rules={[{
                                                        type:'string',
                                                        required:true,
                                                        message:'请选择机械'
                                                    }]} dependencies={[['machineryList', field.name, 'machineryType']]} >
                                                        {(form) => {
                                                            const type = form.getFieldValue(['machineryList', field.name, 'machineryType'])
                                                            console.log('type', type)
                                                            const options = type === '移动机械' ? [{ label: '推土机', value: '推土机' }, {
                                                                label: '挖掘机',
                                                                value: '挖掘机'
                                                            }] : [{
                                                                label: '开土机',
                                                                value: '开土机'
                                                            }, {
                                                                label: '屋面吊',
                                                                value: '屋面吊'
                                                            }]
                                                            return <Form.Item noStyle name={[field.name, 'machineryName']}>
                                                                <Select size='small' style={{ width: '100%' }} options={options}></Select>
                                                            </Form.Item>
                                                        }}
                                                    </Form.Item>
                                                </td>
                                                <td>
                                                    <Form.Item  rules={[{
                                                        type:'integer',
                                                        required:true,
                                                        message:'请输入数量'
                                                    }]} noStyle name={[field.name, 'warehouseNum']}>
                                                        <InputNumber size='small' min={0} precision={0}></InputNumber>
                                                    </Form.Item>
                                                </td>
                                                <td>
                                                    <Form.Item rules={[{
                                                        type:'integer',
                                                        required:true,
                                                        message:'请输入数量'
                                                    }]}  noStyle name={[field.name, 'dividedNum']}>
                                                        <InputNumber size='small' min={0} precision={0}></InputNumber>
                                                    </Form.Item>
                                                </td>
                                                <td>
                                                    <Form.Item noStyle dependencies={[['machineryList', field.name, 'warehouseNum'], ['machineryList', field.name, 'dividedNum']]}>
                                                        {(form) => {
                                                            let warehouseNum = form.getFieldValue(['machineryList', field.name, 'warehouseNum'])
                                                            let dividedNum = form.getFieldValue(['machineryList', field.name, 'dividedNum'])
                                                            return getTotal(warehouseNum, dividedNum)
                                                        }}
                                                    </Form.Item>
                                                </td>

                                            </tr> : <tr key={field.key} className={classNames({
                                                [styles.selectedRow]: selected
                                            })} onClick={() => {
                                                form.setFieldValue('machineryListEditIndex', i)
                                                form.setFieldValue('machineryList', form.getFieldValue('machineryList'))
                                            }}>
                                                <td>
                                                    <div style={{ position: 'relative' }}>
                                                        {i + 1}
                                                    </div>
                                                </td>
                                                <td>{record.machineryType}</td>
                                                <td>{record.machineryName}</td>
                                                <td>{record.warehouseNum}</td>
                                                <td>{record.dividedNum}</td>
                                                <td>{getTotal(record.warehouseNum, record.dividedNum)}</td>
                                            </tr>
                                        })
                                    }
                                </tbody>
                            </table>
                            <div style={{ marginTop: 5 }}>
                                <Form.Item label='本月检查次数' layout='horizontal'>
                                    <InputNumber precision={0} min={0}></InputNumber>
                                </Form.Item>
                            </div>
                        </>
                    }}
                </Form.List>
            </>)
        },{
            key: 'aaaaa20',
            label: '应急演习2',
            children: <>
                <EditableTable dataSource={yjyxData} onChange={(data)=>{
                    setYjyxData(data)
                }} columns={yjyxColumns}></EditableTable>
            </>
        }]
        return [{
            key: 'jb',
            label: '一般表单',
            // 8
            children: (<Form variant='outlined' scrollToFirstError initialValues={{
                dipan: null,
                num: null,
                checkList: form_init_data.checkList,
                trainingDtoList: form_init_data.trainingDtoList,
                machineryList: [{ editState: 'add' }],
                machineryListEditIndex: 0,
                exerciseList: [{}] // 应急

            }} form={form} layout='vertical' wrapperCol={{ span: 24 }}>
                <Collapse bordered={false} ghost style={{ width: '100%' }} items={collapseItems} accordion={false} defaultActiveKey={collapseItems.map(d => d.key as string)} ></Collapse>
            </Form>)
        }]
    }, [yjyxColumns,yjyxData])
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