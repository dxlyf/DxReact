import { DialogPlugin, type DialogOptions } from 'tdesign-vue-next'

export type ConfirmProps = {
    onConfirm?: () => void | Promise<void>
} & Omit<DialogOptions, 'onConfirm'>

export const isPromise = (val: any) => {
    if (val instanceof Promise) {
        return true
    }
    if (typeof val === 'object' && val !== null && val.then && typeof val.then === 'function') {
        return true
    }
    return false
}
export const delay=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms))
export const withResolvers =()=>{
    if(Promise.withResolvers){
        return Promise.withResolvers()
    }
    // 填充withResolvers
    let resolve: (value: unknown) => void
    let reject: (reason?: any) => void
    const promise = new Promise((res, rej) => {
        resolve = res
        reject = rej
    })
    return {
        promise,
        resolve: resolve!,
        reject: reject!
    }
}
/**
 * 确认操作
 * 持装支持onConfirm返回Promise<void>的情况
 * @param options 确认操作的选项
 * @returns 
 */
export const confirm = (options: ConfirmProps) => {
    const { header = false, onConfirm, ...restOptions } = options
    const dialog = DialogPlugin.confirm({
        header,
        ...restOptions,
        onConfirm: async () => {
            try {
                dialog.setConfirmLoading(true)
                const res = await onConfirm?.()
                dialog.setConfirmLoading(false)
                dialog.destroy()
            } catch (err) {
                console.error(err)
                dialog.setConfirmLoading(false)
            }
        }
    })
}
/**
 * 删除确认
 * @param options 确认删除的选项
 * @returns 
 */
export const confirmDelete=(options:Partial<ConfirmProps>)=>{
    const {header=false,confirmBtn={},...restOptions}=options
    return confirm({
        header:false,
        theme:'danger',
        body:'确认删除吗？',
        confirmBtn:{
            theme:'danger',
            content:'删除',
            ...(confirmBtn as any)
        },
        ...restOptions
    })
}
