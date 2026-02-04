import { shallowReactive,onBeforeMount, watch, type Ref, type MaybeRef, toValue, computed } from "vue";
export type UseRequestProps<T> = {
  manualRequest?: boolean;
  defaultValue?: T;
  defaultParams?: any;
  params?: Ref<any>;
  service: (params: any) => Promise<T>;
  onSuccess?: (data: T, params: any) => void;
  onError?: (err: any) => void;
  onComplete?: (data: T, params: any) => void;
  transform?: (data: T) => T;
};
export const useRequest = <T>(props: MaybeRef<UseRequestProps<T>>) => {
  const propsRef=computed(()=>Object.assign({
      manualRequest:false,
      defaultParams: {},
  },toValue(props)))
  const state = shallowReactive({
    loading: false,
    data: propsRef.value.defaultValue as T,
    error: null,
    lastParams: {},
  });
  // 内部请求
  const request = async (params: any = {}) => {
    state.loading = true;
    try {
      const res = await propsRef.value.service(params);
      const data = propsRef.value.transform?.(res) ?? res;
      state.data = data;
      state.error = null;
      state.lastParams = params;
      propsRef.value.onSuccess?.(data, params);
    } catch (err) {
      state.data = null;
      state.error = err;
      propsRef.value.onError?.(err);
    } finally {
      state.loading = false;
      propsRef.value.onComplete?.(state.data,   state.lastParams );
    }
    return state;
  };
  const refresh = (params: any = {}) => {
    return request({
      ...state.lastParams,
      ...params,
    });
  };
  if (propsRef.value.params) {
    watch(()=>propsRef.value.params, (value) => {
      request(value);
    });
  }
  // 暴露请求方法
  onBeforeMount(() => {
    if (!propsRef.value.manualRequest) {
      request(propsRef.value.defaultParams);
    }
  });
  return [state, { request, refresh }] as const;
};
