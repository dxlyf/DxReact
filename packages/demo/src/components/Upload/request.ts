import { upload } from 'qiniu-js';
import { getUploadToken } from '@/services/common';
import moment from 'moment';

function getFileExtension(filename: string, opts?: any) {
  if (!opts) opts = {};
  if (!filename) return '';
  var ext = (/[^./\\]*$/.exec(filename) || [''])[0];
  return opts.preserveCase ? ext : ext.toLowerCase();
}
function uuid() {
  var random = () => {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
  };
  return (
    random() +
    random() +
    '-' +
    random() +
    '-' +
    random() +
    '-' +
    random() +
    '-' +
    random() +
    random() +
    random()
  );
}
export const buindTodayUplaodDir = ({
  beforeDir = 'files',
  afterDir = false,
  isDate = true,
} = {}) => {
  return [beforeDir, isDate ? moment().format('YYYY-MM-DD') : '', afterDir]
    .filter(Boolean)
    .join('/');
};
export const uploadRequest = ({
  onProgress,
  onError,
  onSuccess,
  method,
  data,
  filename,
  file,
  withCredentials,
  action,
  headers,
}: any) => {
  let subscription: any;
  let configData = Object.assign(
    {
      customVars: {},
      uploadDir: buindTodayUplaodDir({ beforeDir: 'images' }),
      uuid: false,
    },
    data || {},
  );
  let uploadDir = configData.uploadDir;
  getUploadToken()
    .then((tokenData: any) => {
      let ext = getFileExtension(file.name);
      let newFileName = configData.uuid ? uuid() + '.' + ext : file.name;
      let targetFileName = uploadDir
        ? uploadDir + '/' + newFileName
        : newFileName;
      let observable = upload(file, targetFileName, tokenData, {
        fname: file.name,
        customVars: configData.customVars,
      });
      subscription = observable.subscribe({
        next(data) {
          onProgress(
            {
              total: data.total.size,
              loaded: data.total.loaded,
              percent: (data.total.size / data.total.loaded) * 100,
            },
            file,
          );
        },
        error(err) {
          onError(err);
        },
        complete(res) {
          console.log('success', res);
          onSuccess({
            ...res,
            url: '/' + res.key,
            filename: newFileName,
          });
        },
      });
    })
    .catch(() => {
      onError(new Error('获取七牛token失败'));
    });
  return {
    abort() {
      if (subscription) {
        subscription.unsubscribe();
        subscription = null;
      }
    },
  };
};
