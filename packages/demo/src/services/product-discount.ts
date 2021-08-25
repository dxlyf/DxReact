import request from '@/utils/request';

// 获取商品折扣
export function getList(data: any) {
  return request('blisscake/backend/productDiscount/findPage', {
    method: 'POST',
    data,
  });
}
// 结束活动
export function updateStatus(data: any) {
  return request('blisscake/backend/productDiscount/updateStatus', {
    method: 'GET',
    params: data,
  });
}
// 添加折扣
export function add(data: any) {
  return request('blisscake/backend/productDiscount/addProductDiscount', {
    method: 'POST',
    data,
  });
}
// 修改折扣
export function update(data: any) {
  return request('blisscake/backend/productDiscount/updateProductDiscount', {
    method: 'POST',
    data,
  });
}
// 查看详情
export function getDetail(data: any) {
  return request('blisscake/backend/productDiscount/detailById', {
    method: 'GET',
    params: data,
  });
}
// 查询微店
export function getActivityStorePageByParam(data: any) {
  return request('shop/backend/store/shopInfo/findActivityStorePageByParam', {
    method: 'POST',
    data,
  });
}
