import React, { useCallback, useLayoutEffect, useMemo,useState, useRef,useEffect } from 'react'
import { Button,Form } from 'antd'
import { usePage, useRequest } from '../../ProPage'
import { useMemoizedFn,useLatest } from '../../../hooks'
import { approvalStatusOptions as defaultApprovalStatusOptions } from '../../ApprovalStatusSelect'

const EditMode={
    SEARCH:'search',
    EDIT:'edit'
}
/**
 * 公司地盘过滤列
 * @param {Object} props.form - 表单实例
 */
const useCompany = (props = {}) => {
    const {formItemFieldConfig={},mode=EditMode.SEARCH,siteCodeField='siteCode',siteNameField='siteName',companyField='company',approvalStatusField='approvalStatus',approvalStatusOptions=defaultApprovalStatusOptions,companyHidden=false,siteCodeHidden=false,siteNameHidden=false,approvalStatusHidden=false,onSiteCodeChange,form } = props
    const page = usePage()
    const [showRefreshButton, setShowRefreshButton] = useState(false);
    const { data, loading, request } = useRequest({
        manualRequest:true,
        requestConfig: {
            url: page.getServiceUrl(`/main/systemManagement/baseSiteListByUser`),
        },
        onTransform: (ret) => {
            return ret.data?.data ?? []
        },
        onSuccess() {
            setShowRefreshButton(false)
        },
        onError() {
            setShowRefreshButton(true)
        }
    })
    const companyOptions = useMemo(() => {
        return Array.isArray(data)?data.map(d => ({
            label: d.label,
            value: d.value,
        })):[]
    }, [data])
    const companyValue=Form.useWatch(companyField,form)
    const allSiteCodeOptions = useMemo(() => {
        return Array.isArray(data)?data.flatMap(d => {
            if (d.children) {
                return d.children.map(child => {
                    return {
                        label: `${child.value}`,
                        value: child.value,
                        siteName: child.label,
                        company: d.value,
                    }
                })
            }
            return []
        }):[]
    }, [data])
    const siteCodeOptions=useMemo(()=>{
        // if(mode===EditMode.EDIT){
        //     return allSiteCodeOptions
        // }
        return allSiteCodeOptions.filter(d=>!companyValue||d.company===companyValue)
    },[allSiteCodeOptions,companyValue])

    const handleFilterOption = useCallback((input, option) => {
        return (option?.label ?? '').toLowerCase().includes(input.toLowerCase());
    }, [])
    const handleCompanyChange = useMemoizedFn((value,option) => {
            const siteMap = {
                siteCode:undefined
            }
            if (!siteNameHidden) {
                siteMap[siteNameField] = undefined
            }
             form.setFieldsValue(siteMap)
    })
    const setSiteCodeAndDep=useMemoizedFn((value,option,slient=false)=>{
        if (value) {
            const { company, siteName } = option;
            const siteMap = {
                
            }
        
            if (!companyHidden) {
                siteMap[companyField] = company
            }
            if (!siteNameHidden) {
                siteMap[siteNameField] = siteName
            }
            form.setFieldsValue(siteMap)
            !slient&&onSiteCodeChange?.(value, option)
        } else {
            const resetFields=[siteCodeField]
            if(!siteNameHidden){
                resetFields.push(siteNameField)
            }
            if(mode===EditMode.EDIT){
                if(!companyHidden){
                    resetFields.push(companyField)
                }
                form.setFieldsValue(resetFields.reduce((a,v)=>{
                    a[v]=undefined
                    return a
                },{}))
            }else{
                form.resetFields(resetFields)
            }
            
        }
    })
    const handleSiteCodeChange = useMemoizedFn((value, option) => {
        setSiteCodeAndDep(value,option)
    })
    
    const orignalColumns = useMemo(() => {
        return [!companyHidden&&{
            title: '工程公司',
            dataIndex:companyField,
            valueType: 'select',
            width: 200,
            fieldProps: {
                options: companyOptions,
                placeholder: "請選擇工程公司",
                allowClear: true,
                filterOption: handleFilterOption,
                showSearch: true,
                onChange: handleCompanyChange,
               // popupMatchSelectWidth: false,
                loading: loading
            },

        }, !siteCodeHidden&&{
            title: '地盤編碼',
            dataIndex: siteCodeField,
            valueType:'select',
            width: 140,
            fieldProps: {
                options: siteCodeOptions,
                virtual:true,
                placeholder: "請選擇地盤編碼",
                allowClear: true,
                filterOption: handleFilterOption,
                showSearch: true,
                onChange: handleSiteCodeChange,
               // popupMatchSelectWidth: false,
                loading: loading
            },
            formItemProps: {
                dependencies:[companyField],
                extra: showRefreshButton && <Button size="small" type="link" loading={loading} onClick={() => {
                    request()
                }}>重新獲取地盤数据</Button>
            }
        },!siteNameHidden&&{
            title:'地盤名稱',
            dataIndex:siteNameField,
            valueType:'text',
            fieldProps:{
                placeholder:'請輸入地盤名稱',
                allowClear:true
            }
        },!approvalStatusHidden&&{
            title:'審批狀態',
            dataIndex:approvalStatusField,
            valueType:'select',
            fieldProps:{
                    style:{minWidth:140},
                    options:approvalStatusOptions,
                    placeholder:"請選擇審批狀態",
                    popupMatchSelectWidth:false,
                    mode:'multiple',
                    allowClear:true
            },
            transform(value){
                return Array.isArray(value)?value.join(','):value
            }
        }].filter(Boolean)
    }, [companyOptions,siteCodeOptions,loading,siteNameField,siteCodeField, showRefreshButton,companyHidden,siteNameHidden, request,companyField])
    // search form columns
    const columns=useMemo(()=>{
        return orignalColumns.map(col=>({...col,title:undefined}))
    },[orignalColumns])

    // submit form colomns
    const formItemColumns=useMemo(()=>{
        if(mode!==EditMode.EDIT){
            return []
        }
        return orignalColumns.map((col,i)=>{
             let extra={
                [siteCodeField]:{
                    order:100,

                },
                [siteNameField]:{
                    order:99,
                    fieldProps:{
                        disabled:true,
                    }
                },
                [companyField]:{
                    order:98,
                    fieldProps:{
                        disabled:true,
                    }
                },
                [approvalStatusField]:{
                    order:97
                }
             }
             let colConfig={
                ...(extra[col.dataIndex]?extra[col.dataIndex]:{}),
             }
             if(formItemFieldConfig[col.dataIndex]){
                colConfig={
                    ...colConfig,
                    ...formItemFieldConfig[col.dataIndex]
                }
             }
             const {fieldProps={},...restColConfig}=colConfig
             return {
                type:col.valueType,
                name:col.dataIndex,
                label:col.title,
                config:{
                    ...fieldProps,
                    ...col.fieldProps,
                },
                ...restColConfig
             }
        }).sort((a,b)=>{
            return b.order-a.order
        })
    },[orignalColumns,mode])
    useLayoutEffect(() => {
       if(mode===EditMode.SEARCH){
            if (!siteCodeHidden&&siteCodeOptions && siteCodeOptions.length === 1) {
                const params = {
                    siteCode: siteCodeOptions[0].value,
                }
                if (!companyHidden) {
                    params[companyField] = siteCodeOptions[0].company
                }
                if (!siteNameHidden) {
                    params[siteNameField] = siteCodeOptions[0].siteName
                }
                if(form){
                    form.setFieldsValue(params)
                }
            }
       }
    }, [siteCodeOptions,siteCodeHidden])

    const setSiteCode=useMemoizedFn((siteCode)=>{
        if(siteCodeOptions){
            const item=siteCodeOptions.find(d=>d.value===siteCode)
            if(item){
                setSiteCodeAndDep(siteCode,item,true);
            }
        }
    })
    useLayoutEffect(()=>{
        if(!siteCodeHidden){
            request()
        }
    },[])

    useEffect(()=>{
        if(mode===EditMode.EDIT&&siteCodeOptions&&siteCodeOptions.length>0){ 
            const siteCode=form.getFieldValue(siteCodeField)
            setSiteCode(siteCode)
        }
    },[data])

    return {
        setSiteCode,
        data,
        columns,
        formItemColumns
    }
}

export {
    useCompany
}