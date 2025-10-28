import { useCallback, useMemo } from "react";
import {debounce} from 'lodash-es'

const useDebounceFn = (fn: (...args: any[]) => any, wait: number) => {
    const debouncedFn = useMemo(() => {
        let timeout: ReturnType<typeof setTimeout> | null = null;
        let ret:any
        return (...args: any[]) => {
            if (timeout) {
                clearTimeout(timeout);
            }
            timeout = setTimeout(() => {
                ret=fn(...args);
            }, wait);
            return ret;
        }
    }, [wait])
    return debouncedFn;
}