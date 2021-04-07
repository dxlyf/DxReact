import {valuesKeyMap} from '@/utils/util'

export const CATEGORY_TYPES=valuesKeyMap([{
    value:1,
    text:'现做蛋糕',
    type:"生产类"
},{
    value:2,
    text:'现烤面包',
    type:"生产类"
},{
    value:3,
    text:'现货成品',
    type:"成品类"
},{
    value:4,
    text:'现做饮品',
    type:"饮品类"
},{
    value:5,
    text:'虚拟商品',
    type:"虚拟类"
}],'value')

export const PRODUCT_TYPES=valuesKeyMap([{
    value:1,
    text:'单品'
},{
    value:2,
    text:'组合'
}],'value')

export const PRODUCT_STATUS=valuesKeyMap([{
    value:1,
    text:'在售'
},{
    value:2,
    text:'停售'
}],'value')
export const PRODUCT_SCALE_STATUS=valuesKeyMap([{
    value:1,
    text:'已上架'
},{
    value:2,
    text:'已下架'
}],'value')
