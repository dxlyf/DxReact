import { computed, inject, nextTick, onBeforeMount,provide, shallowRef,getCurrentInstance} from "vue";

export const LANG_PROVIDER_KEY='langProvider'
export type LangItem={
    label:string;
    value:string;
    suffix?:string;
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
        {
            label:'日文',
            value:'ja-JP',
        },
        {
            label:'韩文',
            value:'ko-KR',
        },
        {
            label:'法文',
            value:'fr-FR',
        },
        {
            label:'德文',
            value:'de-DE',
        },
        {
            label:'西班牙文',
            value:'es-ES',
        },
        {
            label:'葡萄牙文',
            value:'pt-PT',
        },
    ]
}
const withResolvers=<T>()=>{
    let resolve: (value:T) => void
    let reject: (reason?: any) => void
    const promise=new Promise<T>((res,rej)=>{
        resolve=res
        reject=rej
    })
    return {
        promise,
        resolve,
        reject,
    }
}
let promise:ReturnType<typeof withResolvers<LangItem[]>>|null=null
export const useLang=()=>{

    const _allLang=shallowRef<LangItem[]>(globalLang?globalLang.slice():[])
    const allLang=computed<LangItem[]>({
        get:()=>{
            return _allLang.value.map(d=>({...d,suffix:d.value.toLowerCase().replace(/-/g,'_')}))
        },
        set:(v)=>{
            _allLang.value=v
        }
    })

    onBeforeMount(()=>{
        if(!promise){
            promise=withResolvers<LangItem[]>()
            globalLang=[]
            getLangList().then((langList)=>{
                promise.resolve(langList)
                console.log('getLangList_after',langList)
                globalLang=langList
                allLang.value=langList
            })
        }else if(globalLang.length<=0){
            promise.promise.then((langList)=>{
                allLang.value=langList
            })
        }
    })
    return [allLang] as const
}
