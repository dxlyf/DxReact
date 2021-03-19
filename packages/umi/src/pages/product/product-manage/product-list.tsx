import React,{useMemo} from 'react'
import ProTable,{ProColumnType} from '@ant-design/pro-table'
import useRequest from '@/common/hooks/useRequest'
import * as productService from '@/services/product'
import {
    QueryFilter,
    ProFormText,
    ProFormDatePicker,
    ProFormRadio,
    ProFormCheckbox,
  } from '@ant-design/pro-form';

type ProductRecordDataType={
    productName:string
}

type ProductProps={

}
let ProductList=React.memo<ProductProps>(({})=>{
    let [{tableProps},{query:showList}]=useRequest({
        //autoBind:true,
        service:productService.getProductList,
        transform:(res)=>{
            return {
                data:res.data.list,
                total:res.data.total
            }
        }
    })
    const columns=useMemo<ProColumnType<ProductRecordDataType>[]>(() =>[{
        title:"商品信息",
        dataIndex:"productidInfo"
    },{
        title:"商品归属",
        dataIndex:"belong",
        valueType:"select",
        
    },{
        title:"商品状态",
        dataIndex:"statusName"
    },{
        title:"操作"
    }], [])
    return <>
    <QueryFilter layout="inline">
        <ProFormText label="商品信息"></ProFormText>
    </QueryFilter>
    <ProTable  search={false} columns={columns} {...tableProps}></ProTable>
    </>
})
export default ProductList