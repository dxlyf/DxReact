import {Form,Collapse,Tabs,Row,Space,Col,Input,Select,Upload,DatePicker,Table,Descriptions,Grid} from 'antd'
import type{FormItemProps, TabsProps, CollapseProps} from 'antd'
import {useMemo, useRef} from 'react'
import dayjs from 'dayjs'
import {useMemoizedFn,useLatest,useUpdateEffect} from 'ahooks'
import styles from './index.module.scss'
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
                {renderColFormItem({label:'地盘名称',name:'gs'},<Input></Input>)}
                {renderColFormItem({label:'地盘经理',name:'gs'},<Select></Select>)}
                {renderColFormItem({label:'月报月份',name:'ybyf'},<DatePicker.MonthPicker></DatePicker.MonthPicker>)}
                {renderColFormItem({label:'开始日期',name:'ksrq',dependencies:['jsrq']},<DatePicker></DatePicker>)}
                {renderColFormItem({label:'结束日期',name:'jsrq',dependencies:['ksrq'],rules:[{type:'object',validator:async (rule,value)=>{
                         const beginDate=form.getFieldValue('ksrq')
                        if(!beginDate||!value){
                            return
                        }
                        if(dayjs(value).isBefore(beginDate)){
                             throw '结束日期不能小于开始日期'
                        }
                }}]},<DatePicker></DatePicker>)}
                {renderColFormItem({label:'填报日期',name:'tbrq'},<DatePicker></DatePicker>)}
               </Row>
            </>
        },{
            key:'anquanjiancha',
            label:'安全检查',
            children:(<>
                <table className={styles.table}>
                    <colgroup>
                        <col width={'25%'}></col>
                        <col width={'25%'}></col>
                        <col width={'25%'}></col>
                        <col width={'25%'}></col>
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
                        <tr>
                            <td>
                                地盤聯合檢查（地盤安全施工計劃每月自檢+地盤安全同城聯檢+地盤自行組織的安全檢查）
                            </td>
                            <td></td>
                            <td></td>
                            <td></td>
                        </tr>
                    </tbody>
                </table>
            </>)
        }]
        return [{
            key:'jb',
            label:'一般表单',
            // 8
            children:(<Form form={form} layout='vertical' wrapperCol={{span:24}}>
                <Collapse bordered={false} ghost  style={{width:'100%'}} items={collapseItems} accordion={false} defaultActiveKey={collapseItems.map(d=>d.key as string)} ></Collapse>
            </Form>)
        }]
    },[])
    return <Tabs items={tabItems} defaultActiveKey='jb' style={{background:'#fff'}}></Tabs>
}

export default  EditPage