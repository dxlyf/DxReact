/**
 * 商品分组-添加商品-商品列表
 * @author fanyonglong
 */
 import React, { useCallback, useMemo,useState } from 'react';
 import { Modal,Space } from 'antd';
 import { useControllableValue } from 'ahooks';
 import FilterForm,{FilterFormFieldType} from '@/components/FilterForm';
 import Table,{RichTableColumnType} from '@/components/Table';
 import useRequest from '@/common/hooks/useRequest';
 import { getDSYunProductList } from '@/services/product';
 import { ImageView } from '@/components/Image';
 import {useTableSelection} from '@/common/hooks'
 
 export let DSYunProductList: React.FC<any> = ({dataItem,onChange}) => {

   const [{ tableProps,dataSource }, { query: showList }] = useRequest({
     service: getDSYunProductList,
     params:{
      companyId:1
     },
     transform: (d) => {
       return {
         data: d.list,
         total: d.total,
       };
     },
   });
   const fields = useMemo<FilterFormFieldType[]>(
     () => [
       {
         type: 'text',
         name: 'name',
         label: '商品信息',
         props: {
           placeholder: '请输入商口名称或商品编号',
           maxLength: 50,
         },
       },
       {
        type: 'productCategory',
        name: 'category',
        label: '商品分类',
        initialValue:-1
      },
       {
         type: 'list',
         name: 'shopId',
         label: '商品类型',
         initialValue: 1,
         props:{
          disabled:true
        },
         data: [
           { text: '单品', value: 1 }
         ],
       },
       {
         type: 'list',
         name: 'status',
         label: '商品状态',
         initialValue: 1,
         props:{
           disabled:true
         },
         data: [
           { text: '在售', value: 1 }
         ]
       },
     ],
     [],
   );
   const columns = useMemo<RichTableColumnType<any>[]>(
     () => [
       {
         title: '商品信息',
         dataIndex: 'productidInfo',
         render(text:any, record: any) {
           return (
             <Space>
               <ImageView
                 preview={false}
                 width={60}
                 height={40}
                 src={record.imageUrl + '?imageView2/1/w/60/h/40'}
               ></ImageView>
               <Space direction="vertical" align="start">
                 <div>{record.name}</div>
                 <div>{record.productNo}</div>
               </Space>
             </Space>
           );
         },
       },
       {
         title: '商品归属',
         dataIndex: 'shopName',
       },
       {
         title: '商品状态',
         dataIndex: 'status',
         render(value:number){
             return value==1?'上架':value==2?'下架':'--'
         }
       },
       {
         title: '商品分类',
         dataIndex: 'categoryText',
       },
       {
         title:"操作",
         render:(record:any)=>{
            return <a onClick={()=>{
              onChange(record)
            }}>选择</a>
         }
       }
     ],
     [onChange],
   );
   return (
     <div>
       <FilterForm fields={fields} autoBind onQuery={showList}></FilterForm>
       <Table scroll={{y:"calc(100vh - 500px)"}} rowKey="id" columns={columns} {...tableProps}></Table>
     </div>
   );
 };
 let DSYunProductListModal: React.FC<any> = (props) => {
   let {dataItem,onOk}=props
   let [visible, setVisible] = useControllableValue(props, {
     defaultValue: false,
     defaultValuePropName: 'defaultVisible',
     valuePropName: 'visible',
     trigger: 'onCancel',
   });
   const onCancelHandle = useCallback(() => {
     setVisible(false);
   }, []);
   const onChangeHandle = useCallback((record:any[]) => {
          onOk(record)
          onCancelHandle()
   }, []);

   return (
     <Modal
       width="70%"
       destroyOnClose
       visible={visible}
       footer={null}
       onCancel={onCancelHandle}
       title="基础商品库列表"
     >
       <DSYunProductList dataItem={dataItem} onChange={onChangeHandle}></DSYunProductList>
     </Modal>
   );
 };
 export default DSYunProductListModal;
 