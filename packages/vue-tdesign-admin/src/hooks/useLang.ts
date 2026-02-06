import { inject, onBeforeMount,provide, shallowRef} from "vue";

export const LANG_PROVIDER_KEY='langProvider'
export type LangItem={
    label:string;
    value:string;
}
let globalLang:LangItem[]|null=null
const delay=async (ms:number)=>{
    return new Promise((resolve)=>{
        setTimeout(resolve,ms)
    })
}
const getLangList=async ()=>{
    await delay(2000)
    return [
        {
            label:'中文',
            value:'zh-CN',
        },
        {
            label:'英文',
            value:'en-US',
        },
    ]
}
export const useLang=()=>{
    const allLang=shallowRef<LangItem[]>(globalLang?globalLang.slice():[])
    onBeforeMount(async ()=>{
        if(!globalLang){
            globalLang=[]
            getLangList().then((langList)=>{
                globalLang=langList
                allLang.value=langList
            })
        }
    })
    return [allLang] as const
}
