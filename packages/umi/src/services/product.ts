import request from '@/utils/request'

export function getProductList(data:any){
    return request('product/getProductList',{
        method:"POST",
        data
    })
}
export function getDSYunProductList(data:any){
    return request('product/getDSYunProductList',{
        method:"POST",
        data
    })
}
