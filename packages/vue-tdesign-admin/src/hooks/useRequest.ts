import { onMounted, ref, shallowReactive,onBeforeMount, toRef, watch, type Ref } from "vue";
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
export const useRequest = <T>(props: UseRequestProps<T>) => {
  const {
    manualRequest = false,
    params,
    defaultParams = {},
    service,
    onSuccess,
    onError,
    transform,
    onComplete,
    defaultValue = undefined
  } = props;
  const state = shallowReactive({
    loading: false,
    data: defaultValue as T,
    error: null,
    lastParams: {},
  });
  // 内部请求
  const request = async (params: any = {}) => {
    state.loading = true;
    try {
      const res = await service(params);
      const data = transform?.(res) ?? res;
      state.data = data;
      state.error = null;
      state.lastParams = params;
      onSuccess?.(data, params);
    } catch (err) {
      state.data = null;
      state.error = err;
      onError?.(err);
    } finally {
      state.loading = false;
      onComplete?.(state.data,   state.lastParams );
    }
    return state;
  };
  const refresh = (params: any = {}) => {
    return request({
      ...state.lastParams,
      ...params,
    });
  };
  if (params) {
    watch(params, (value) => {
      request(value);
    });
  }
  // 暴露请求方法
  onBeforeMount(() => {
    if (!manualRequest) {
      request(defaultParams);
    }
  });
  return [state, { request, refresh }] as const;
};
