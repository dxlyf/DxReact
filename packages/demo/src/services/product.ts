import request from '@/utils/request';

export function getProductList(data: any) {
  return request('blisscake/backend/shopProduct/find', {
    method: 'POST',
    data,
  });
}
export function getDSYunProductList(data:any){
  return request('product/getDSYunProductList',{
      method:"POST",
      data
  })
}
