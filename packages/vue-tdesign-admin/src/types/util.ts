import type {MaybeRefOrGetter,MaybeRef} from 'vue'
export type WrapPropsToMaybeRefOrGetter<T> = {
    [K in keyof T]: MaybeRefOrGetter<T[K]>
}
export type GetProps<T> = T extends { props: infer P } ? P : never
