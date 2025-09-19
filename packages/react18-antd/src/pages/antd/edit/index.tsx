import {Form,Collapse,Tabs,Row,Space,Col,Input,Select,Upload,DatePicker,Table,Descriptions,Grid, Button, InputNumber, Popover, Alert} from 'antd'
import type{FormItemProps, TabsProps, CollapseProps} from 'antd'
import {useCallback, useMemo, useRef, useState} from 'react'
import dayjs from 'dayjs'
import {useMemoizedFn,useLatest,useUpdateEffect} from 'ahooks'
import styles from './index.module.scss'
import { InfoCircleOutlined } from '@ant-design/icons'
const defaultWrapperCol={
    //>=1600
    xxl:{
        span:8
    },
    //>=1200
    xl:{
        span:6
    },
    // >=992
    lg:{
        span:5,
    },
    // >=768
    md:{
        span:3
    },
    // >=576
    sm:{
        span:2
    },
    // < 576
    xs:{
        span:1
    }
}
const defaultColProps={
    xs:24,
    sm:12,
    md:8,
    lg:5,
    xl:6,
    xxl:3,
}

const EditPage=()=>{
    const [form]=Form.useForm()

    const [anquanCheck]=useState(()=>[{
                    desc:`地盤聯合檢查\n（地盤這全施工計劃每月自檢+地盤安全同城聯檢+地盤自行組織的安全檢查）`

                },{
                    desc:`公司領導及安環部檢查\n（公司領導帶班檢查+公司安環部對地盤檢查）`
                },{
                    desc:`專項檢查\n（公司安環部專項檢查+地盤整潔檢查+地盤防疫檢查+公司安環要求的專項檢查`
                }])
    const tabItems=useMemo<TabsProps['items']>(()=>{

        const renderColFormItem=(formItemProps:FormItemProps,children:React.ReactElement)=>{
            return <Col  {...defaultColProps}>
            <Form.Item {...formItemProps}>
                {children}
            </Form.Item>
            </Col>
        }
        const collapseItems:CollapseProps['items']=[{
            key:'jbxx',
            label:'基本信息',
            children:<>
               <Row justify={'space-between'} gutter={12}>
                {renderColFormItem({label:'地盘编号',name:'dipan'},<Select></Select>)}
                {renderColFormItem({label:'工程公司',name:'gs'},<Select></Select>)}
                {renderColFormItem({label:'地盘名称',name:'dipan'},<Input></Input>)}
                {renderColFormItem({label:'地盘经理',name:'dipanmanage'},<Select></Select>)}
                {renderColFormItem({label:'月报月份',name:'ybyf'},<DatePicker.MonthPicker onChange={(date)=>{
                        form.setFieldsValue({
                            ksrq:date?dayjs(date).startOf('month').format('YYYY-MM-DD'):undefined,
                            jsrq:date?dayjs(date).endOf('month').format('YYYY-MM-DD'):undefined,
                        })
                }}></DatePicker.MonthPicker>)}
                {renderColFormItem({label:'开始与结束日期',name:'daterange'},<DatePicker.RangePicker></DatePicker.RangePicker>)}
                {renderColFormItem({label:'开始日期',name:'ksrq',dependencies:['ybyf']},<Input></Input>)}
                {renderColFormItem({label:'结束日期',name:'jsrq',dependencies:['ybyf']},<Input></Input>)}
                {renderColFormItem({label:'填报日期',name:'tbrq'},<DatePicker></DatePicker>)}
                {renderColFormItem({label:'数量',name:'num'},<InputNumber></InputNumber>)}
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
                  open={hasError } // 有错误且字段被操作过时才打开
                  placement="topLeft" // 提示出现的位置
                >
                  <Input
                    placeholder="我通过 Popover 展示错误"
                    suffix={ <InfoCircleOutlined style={{ color: '#ff4d4f',visibility:hasError?'visible':'hidden' }} />
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
        },{
            key:'anquanjiancha',
            label:'安全检查',
            children:(<>
         
                     <Form.List name={'tables'}>{(fields,operation,meta)=>{
                       //  const error=form.getFieldsError(['tables'])
                       //  console.log('error',meta.errors)
                      
                         return (
                         <>
                       <Form.Item  shouldUpdate>
                        {(form)=>{

                            const filed_erros=form.getFieldsError()
                            const table_erros=filed_erros.find(d=>d.name[0]==='tables'&&d.errors.length)
                            const erros=table_erros?.errors||[]
                            console.log('erros',erros)
                            return <Form.ErrorList errors={erros}></Form.ErrorList>
                        }}
                       </Form.Item>
                         <table className={styles.table}>
                    <colgroup>
                        <col ></col>
                        <col width={130}></col>
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
                       {fields.map((field,index)=>{
                            const {key,name,...restField}=field
                           
                            return <tr key={field.key}>
                                <td>
                                  {form.getFieldValue(['tables',name,'desc'])}
                                </td>
                                <td>
                                        <Form.Item noStyle shouldUpdate>{(form)=>{
                                            const errors=form.getFieldError(['tables',name,'count1'])
                                               const popoverContent = (
                                                <div style={{ color: '#ff4d4f', fontSize: '12px' }}>
                                                {errors.map((error, index) => (
                                                    <div key={index}>{error}</div>
                                                ))}
                                                </div>
                                            );
                                             return <Popover open={errors.length>0} placement='topRight' content={popoverContent}>
                                        <div>
                                            <Form.Item  rules={[{
                                        type:'integer',
                                        required:true,
                                        message:'請填寫數量'
                                    }]} {...restField} noStyle  name={[field.name,'count1']}>
                                            <InputNumber min={0} precision={0} size='small'></InputNumber>
                                        </Form.Item>
                                        </div>
                              </Popover>
                                        }}</Form.Item>
                                 
                                </td>
                                <td>     
                                    <Form.Item {...restField} required noStyle rules={[{required:true,type:'integer',message:'請填寫'}]}  name={[field.name,'count2']}>
                                    <InputNumber precision={0} min={0} size='small'></InputNumber>
                                  </Form.Item></td>
                                <td>
                                    <Form.Item {...restField} required noStyle rules={[{required:true,type:'integer',message:'請填寫'}]} name={[field.name,'count3']}>
                                    <InputNumber precision={0} min={0} size='small'></InputNumber>
                                  </Form.Item>
                                </td>
                            </tr>
                    })}
                        <Form.Item shouldUpdate noStyle>
                            {(form)=>{
                                 console.log('fffffff')
                         let count1_total=0,count2_total=0,count3_total=0
                         let tables=form.getFieldValue('tables')||[]
                         tables.forEach(d=>{
                            count1_total+=Number.isFinite(d.count1)?d.count1:0
                            count2_total+=Number.isFinite(d.count2)?d.count2:0
                            count3_total+=Number.isFinite(d.count3)?d.count3:0
                         })
                                return <tr>
                            <th>总计</th><th>{count1_total}</th><th>{count2_total}</th><th>{count3_total}</th>
                        </tr>
                            }}
                        </Form.Item>
                        </tbody></table></>)
                     }}</Form.List>
              
            </>)
        }]
        return [{
            key:'jb',
            label:'一般表单',
            // 8
            children:(<Form  variant='outlined'  scrollToFirstError initialValues={{
                dipan:null,
                num:null,
                tables:anquanCheck
            }} form={form} layout='vertical' wrapperCol={{span:24}}>
                <Collapse bordered={false} ghost  style={{width:'100%'}} items={collapseItems} accordion={false} defaultActiveKey={collapseItems.map(d=>d.key as string)} ></Collapse>
            </Form>)
        }]
    },[])
    const handleSubmit=useCallback(async ()=>{
            try{
                let values=await form.submit()
                console.log('values',values)
            }catch{}
    },[])
    return <>
        <Row justify={'end'}>
            <Col flex="none">
                <Space><Button type="primary" onClick={handleSubmit}>提交</Button></Space>
            </Col>
        </Row>
        <Tabs items={tabItems} defaultActiveKey='jb' style={{background:'#fff'}}></Tabs>

    </>
}

export default  EditPage