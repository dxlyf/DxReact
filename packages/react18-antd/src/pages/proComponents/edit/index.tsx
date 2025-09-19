import {Collapse,Tabs} from 'antd'
import type {CollapseProps} from 'antd'
import { ProForm ,ProFormItem,ProFormDependency ,ProFormSelect,ProFormText,ProFormGroup,ProFormDatePicker,ProFormDateRangePicker} from '@ant-design/pro-components'
import type {  ProFormProps ,ProFormInstance,ProFormItemProps,ProFormFieldProps} from '@ant-design/pro-components'
import React,{useImperativeHandle, useMemo, useRef} from 'react'
import dayjs from 'dayjs'


type EditPageInstance={
    submit:()=>void
}
const EditPage=(props:{editRef:React.Ref<EditPageInstance>})=>{
    const {editRef}=props
    const formRef=useRef<ProFormInstance>()
    const collapseItems=useMemo<Required<CollapseProps>['items']>(()=>{
        return [
            {
                key:'a',
                label:'基本信息',
                children:(
                   <>
                   <ProFormGroup>
                     <ProFormSelect colProps={{sm:8}} label='地盘编号' name={'dipanno'}></ProFormSelect>
                     <ProFormSelect colProps={{sm:8}}  label='工程公司' name={'gongsi'}></ProFormSelect>
                    <ProFormText colProps={{sm:8}}  label='地盘名称' name={'dipanname'}></ProFormText>
                   </ProFormGroup>
                 <ProFormGroup>
                     <ProFormDatePicker.Month   colProps={{sm:8}} label='月报月份' name={'yuebaoyuefen'}></ProFormDatePicker.Month>
                     <ProFormDatePicker dependencies={['endDate']} rules={[{
                        required:true,
                        type:'object',
                        async validator(rule, value, callback) {
                           let endDate= formRef.current?.getFieldValue('endDate')
                           if(!endDate||!value){
                               return
                           }else {
                              if(dayjs(value).isAfter(endDate,'date')){
                                 throw '开始日期不能大于结束日期'
                              }
                           }
                        },
                     }]} colProps={{sm:8}}   label='开始日期' name={'beginDate'}></ProFormDatePicker>
                    <ProFormDatePicker  dependencies={['beginDate']}  rules={[{
                        required:true,
                        type:'object',
                        async validator(rule, value, callback) {
                           let beginDate= formRef.current?.getFieldValue('beginDate')
                           if(!beginDate||!value){
                               return
                           }else {
                              if(dayjs(value).isBefore(beginDate,'date')){
                                 throw '结束日期不能小于开始日期'
                              }
                           }
                        },
                     }]}  colProps={{sm:8}}  label='结束日期' name={'endDate'}></ProFormDatePicker>
                   </ProFormGroup>
                   </>
                )
            }
        ]
    },[])
    return <>
        <ProForm  formRef={formRef}  layout='vertical' grid={true} >
            <Collapse style={{width:'100%'}} items={collapseItems} defaultActiveKey={collapseItems.map(d=>d.key as string)}></Collapse>
        </ProForm>
    </>
}

export default EditPage