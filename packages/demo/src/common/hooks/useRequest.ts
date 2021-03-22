import { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import { PaginationProps } from 'antd';

interface ServiceResult<DataItem> {
  data: DataItem[];
  total?: number;
}
interface useRequestConfig<DataItem> {
  autoBind?: boolean;
  service?: (
    params: object,
    ctx: RequestContext<DataItem>,
  ) => Promise<ServiceResult<DataItem> | any>;
  onQuery?: (params: object, ctx: RequestContext<DataItem>) => void;
  transform?: (res: any) => ServiceResult<DataItem>;
  pageIndexField?: string;
  pageSizeField?: string;
  pagination?: PaginationProps;
  isPagination?: boolean;
  params?: object;
}
type RequestContext<DataItem> = {
  defaultParams: object;
  dataSource: DataItem[];
  total: number;
  loading: boolean;
  update: () => void;
  tableProps: any;
} & Omit<
  useRequestConfig<DataItem>,
  'isPagination' | 'pageIndexField' | 'pageSizeField'
>;
export default function useRequest<T>(
  options: useRequestConfig<T>,
  deeps: any[] = [],
): [
  RequestContext<T>,
  { query: (...args: any[]) => void; onTableChange: (arg: any) => void },
] {
  let {
    pageIndexField = 'pageNum',
    pageSizeField = 'pageSize',
    autoBind = false,
    service,
    transform,
    onQuery,
    params = {},
    pagination = {},
    isPagination = true,
  } = options;
  let contextRef = useRef<RequestContext<T> | null>(null);
  let context = contextRef.current as RequestContext<T>;
  const [, forceUpdate] = useState(0);
  if (!contextRef.current) {
    context = contextRef.current = {
      pagination: pagination,
      defaultParams: params,
      service: service,
      onQuery: onQuery,
      transform: transform,
      params: {},
      dataSource: [],
      total: 0,
      loading: false,
      update: () => {
        forceUpdate((d) => d + 1);
      },
      tableProps: {},
    };
  }
  useMemo(() => {
    context.pagination = pagination;
    context.defaultParams = params;
    context.service = service;
    context.onQuery = onQuery;
    context.transform = transform;
  }, deeps);

  const onQueryHandle = useCallback(
    (parmas = {}, options = false) => {
      if (typeof parmas === 'boolean') {
        options = parmas;
        parmas = {};
      }
      if (typeof options === 'boolean') {
        options = {
          cache: options,
          refresh: false,
        };
      }
      if (typeof options === 'object' && options !== null) {
        options = {
          cache: false,
          refresh: false,
          ...options,
        };
      }
      let newParmas = {
        ...(isPagination
          ? {
              [pageIndexField]: 1,
              [pageSizeField]: context.pagination?.pageSize,
            }
          : {}),
        ...context.defaultParams,
        ...(options.cache ? context.params : {}),
        ...parmas,
      };
      if (isPagination && newParmas.hasOwnProperty(pageIndexField)) {
        context.pagination!.current = newParmas[pageIndexField];
      }
      if (isPagination && newParmas.hasOwnProperty(pageSizeField)) {
        context.pagination!.pageSize = newParmas[pageSizeField];
      }
      if (context.service) {
        context.loading = true;
        context.update();
        context
          .service(newParmas, context)
          .then((d) => {
            if (context.transform) {
              d = context.transform(d);
            }
            context.dataSource = d.data;
            context.total = d.total as number;
          })
          .finally(() => {
            context.loading = false;
            context.update();
          });
      } else if (context.onQuery) {
        context.onQuery(newParmas, context);
      }
      context.params = newParmas;
    },
    [context, isPagination, pageIndexField, pageSizeField],
  );

  const onTableChange = useCallback(
    ({ current, pageSize }) => {
      onQueryHandle(
        {
          [pageIndexField]: current,
          [pageSizeField]: pageSize,
        },
        true,
      );
    },
    [onQueryHandle],
  );
  context.tableProps.dataSource = context.dataSource;
  context.tableProps.onChange = onTableChange;
  context.tableProps.loading = context.loading;

  useEffect(() => {
    if (autoBind) {
      onQueryHandle();
    }
  }, []);
  return [context, { query: onQueryHandle, onTableChange }];
}
