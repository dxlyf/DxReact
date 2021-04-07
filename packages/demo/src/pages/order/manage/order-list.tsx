/**
 * 订单管理-订单列表
 * @author fanyonglong
 */
 import React, { useState, useCallback, useMemo, useRef } from 'react';
 import { Tabs, Button, Card, Space, message, Modal,Descriptions,Typography } from 'antd';
 import Table, { RichTableColumnType } from '@/components/Table';
 import FilterForm, {
   FilterFormFieldType,
   ControlContextType,
 } from '@/components/FilterForm';
 import * as orderService from '@/services/order';
 import { useRequest, useTableSelection } from '@/common/hooks';
 import { ConnectRC, Link } from 'umi';
 import { ImageView } from '@/components/Image';
 import {get,flatMap,uniqueId} from 'lodash'
 import {ORDER} from '@/common/constants'
 import styles from './style.less'
 
 let OrderList: ConnectRC<any> = ({ history }) => {

   let filterRef = useRef<ControlContextType>();
   let [currentStatus, setStatus] = useState<string>('-1');
   let [{ tableProps }, { query: showList }] = useRequest({
     service: orderService.getOrderList,
     transform: (res: any) => {
       let newData=flatMap(res.list,(d:any,index:number)=>{
        return [{
            rowId:uniqueId('orderid'),
            ...d,
            isHeader:true,
            colSpan:6,
            rowSpan:d.orderItemList.length,
        },{
            isHeader:false,
            rowId:uniqueId('orderid'),
            ...d,
        }]
     })
       return {
         data: newData,
         total: res.total+newData.length*0.5,
         pageSize:newData.length
       };
     },
   });
   const fields = useMemo<FilterFormFieldType[]>(
     () => [],
     []);
   const columns = useMemo<RichTableColumnType<any>[]>(
     () => [
       {
         title: '商品信息',
         dataIndex: 'productidInfo',
         render(text, record: any) {
           if(record.isHeader){
               return {
                   children:<Descriptions size="small" column={4}>
                       <Descriptions.Item label="订单编号"><Typography.Link>{record.orderNo}</Typography.Link></Descriptions.Item>
                       <Descriptions.Item label="下单时间">{record.createdTime}</Descriptions.Item>
                       <Descriptions.Item label="订单类型">{record.typeStr}</Descriptions.Item>
                       <Descriptions.Item label="订单来源">{record.appName}</Descriptions.Item>
                       <Descriptions.Item label="店铺归属">{record.shopName}</Descriptions.Item>
                       <Descriptions.Item label="城市归属">{record.receiverCityName}</Descriptions.Item>
                       <Descriptions.Item label="约定送达时间">{record.deliveryDate}&nbsp;{record.deliveryStartTime}-{record.deliveryEndTime}</Descriptions.Item>
                   </Descriptions>,
                   props:{
                      style:{
                          backgroundColor:'#e6f7ff',
                          padding:5
                      },
                      colSpan:record.colSpan
                   }
               }
           }
           return {
               children: <>{record.orderItemList.map((d:any)=><div>
                   <Space style={{width:"100%"}}>
               <ImageView
                 width={60}
                 height={40}
                 src={d.picUr+""}
                 srcSuffix="?imageView2/1/w/60/h/40"
               ></ImageView>
               <Space direction="vertical" className={styles.goodsItem2}>
                 <div>{d.productName}</div>
                 <div>{d.propertyStr}</div>
               </Space>
               <Space direction="vertical" align="start">
                    <div>￥<span>{Number(d.unitPrice*0.01).toFixed(2)}</span></div>
                    <div>x{d.quantity}</div>
               </Space>
             </Space>
               </div>)}</>,
                props:{
                    colSpan:2
                }
           }
         },
       },
       {
           title:"单价(元)/数据",
           render(record:any){
                return {
                    props:{
                        colSpan:0
                    }
                }
           }
       },{
           title:"买家/收货人",
           render(record:any){
                return record.isHeader?{props:{colSpan:0}}:<Space>
                    <a>{record.buyerName}</a>
                    <span></span>
                </Space>
           }
       },{
            title:"实付金额(元)",
            render(record:any){
                return record.isHeader?{props:{colSpan:0}}:Number(record.payAmount*0.01).toFixed(2)
            }
        },{
            title:"订单状态",
            render(record:any){
                return record.isHeader?{props:{colSpan:0}}:<Space></Space>
            }
        },
        {
            title:"操作",
            render(record:any){
                return record.isHeader?{props:{colSpan:0}}:<Space></Space>
        }
      }
     ],
     [],
   );
   const onStatusTabChange = useCallback((value) => {
     setStatus(value + '');
     filterRef.current?.form.setFieldsValue({
       status: Number(value),
     });
     filterRef.current?.query();
   }, []);

   return (
     <Space direction="vertical" className="m-list-wrapper">
       <Card className="m-filter-wrapper">
         <FilterForm
           ref={filterRef as any}
           span={18}
           fields={fields}
           onQuery={showList}
           autoBind={true}
         >
         </FilterForm>
       </Card>
       <Card className="m-table-wrapper">
         <Tabs activeKey={currentStatus} onChange={onStatusTabChange}>
           <Tabs.TabPane tab="全部" key="-1"></Tabs.TabPane>
           <Tabs.TabPane tab="已上架" key="1"></Tabs.TabPane>
           <Tabs.TabPane tab="已下架" key="2"></Tabs.TabPane>
         </Tabs>
         <Table
           columns={columns}
           rowKey="rowId"
           {...tableProps}
         ></Table>
       </Card>
     </Space>
   );
 };
 
 export default OrderList;
 