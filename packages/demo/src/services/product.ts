import request from '@/utils/request';

export function getProductList(data: any) {
  return request('blisscake/backend/shopProduct/find', {
    method: 'POST',
    data,
  });
}
export function getDSYunProductList(data: any) {
  return request('prd/backend/companyProduct/findPageCompanyProduct', {
    method: 'POST',
    data,
  });
}
// 获取商品详情
export function getDSYunProductDetail(productId:any){
  return request('/prd/backend/companyProduct/getProductDetail',{
    method:"GET",
    params:{
      productId
    }
  })
}
export function batchStatus(data:any){
  return request('blisscake/backend/shopProduct/batchStatus',{
    method:"POST",
    data
  })
}
export function batchDelete(data:any){
  return request('blisscake/backend/shopProduct/batchDelete',{
    method:"POST",
    data
  })
}
// 商品分组列表
export function getProductGroupList(data: any) {
  return request('blisscake/backend/productGroup/find', {
    method: 'POST',
    data,
  });
}
// 删除商品分组
export function deleteProductGroup(data: any) {
  return request('blisscake/backend/productGroup/delete', {
    method: 'GET',
    params:data,
  });
}
// 添加商品分组
export function addProductGroup(data: any) {
  return request('blisscake/backend/productGroup/add', {
    method: 'POST',
    data:data,
  });
}
// 更新商品分组
export function updateProductGroup(data: any) {
  return request('blisscake/backend/productGroup/update', {
    method: 'POST',
    data:data,
  });
}
// 查询商品分组-商品管理-组关联的商品列表 
export function getGroupRefProductList(data: any) {
  return request('blisscake/backend/productGroupRel/find', {
    method: 'POST',
    data:data,
  });
}
// 查询商品分组-添加商品-组下面的商品列表 
export function getGroupProductList(data: any) {
  return request('blisscake/backend/shopProduct/findByRelType', {
    method: 'POST',
    data:data,
  });
}
// 查询商品分组-添加分组商品
export function addGroupProductList(data: any) {
  return request('blisscake/backend/productGroupRel/add', {
    method: 'POST',
    data:data
  });
}
