import CanvasKitInit from 'canvaskit-wasm'
import type * as CanvasKit from 'canvaskit-wasm'
import canvaskitWasmUrl from 'canvaskit-wasm/bin/canvaskit.wasm?url'

let ck: CanvasKit.CanvasKit

export type {
    CanvasKit
}
export let initCK = async () => {
    if(ck){
        return ck;
    }
    return  CanvasKitInit({
        locateFile: (file: string) => {
            console.log('CanvasKitInit', file,canvaskitWasmUrl)
            return canvaskitWasmUrl
        }
    }).then(_ck => {
        ck = _ck
        return _ck
    })
}

export {
    ck
}