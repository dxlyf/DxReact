/**
 * api请求
 * @author fanyonglong
*/
import type {
  ResponseError as ResponseErrorType,
  RequestOptionsInit,
} from 'umi-request';
import { extend, ResponseError } from 'umi-request';
import { history } from 'umi';
import { message, notification } from 'antd';
import app from './app';

// 后台错误码
enum CODE_TYPES {
  SUCCESS,
  ERROR,
}
// 错误处理类型
enum ERROR_TYPE {
  ERROR = 1, // 错误提示
  WARN = 2, // 警告提示
  NOTIFICATION = 3, // 通知
  REDIRECT = 4, // 重定向
  SLIENT = 5, // 不自动处理
}
type CustomeRequestOptions = {
  skipErrorHandler?: boolean; // 跳过错误自动处理
} & RequestOptionsInit;
type CustomeResonseError = {
  isBusinessError?: boolean;
  request: {
    options: CustomeRequestOptions;
  } & ResponseErrorType['request'];
} & ResponseErrorType;

type ErrorInfoType = {
  type: number;
  message?: string;
  url?: string;
};

const request = extend({
  timeout: 60000,
  getResponse: true,
  errorHandler(error: CustomeResonseError) {
    let { request, response, data } = error;
    let errorInfo: ErrorInfoType;
    if (error.type === 'ResponseError') {
      error.isBusinessError = true;
      // 业务错误
      if (request.options.skipErrorHandler == true) {
        errorInfo = {
          type: ERROR_TYPE.SLIENT,
          message: data.message,
        };
      } else {
        errorInfo = {
          type: data.code,
          message: data.message,
        };
      }
    } else {
      error.isBusinessError = false;
      // http请求错误
      errorInfo = {
        type: ERROR_TYPE.ERROR,
        message: data.message,
      };
    }
    if (errorInfo!) {
      switch (errorInfo.type) {
        case ERROR_TYPE.SLIENT:
          break;
        case ERROR_TYPE.ERROR:
          message.error(errorInfo.message);
          break;
        case ERROR_TYPE.WARN:
          message.error(errorInfo.message);
          break;
        case ERROR_TYPE.NOTIFICATION:
          notification.open({
            message: errorInfo.message,
          });
          break;
        case ERROR_TYPE.REDIRECT:
          history.push({
            pathname: errorInfo.url,
          });
          break;
        default:
          message.error(errorInfo.message);
          break;
      }
    }
    throw error;
  },
});
request.interceptors.request.use((url, options: any) => {
  if (!url.startsWith('http')) {
    url = '/api/' + url;
  }
  options = options || {};
  if (!options.headers) {
    options.headers = {};
  }
  options.headers.token = app.getToken();
  return {
    url,
    options,
  };
});
request.use(async function (ctx, next) {
  await next();
  if (ctx.res.data.code === CODE_TYPES.SUCCESS) {
    ctx.res = ctx.res.data.data;
    return;
  }
  // @ts-expect-error
  throw new ResponseError(
    ctx.res.response,
    '业务错误',
    ctx.res.data,
    ctx.req,
    'ResponseError',
  );
});
export default (url: string, options: CustomeRequestOptions = {}) => {
  return request(url, options);
};
