import {RequestConfig} from 'umi'

export const request:RequestConfig={
    timeout:60000,
    prefix:"/api/",
    middlewares:[],
    errorConfig: {
        errorPage:LOGIN_PAGE_ROUTE,
        adaptor: (resData) => {
          return {
            ...resData,
            success: resData.code==0,
            errorMessage: resData.errorMessage||resData.message,
          };
        }
    }
}