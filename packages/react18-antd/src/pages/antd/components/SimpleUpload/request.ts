import type * as React from 'react';

export type BeforeUploadFileType = File | Blob | boolean | string;

export type Action = string | ((file: RcFile) => string | PromiseLike<string>);

export interface UploadProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onError' | 'onProgress'> {
  name?: string;
  style?: React.CSSProperties;
  className?: string;
  disabled?: boolean;
  component?: React.ComponentType<any> | string;
  action?: Action;
  method?: UploadRequestMethod;
  /** @deprecated Please use `folder` instead */
  directory?: boolean;
  folder?: boolean;
  data?: Record<string, unknown> | ((file: RcFile | string | Blob) => Record<string, unknown>);
  headers?: UploadRequestHeader;
  accept?: string;
  multiple?: boolean;
  onBatchStart?: (
    fileList: { file: RcFile; parsedFile: Exclude<BeforeUploadFileType, boolean> }[],
  ) => void;
  onStart?: (file: RcFile) => void;
  onError?: (error: Error, ret: Record<string, unknown>, file: RcFile) => void;
  onSuccess?: (response: Record<string, unknown>, file: RcFile, xhr: XMLHttpRequest) => void;
  onProgress?: (event: UploadProgressEvent, file: RcFile) => void;
  beforeUpload?: (
    file: RcFile,
    FileList: RcFile[],
  ) => BeforeUploadFileType | Promise<void | BeforeUploadFileType> | void;
  customRequest?: CustomUploadRequestOption;
  withCredentials?: boolean;
  openFileDialogOnClick?: boolean;
  prefixCls?: string;
  id?: string;
  onMouseEnter?: (e: React.MouseEvent<HTMLDivElement>) => void;
  onMouseLeave?: (e: React.MouseEvent<HTMLDivElement>) => void;
  onClick?: (e: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>) => void;
  classNames?: {
    input?: string;
  };
  styles?: {
    input?: React.CSSProperties;
  };
  hasControlInside?: boolean;
  pastable?: boolean;
}

export interface UploadProgressEvent extends Partial<ProgressEvent> {
  percent?: number;
}

export type UploadRequestMethod = 'POST' | 'PUT' | 'PATCH' | 'post' | 'put' | 'patch';

export type UploadRequestHeader = Record<string, string>;

export type UploadRequestFile = Exclude<BeforeUploadFileType, File | boolean> | RcFile;

export interface UploadRequestError extends Error {
  status?: number;
  method?: UploadRequestMethod;
  url?: string;
}

export interface UploadRequestOption<T = any> {
  onProgress?: (event: UploadProgressEvent, file?: UploadRequestFile) => void;
  onError?: (event: UploadRequestError | ProgressEvent, body?: T) => void;
  onSuccess?: (body: T, fileOrXhr?: UploadRequestFile | XMLHttpRequest) => void;
  data?: Record<string, unknown>;
  filename?: string;
  file: UploadRequestFile;
  withCredentials?: boolean;
  action: string;
  headers?: UploadRequestHeader;
  method: UploadRequestMethod;
}

export type CustomUploadRequestOption = (
  option: UploadRequestOption,
  info: { defaultRequest: (option: UploadRequestOption) => { abort: () => void } | void },
) => void | { abort: () => void };
export interface RcFile extends File {
  uid: string;
}

function getError(option: UploadRequestOption, xhr: XMLHttpRequest) {
  const msg = `cannot ${option.method} ${option.action} ${xhr.status}'`;
  const err = new Error(msg) as UploadRequestError;
  err.status = xhr.status;
  err.method = option.method;
  err.url = option.action;
  return err;
}

function getBody(xhr: XMLHttpRequest) {
  const text = xhr.responseText || xhr.response;
  if (!text) {
    return text;
  }

  try {
    return JSON.parse(text);
  } catch (e) {
    return text;
  }
}

export default function upload(option: UploadRequestOption) {
  // eslint-disable-next-line no-undef
  const xhr = new XMLHttpRequest();

  if (option.onProgress && xhr.upload) {
    xhr.upload.onprogress = function progress(e: UploadProgressEvent) {
      if (e.total > 0) {
        e.percent = (e.loaded / e.total) * 100;
      }
      option.onProgress(e);
    };
  }

  // eslint-disable-next-line no-undef
  const formData = new FormData();

  if (option.data) {
    Object.keys(option.data).forEach(key => {
      const value = option.data[key];
      // support key-value array data
      if (Array.isArray(value)) {
        value.forEach(item => {
          // { list: [ 11, 22 ] }
          // formData.append('list[]', 11);
          formData.append(`${key}[]`, item);
        });
        return;
      }

      formData.append(key, value as string | Blob);
    });
  }

  // eslint-disable-next-line no-undef
  if (option.file instanceof Blob) {
    formData.append(option.filename, option.file, (option.file as any).name);
  } else {
    formData.append(option.filename, option.file);
  }

  xhr.onerror = function error(e) {
    option.onError(e);
  };

  xhr.onload = function onload() {
    // allow success when 2xx status
    // see https://github.com/react-component/upload/issues/34
    if (xhr.status < 200 || xhr.status >= 300) {
      return option.onError(getError(option, xhr), getBody(xhr));
    }

    return option.onSuccess(getBody(xhr), xhr);
  };

  xhr.open(option.method, option.action, true);

  // Has to be after `.open()`. See https://github.com/enyo/dropzone/issues/179
  if (option.withCredentials && 'withCredentials' in xhr) {
    xhr.withCredentials = true;
  }

  const headers = option.headers || {};

  // when set headers['X-Requested-With'] = null , can close default XHR header
  // see https://github.com/react-component/upload/issues/33
  if (headers['X-Requested-With'] !== null) {
    xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
  }

  Object.keys(headers).forEach(h => {
    if (headers[h] !== null) {
      xhr.setRequestHeader(h, headers[h]);
    }
  });

  xhr.send(formData);

  return {
    abort() {
      xhr.abort();
    },
  };
}
