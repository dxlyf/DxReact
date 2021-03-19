import request from '@/utils/request'

export function getProductList(data:any){
    return request('product/getProductList',{
        method:"POST",
        data
    })
}
