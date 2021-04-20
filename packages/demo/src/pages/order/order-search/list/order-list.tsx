/**
 * 订单管理-订单列表
 * @author fanyonglong
 */
 import React, { useState, useCallback, useMemo, useRef } from 'react';
 import {
   Tabs,
   Button,
   Card,
   Space,
   message,
   Modal,
   Descriptions,
   Typography,
   Pagination
 } from 'antd';
 import Table, { RichTableColumnType } from '@/components/Table';
 import FilterForm, {
   FilterFormFieldType,
   ControlContextType,
 } from '@/components/FilterForm';
 import * as orderService from '@/services/order';
 import { useRequest, useTableSelection } from '@/common/hooks';
 import { ConnectRC, Link } from 'umi';
 import { ImageView } from '@/components/Image';
 import { get, flatMap, uniqueId } from 'lodash';
 import { ORDER } from '@/common/constants';
 import styles from './style.less';
 
 let OrderStatusList = [{ value: -1, text: '全部' }].concat(
   ORDER.ORDER_STATUS.values.filter((d) => d.visible !== false),
 );
 let OrderList: ConnectRC<any> = ({ history }) => {
   let filterRef = useRef<ControlContextType>();
   let [currentStatus, setStatus] = useState<string>('-1');
   let [{ tableProps }, { query: showList,onTableChange }] = useRequest({
     service: orderService.getOrderList,
     transform: (res: any) => {
       let newData = flatMap(res.list, (d: any, index: number) => {
         return [
           {
             rowId: uniqueId('orderid'),
             ...d,
             isHeader: true,
             colSpan: 6,
             rowSpan: d.orderItemList.length,
           },
           {
             isHeader: false,
             rowId: uniqueId('orderid'),
             ...d,
           },
         ];
       });
       return {
         data: newData,
         total: res.total,
       };
     },
   });
   const fields = useMemo<FilterFormFieldType[]>(
     () => [
       {
         type: 'selectInput',
         label: [
           {
             text: '订单编号',
             value: 'orderNo',
             props: {
               maxLength: 50,
               placeholder: '请输入订单编号',
             },
           },
           {
             text: '买家电话',
             value: 'buyerPhone',
             props: {
               maxLength: 50,
               placeholder: '请输入买家(会员)手机号',
             },
           },
           {
             text: '收货人姓名',
             value: 'receiverName',
             props: {
               maxLength: 50,
               placeholder: '请输入收货人姓名',
             },
           },
           {
             text: '收货人电话',
             value: 'receiverPhone',
             props: {
               maxLength: 50,
               placeholder: '请输入收货人手机号',
             },
           },
         ],
       },
       {
         type: 'list',
         label: '订单类型',
         name: 'type',
         initialValue: 1,
         data: [{ value: 1, text: '普通订单' }],
       },
       {
         type: 'list',
         label: '订单状态',
         name: 'status',
         initialValue: -1,
         data: OrderStatusList,
       },
       {
         type: 'dateRange',
         label: '下单时间',
         name: ['startTime', 'endTime'],
       },
       {
         type: 'shop',
         label: '店铺归属',
         name: 'shopId',
         initialValue: -1,
       },
     ],
     [],
   );
   const onCancelOrder = useCallback((record) => {
     Modal.confirm({
       title: '是否取消订单？',
       content: '未支付的关闭订单；已支付的全额退款',
       onOk: () => {
         orderService
           .cancelOrder({
             orderId: record.id,
           })
           .then(() => {
             message.success('取消成功！');
             showList(true);
           });
       },
     });
   }, []);
   const columns = useMemo<RichTableColumnType<any>[]>(
     () => [
       {
         title: '商品信息',
         dataIndex: 'productidInfo',
         render(text, record: any) {
           if (record.isHeader) {
             return {
               children: (
                 <div className={styles.productInfoHeadWrap}>
                   <Descriptions size="small" column={4}>
                     <Descriptions.Item label="订单编号">
                       <Typography.Link>{record.orderNo}</Typography.Link>
                     </Descriptions.Item>
                     <Descriptions.Item label="下单时间">
                       {record.createdTime}
                     </Descriptions.Item>
                     <Descriptions.Item label="订单类型">
                       {record.typeStr}
                     </Descriptions.Item>
                     <Descriptions.Item label="订单来源">
                       {record.appName}
                     </Descriptions.Item>
                     <Descriptions.Item label="店铺归属">
                       {record.shopName}
                     </Descriptions.Item>
                     <Descriptions.Item label="城市归属">
                       {record.receiverCityName}
                     </Descriptions.Item>
                     <Descriptions.Item label="约定送达时间">
                       <span style={{ color: 'red' }}>
                         {record.deliveryDate}&nbsp;{record.deliveryStartTime}-
                         {record.deliveryEndTime}
                       </span>
                     </Descriptions.Item>
                   </Descriptions>
                   <div>
                     <Link
                       to={`/order/order-search/order-list/order-detail/${record.id}`}
                     >
                       查看详情
                     </Link>
                   </div>
                 </div>
               ),
               props: {
                 style: {
                   backgroundColor: '#fefefe',
                   padding: 5,
                 },
                 colSpan: record.colSpan,
               },
             };
           }
           return {
             children: (
               <>
                 {record.orderItemList.map((d: any) => (
                   <div key={d.id} className={styles.productInfoWrap}>
                     <div className={styles.productInfoItem}>
                       <ImageView
                         width={60}
                         height={40}
                         src={d.picUrl + ''}
                         srcSuffix="?imageView2/1/w/60/h/40"
                       ></ImageView>
                       <div>
                         <div>{d.productName}</div>
                         <div>{d.propertyStr}</div>
                       </div>
                       <div className={styles.productInfoPrice}>
                         <div>
                           ￥<span>{Number(d.unitPrice * 0.01).toFixed(2)}</span>
                         </div>
                         <div>x{d.quantity}</div>
                       </div>
                     </div>
                   </div>
                 ))}
               </>
             ),
             props: {
               colSpan: 2,
             },
           };
         },
       },
       {
         title: '单价(元)/数据',
         onHeaderCell: () => {
           return {
             style: {
               textAlign: 'right',
             },
           };
         },
         render(record: any) {
           return {
             props: {
               colSpan: 0,
             },
           };
         },
       },
       {
         title: '买家/收货人',
         render(record: any) {
           return record.isHeader ? (
             { props: { colSpan: 0 } }
           ) : (
             <Space>
               <Link
                 to={{
                   pathname: '/member/manage/list',
                   search: `phone=${record.buyerPhone}`,
                 }}
               >
                 {record.buyerName}
               </Link>
               <ul className={styles.receiverWrap}>
                 <li>{record.receiverName}</li>
                 <li>{record.receiverPhone}</li>
                 <li>{record.receiverFullAddress}</li>
               </ul>
             </Space>
           );
         },
       },
       {
         title: '实付金额(元)',
         render(record: any) {
           return record.isHeader
             ? { props: { colSpan: 0 } }
             : Number(record.payAmount * 0.01).toFixed(2);
         },
       },
       {
         title: '订单状态',
         render(record: any) {
           return record.isHeader ? { props: { colSpan: 0 } } : record.statusStr;
         },
       },
       {
         title: '操作',
         width: 100,
         render(record: any) {
           if (record.isHeader) {
             return { props: { colSpan: 0 } };
           }
           switch (record.status) {
             case ORDER.ORDER_STATUS.enums.value5.value:
              return { props: { colSpan: 0 } }; 
             default:
               return <a onClick={onCancelOrder.bind(null, record)}>取消订单</a>;
           }
         },
       },
     ],
     [onCancelOrder],
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
           defaultExpand
           fields={fields}
           labelWidth={120}
           onQuery={showList}
           autoBind={true}
         ></FilterForm>
       </Card>
       <Card className="m-table-wrapper">
         <Tabs activeKey={currentStatus} onChange={onStatusTabChange}>
           {OrderStatusList.map((d) => (
             <Tabs.TabPane tab={d.text} key={d.value + ''}></Tabs.TabPane>
           ))}
         </Tabs>
         <Table
           columns={columns}
           rowKey="rowId"
           {...tableProps}
           pagination={false}
         ></Table>
         <Pagination className="ant-pagination ant-table-pagination ant-table-pagination-right" {...tableProps.pagination} onChange={(page,pageSize)=>{
              onTableChange({current:page,pageSize:pageSize})
         }} onShowSizeChange={(current, size)=>{
          onTableChange({current:current,pageSize:size})
         }}></Pagination>
       </Card>
     </Space>
   );
 };
 
 export default OrderList;
 