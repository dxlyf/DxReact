import {BetaSchemaForm,QueryFilter } from '@ant-design/pro-components'
import useMemoizedFn  from '../../hooks/useMemoizedFn'
import {Form,Popover,Space,Button,Input,InputNumber,Row,Col} from 'antd'
import React,{ useMemo, useState,useRef,useLayoutEffect } from 'react'
import {useCompany} from './hooks/useCompany'
import styles from './index.module.css';
import classNames from '../../utils/classNames'
import GenericFormItem,{formItemEnum} from '../GenericFormItem'

/**
 * type BetaSchemaFormProps=Parameters<typeof BetaSchemaForm>[0]
type UseSchemaFormProps={
    actionRef?:React.RefObject<ActionType>
    manualRequest?:boolean // 是否手动调用table刷新请求
    defaultFilterParams?:any
    delayInitRequestTime?:number // 初始化延迟请求
}&BetaSchemaFormProps
export type {
    ProFormColumnsType as SearchFormColumn
}

 */
/**
 * 
 * @param {()=>ProFormColumnsType<unknown,unknown>[]} factory 
 * @param { unknown[]} deps 
 * @returns 
 */
 const useProFormColumns=(factory,deps)=>{
    return useMemo(factory,deps)
}
/**
 * 
 * @param {UseSchemaFormProps} props 
 * @returns 
 */
 const useProForm=(props)=>{
    const {expandable=false,onFinish,onReset,companyConfig,onInit,delayInitRequestTime=200,manualRequest=false,form:propForm,defaultFilterParams={},columns:propColumns,...restProps}=props
    const [form]=Form.useForm(propForm)
    const formRef=useRef()
    const actionRef=useRef()
    const [formFieldValues,setFormFieldValues]=useState(()=>defaultFilterParams)
    const handleFinish=useMemoizedFn(async (values)=>{
        setFormFieldValues({...values})
        onFinish?.(values)
        actionRef.current?.reload(true)
    })
    const handleReset=useMemoizedFn(async (values)=>{
        setFormFieldValues({...values})
        onReset?.(values)
        actionRef.current?.reload(true)
    })
    const {columns:companyFilterColumns}=useCompany({
        form,
        ...(companyConfig||{})
    })
    const columns=useMemo(()=>{
        return companyConfig?companyFilterColumns.concat(propColumns):propColumns
    },[propColumns,companyFilterColumns])

    const handleInit=useMemoizedFn((values,form)=>{
        onInit?.(values,form);
        if(!manualRequest){
            setTimeout(()=>{
                handleFinish(values)
            },[delayInitRequestTime])
        }
    })
    const proFormProps={
        formRender:(dom)=>{
            if(expandable){
                return dom
            }
            return <Space>
                {dom}
                <Button type='primary' onClick={()=>{
                form?.submit()
            }}>查询</Button>
               <Button  onClick={()=>{
                formRef.current.resetFields()
                handleReset(formRef.current.getFieldFormatValue())
            }}>重置</Button>
            </Space>
        },
        ...(expandable?{
            submitter:{
                render(props,dom){
                    return dom.reverse()
                },
                searchConfig:{
                    submitText:'查询'
                }
            },
            style:{
                width:'100%',

            },
            submitterColSpanProps:{
               flex:'none',
               className:styles.proFormSearchExpandBtn
            },
            span:6,         
            layoutType:'QueryFilter',
            layout:'inline',
            className:classNames('ah-search-form',styles.proFormSearchExpand),
        }:{
            layoutType:'Form',
            submitter:false,
            wrapperCol:{flex:200},
            className:classNames('ah-search-form',styles.proFormSearch),
        }),
        labelWidth:0,
        onFinish:handleFinish,
        onReset:handleReset,
        onInit:handleInit,
        columns,
        ...restProps,
        form,
        formRef
    }
    return {
        form,
        formRef,
        actionRef,
        formFieldValues,
        proFormProps
    }
}
/**
 * 
 * @param {BetaSchemaFormProps} props 
 * @returns 
 */
const ProForm=(props)=>{
    const {formRender,className,...restProps}=props
    const dom= <BetaSchemaForm className={classNames(styles.proForm,className)} {...restProps}></BetaSchemaForm>
    return formRender?formRender(dom):dom
}
const ProFilterForm=(props)=>{
    return <QueryFilter {...props}></QueryFilter>
}


const ProFormItemInner = (props) => {
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
    useLayoutEffect(()=>{
        setOpen(hasError)
    },[hasError])
    return <>
        <Popover onOpenChange={(open) =>{
            if(!open){
                 setOpen(false)
            }
        }}
            content={popoverContent}
            trigger='click' // 获得焦点时显示（例如点击或 tab 聚焦）
            open={open} // 有错误且字段被操作过时才打开
            placement='top' // 提示出现的位置
        >
            {React.cloneElement(children, restProps)}
        </Popover>
    </>
}
const ProFormItem = (props) => {
    const { children, ...restProps } = props
    return <Form.Item noStyle {...restProps}>
        <ProFormItemInner {...(children?.props ?? {})}>{children}</ProFormItemInner>
    </Form.Item>
}

const MAX_DECIMAL_NUMBER=999999999.99 //999999999999.99
const MAX_INTEGER_COUNT=9999999 //2147483647




 const renderFormItem = (restItem) => {
  const { shouldUpdate , dependencies,type,render,order, ...restProps } = restItem
  if (!restProps.config) {
    restProps.config = {}
  }
  if (!restProps.config.style) {
    restProps.config.style = {}
  }
  if (restProps.config.style.width == undefined) {
    restProps.config.style.width = '100%'
  }
  if(type==='date'){
    type=formItemEnum.DATE_PICKER
    restProps.config.format='YYYY-MM-DD'
  }
  else if(type==='datetime'){
    type=formItemEnum.DATE_PICKER
    restProps.config.format='YYYY-MM-DD HH:mm:ss'
  }
  const dom=<GenericFormItem type={type} {...restProps}></GenericFormItem>
  if (shouldUpdate) {
    return <Form.Item noStyle shouldUpdate={shouldUpdate}>{(form)=>render?render(form,dom):dom}</Form.Item>
  }
  if (dependencies) {
    return <Form.Item noStyle dependencies={dependencies}>{(form)=>render?render(form,dom):dom}</Form.Item>
  }
  return render?render(null,dom):dom
}
 const renderFormItems = (items) => {
  return <Row gutter={16}>
    {items.map((item, index) => {
      const { span = 6, colProps = {}, hidden, ...restItem } = item
      return <Col key={item.name || index} span={span} {...colProps} >{hidden !== true && renderFormItem(restItem)}</Col>
    })}
  </Row>
}

export {
    MAX_DECIMAL_NUMBER,
    MAX_INTEGER_COUNT,
    renderFormItem,
    renderFormItems,
    ProForm,
    ProFilterForm,
    useCompany,
    useProForm,
    useProFormColumns,
    ProFormItem,
    ProFormItemInner 
}