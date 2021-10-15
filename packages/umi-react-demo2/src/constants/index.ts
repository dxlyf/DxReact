import {defineKeyValueMap,KeyValueData} from '@/utils/util'

export const SYSTEM_THEME={

}
export const BROWSER_ENV={
    IE:'ie',
    CHROME:'chrome'
}


export const PRODUCT_STATUS = defineKeyValueMap<KeyValueData,'unPublished'|'Published'>([{
    key:'unPublished',
    value:1,
    text:'未发布'
},{
    key:'Published',
    value:2,
    text:'已发布'
}])

