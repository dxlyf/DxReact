import request from '@/utils/request';


  // 订单管理(后台)- 分页
export function getOrderList(data:any) {
    return request('blisscake/backend/order/findPage',{
        method:"POST",
        data
    })
}