
export type KeyValueData={
    key:string 
    text?:string
    value:number|string
}
type KeyValueMap<T extends KeyValueData,K>={
    [key in K as string]:T
}

export function defineKeyValueMap<T extends KeyValueData,K extends string|number>(data:T[]):{
    get(key:K):T
    value(key:K,defaultValue?:any):any
    text(key:K,defaultValue?:any):any
    map:Map<K,T>
    obj:KeyValueMap<T,K>
    data:T[]
};
/**
 * 如果只是简单的状态和类型定义，请使用枚举或定义普通对象映射
 * 为什么要使用数组映身，因为对象的key它是无法保证for 的顺序和你定义时一致
 * key 和value的值请不要相同
 * @param data
 * @returns 
 * 
 * @example
import {defineKeyValueMap,KeyValueData} from '@/utils/util'
export const PRODUCT_STATUS = defineKeyValueMap<KeyValueData,'unPublished'|'Published'>([{
    key:'unPublished',
    value:1,
    text:'未发布'
},{
    key:'Published',
    value:2,
    text:'已发布'
}])
 显示文本
 PRODUCT_STATUS.text(1)或PRODUCT_STATUS('unPublished')
 状态判断
 PRODUCT_STATUS.value('unPublished')==productItem.status
 获取列表
 PRODUCT_STATUS.data.map(d=><Select.Option value={d.value}>{d.text}</Select.Option>)
 获取某项
 PRODUCT_STATUS.map.get(1)或PRODUCT_STATUS.map.get('Published')
 */
export function defineKeyValueMap<T extends KeyValueData>(data:T[]){
    let map=new Map<string|number,T>()
    data.forEach((item,index)=>{
        if(typeof item.key == 'string'){
            map.set(item.key,item)
        }
        map.set(item.value,item)
    })
    
    return {
        get(key:any){
            if(!map.has(key)){
                throw new Error(key+'不存在!')
            }
            return map.get(key)
        },
        text(key:any,defaultValue=''){
            return map.has(key)?map.get(key)?.text:defaultValue
        },
        value(key:any,defaultValue=''){
            return map.has(key)?map.get(key)?.value:defaultValue
        },
        map,
        data
    }
}