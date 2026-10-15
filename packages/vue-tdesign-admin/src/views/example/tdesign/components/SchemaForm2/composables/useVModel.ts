import { computed, customRef, getCurrentInstance, ref, type MaybeRef, type WritableComputedRef, type Ref } from 'vue';

export type UseVModelProps<T> = {
    /** value 模式下的字段名（接收 :value / v-model:value），默认 'value' */
    valueField?: string;
    /** v-model 模式下的字段名（接收 v-model），默认 'modelValue' */
    modelField?: string;
    /** 兜底默认值：受控值为 undefined 时返回它；非受控时作为内部状态初始值 */
    defaultValue?: T;
    /** 变更时派发的自定义事件名，默认 'change'；传空字符串则不派发 */
    trigger?: string;
    onChange?: (value: T) => void;
};

/**
 * 让组件同时支持「value」与「v-model」两种写法，并始终以父级为准（受控）。
 *
 * - 父级用 `v-model="x"`          ：读 props[modelField]，写 emit('update:modelValue')
 * - 父级用 `:value="x"` / `v-model:value="x"`：读 props[valueField]，写 emit('update:value')
 * - 两者都没传（非受控）           ：退回内部状态（初始为 defaultValue），写入只改内部状态
 *
 * 另支持：
 * - defaultValue：受控值为 undefined 时回落的默认值 / 非受控时的初始值；
 * - trigger：每次写入额外派发的事件名，默认 'change'（如 `@change`），传 '' 可关闭。
 *
 * 返回可写 computed：读 = 当前值，写 = 派发更新事件（或更新内部状态）。
 */
type SetValueHandle<T extends any[]> = (...args: T) => void
export const useVModel = <T = any, Params extends any[] = T[]>(
    options: UseVModelProps<T> = {},
) => {
    const {
        valueField = 'value',
        modelField = 'modelValue',
        defaultValue,
        trigger = 'change',
        onChange,
    } = options;
    const instance = getCurrentInstance();
    if (!instance) {
        throw new Error('useVModel() 必须在 setup() 内调用');
    }
    const props = instance.props as Record<string, any>;
    const emit = instance.emit;

    // 以父级「实际传入」的绑定为准：vnode.props 是父级原始绑定，
    // 可区分「显式传了 undefined」和「根本没传」；v-model 优先于 value。
    const raw = instance.vnode.props ?? {};
    const usingModel = modelField in raw;
    const usingValue = valueField in raw;
    // 两者都没传 → 非受控，退回内部状态
    const uncontrolled = !usingModel && !usingValue;
    const readField = usingModel ? modelField : valueField;

    // 内部状态：仅非受控模式使用，初始为 defaultValue
    const inner = ref<T | undefined>(defaultValue);

    // const model2 = customRef<T | undefined>((track, curTrigger) => {
    //     return {
    //         get(){
    //             track()
    //             if (uncontrolled) return inner.value;
    //             const val = props[readField];
    //             return val === undefined ? defaultValue : val;
    //         },
    //         set(val){
    //             if (uncontrolled) {
    //                 inner.value = val;
    //             } else if (usingModel) {
    //                 emit(`update:${modelField}`, val);
    //             } else {
    //                 emit(`update:${valueField}`, val);
    //             }

    //             if(trigger){
    //                 emit(trigger, val);
    //             }
    //             curTrigger()
    //         }
    //     }
    // }) as Ref<T | undefined>
    // const model = computed<T | undefined>({
    //     get() {
    //         if (uncontrolled) return inner.value;
    //         const val = props[readField];
    //         return val === undefined ? defaultValue : val;
    //     },
    //     set(val: T | undefined) {
    //         if (uncontrolled) {
    //             inner.value = val;
    //         } else if (usingModel) {
    //             emit(`update:${modelField}`, val);
    //         } else {
    //             emit(`update:${valueField}`, val);
    //         }
    //         // 变更事件（默认 change）
    //         if (trigger) emit(trigger, val);
    //     },
    // });
    const model = computed<T | undefined>({
        get() {
            if (uncontrolled) return inner.value;
            const val = props[readField];
            return val === undefined ? defaultValue : val;
        },
        set(val: T | undefined) {
            if (uncontrolled) {
                inner.value = val;
            } else if (usingModel) {
                emit(`update:${modelField}`, val);
            } else {
                emit(`update:${valueField}`, val);
            }
            // 变更事件（默认 change）
            if (trigger){
                emit(trigger, val);
            }
            onChange?.(val)
        },
    });
    const setValue: SetValueHandle<Params> = (...args) => {
        const value = args[0]
        if (uncontrolled) {
            inner.value = value;
        } else if (usingModel) {
            emit(`update:${modelField}`, value);
        } else {
            emit(`update:${valueField}`, value);
        }
        // 变更事件（默认 change）
        if (trigger){
             emit(trigger, ...args);
        }
        onChange?.(value)
    }
    return [model, setValue] as const
};
