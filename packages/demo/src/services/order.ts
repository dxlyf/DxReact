import request from '@/utils/request';

export function getOrderDetail(data) {
  return request('blisscake/backend/order/getDetail?id=' + data, {
    method: 'GET',
  });
}

export function getByOrderLog(data) {
  return request('blisscake/backend/orderLog/getByOrderId?orderId=' + data, {
    method: 'GET',
  });
}

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
