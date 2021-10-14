import { valuesKeyMap } from '@/utils/util';

export const ORDER_STATUS = valuesKeyMap<{value:number,text:string,enum?:string,visible?:boolean},"PendingPayment"|"InStock"|"Shipped"|"Completed"|"Closed"|"ToBeShipped">(
  [
    {
      value: 0,
      text: '待付款',
      enum:"PendingPayment",
    },
    {
      value: 1,
      text: '付款确认中',
      visible: false,
    },
    {
      value: 10,
      text: '待发货',
      enum:"ToBeShipped"
    },
    {
      value: 14,
      text: '备货中',
      enum:'InStock'
    },
    {
      value: 20,
      text: '已发货',
      enum:'Shipped'
    },
    {
      value: 30,
      text: '已完成',
      enum:'Completed'
    },
    {
      value: 40,
      text: '已关闭',
      enum:"Closed"
    },
  ],
  'value',
);
