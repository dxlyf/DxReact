import React, { useCallback, useMemo } from 'react'
import {Modal} from 'antd'
import {useControlledValue} from 'ahooks'
import FilterForm from '@/components/FilterForm'
import Table from '@/components/Table'
import useRequest from '@/common/hooks/useRequest'
import {getDSYunProductList} from '@/services/product'

export let DSYunProductList:React.FC<any>=()=>{
    const [{tableProps},{query:showList}]=useRequest({
        service:getDSYunProductList,
        transform:(d)=>{
            return {
                data:d.list,
                total:d.total
            }
        }
    })
    const fields=useMemo(()=>[{
        label:"商品名称",
        name:"productName",
        type:"text"
    },{
        label:"商品分类",
        name:"category",
        type:"list"
    },{
        label:"商品类型",
        name:"type",
        type:"list"
    },{
        label:"商品状态",
        name:"status",
        type:"list"
    }],[])
    const columns=useMemo(()=>[
        {
            title:"商品信息",
            render:()=>{
                return <div></div>
            }
        },
        {
            title:"商品分类",
            render:()=>{
                return <div></div>
            }
        },
        {
            title:"商品类型",
            render:()=>{
                return <div></div>
            }
        },
        {
            title:"状态",
            render:()=>{
                return <div></div>
            }
        },
        {
            title:"操作",
            render:()=>{
                return <div></div>
            }
        }
    ],[])
    return <div>
        <FilterForm fields={fields} autoBind onQuery={showList}></FilterForm>
        <Table columns={columns} {...tableProps} ></Table>
    </div>
}
let DSYunProductListModel:React.FC<any>=(props)=>{
    let [visible,setVisible]=useControlledValue(props,{
        defaultValue:false,
        defaultValuePropName:"defaultVisible",
        valuePropName:"visible",
        trigger:"onCancel"
    })
    const onCancelHandle=useCallback(()=>{
        setVisible(false)
    },[])
    const onChangeHandle=useCallback(()=>{

    },[])
    return <Modal visible={visible} footer={null} onCancel={onCancelHandle} title=" 电商云基础商品库列表">
        <DSYunProductList onChange={onChangeHandle}></DSYunProductList>
    </Modal>
}
export default DSYunProductListModel