import request from '@/utils/request';
// 订单详情
export function getOrderDetail(data) {
  return request('blisscake/backend/order/getDetail?id=' + data, {
    method: 'GET',
  });
}
// 订单详情-订单日志
export function getByOrderLog(data) {
  return request('blisscake/backend/orderLog/getByOrderId?orderId=' + data, {
    method: 'GET',
  });
}
// 订单详情-取消订单
export function getcancelOrder(data) {
  return request('blisscake/backend/order/cancelOrder', {
    method: 'GET',
    params: data,
  });
}
// 订单管理(后台)- 分页
export function getOrderList(data: any) {
  return request('blisscake/backend/order/findPage', {
    method: 'POST',
    data,
  });
}
// 取消订单
export function cancelOrder(params: any) {
  return request('blisscake/backend/order/cancelOrder', {
    method: 'GET',
    params,
  });
}
// 订单详情-生产
export function getProduceEmployeeByOutOrderNo(data) {
  return request(
    'produce/backend/produceOrderInfo/getProduceEmployeeByOutOrderNo',
    {
      method: 'GET',
      params: data,
    },
  );
}
// 订单详情-配送
export function getDeliverymanByOutOrderNo(data) {
  return request('logistics/backend/deliveryOrder/getDeliverymanByOutOrderNo', {
    method: 'GET',
    params: data,
  });
}
// 订单列表-改价订单项列表
export function getOrderFindItems(data) {
  return request('blisscake/backend/order/findItems', {
    method: 'GET',
    params: data,
  });
}
// 订单列表-改价数据提交
export function updateOrderPriceFindItems(data) {
  return request('/blisscake/backend/order/updateOrderPrice', {
    method: 'POST',
    data,
  });
}
