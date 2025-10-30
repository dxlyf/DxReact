import { useCallback, useRef, useState } from "react"

const useSyncState = <T>(value: T) => {
    const [, update] = useState(false)
    const ref = useRef<T>(value)
    const getState = useCallback(() => {
        return ref.current
    }, [ref])
    const setState = useCallback((playload: T | ((prev: T) => T)) => {
        let updater = playload as Function
        ref.current = typeof playload === 'function' ? updater(ref.current) : playload
        update(v => !v)
    }, [])
    return [getState, setState]
}
export default useSyncState