/**
 * HTTP 状态码枚举
 */
export const HTTP_STATUS = {
  // 1xx - 信息响应
  /** 100 继续。客户端应继续请求 */
  CONTINUE: 100,
  /** 101 切换协议。服务器根据客户端的请求切换协议 */
  SWITCHING_PROTOCOLS: 101,

  // 2xx - 成功
  /** 200 请求成功 */
  OK: 200,
  /** 201 已创建。请求成功且服务器已创建新资源 */
  CREATED: 201,
  /** 202 已接受。请求已接受但尚未处理完成 */
  ACCEPTED: 202,
  /** 204 无内容。请求成功但无返回内容 */
  NO_CONTENT: 204,

  // 3xx - 重定向
  /** 301 永久移动。请求的资源已被永久移动到新 URI */
  MOVED_PERMANENTLY: 301,
  /** 302 临时移动。请求的资源临时移动到新 URI */
  FOUND: 302,
  /** 304 未修改。客户端缓存仍有效 */
  NOT_MODIFIED: 304,

  // 4xx - 客户端错误
  /** 400 请求参数错误 */
  BAD_REQUEST: 400,
  /** 401 未授权，需要登录 */
  UNAUTHORIZED: 401,
  /** 403 禁止访问，没有权限 */
  FORBIDDEN: 403,
  /** 404 资源未找到 */
  NOT_FOUND: 404,
  /** 405 请求方法不允许 */
  METHOD_NOT_ALLOWED: 405,
  /** 408 请求超时 */
  REQUEST_TIMEOUT: 408,
  /** 409 请求冲突 */
  CONFLICT: 409,
  /** 422 请求格式正确但语义错误（参数校验失败） */
  UNPROCESSABLE_ENTITY: 422,
  /** 429 请求频率过高，被限流 */
  TOO_MANY_REQUESTS: 429,

  // 5xx - 服务端错误
  /** 500 服务器内部错误 */
  INTERNAL_SERVER_ERROR: 500,
  /** 502 网关错误 */
  BAD_GATEWAY: 502,
  /** 503 服务不可用（过载或维护） */
  SERVICE_UNAVAILABLE: 503,
  /** 504 网关超时 */
  GATEWAY_TIMEOUT: 504,
} as const

/**
 * Axios 内部错误码
 * 对应 AxiosError.code 属性，用于区分网络/超时/取消等非 HTTP 状态码的错误类型
 */
  /** 重定向次数过多，超过 maxRedirects 限制 */
  export const ERR_FR_TOO_MANY_REDIRECTS = 'ERR_FR_TOO_MANY_REDIRECTS';
  /** 请求配置选项值非法（如 timeout 设为负数） */
  export const ERR_BAD_OPTION_VALUE = 'ERR_BAD_OPTION_VALUE';
  /** 请求配置选项不存在 */
  export const ERR_BAD_OPTION = 'ERR_BAD_OPTION';
  /** 网络错误（DNS 解析失败、连接被拒绝、网络断开等） */
  export const ERR_NETWORK = 'ERR_NETWORK';
  /** 使用了已弃用的 API */
  export const ERR_DEPRECATED = 'ERR_DEPRECATED';
  /** 响应格式错误（如 JSON 解析失败） */
  export const ERR_BAD_RESPONSE = 'ERR_BAD_RESPONSE';
  /** 请求参数格式错误 */
  export const ERR_BAD_REQUEST = 'ERR_BAD_REQUEST';
  /** 当前环境不支持此功能 */
  export const ERR_NOT_SUPPORT = 'ERR_NOT_SUPPORT';
  /** URL 格式无效 */
  export const ERR_INVALID_URL = 'ERR_INVALID_URL';
  /** 请求被主动取消（CancelToken / AbortController） */
  export const ERR_CANCELED = 'ERR_CANCELED';
  /** FormData 嵌套层数超过上限 */
  export const ERR_FORM_DATA_DEPTH_EXCEEDED = 'ERR_FORM_DATA_DEPTH_EXCEEDED';
  /** 请求超时（由 timeout 配置触发） */
  export const ECONNABORTED = 'ECONNABORTED';
  /** 连接被拒绝（服务端端口未监听或防火墙拦截） */
  export const ECONNREFUSED = 'ECONNREFUSED';
  /** 连接超时 */
  export const ETIMEDOUT = 'ETIMEDOUT';