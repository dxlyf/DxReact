import request from '@/utils/request';

export function getUploadToken() {
  return request('baseinfo/backend/file/getUploadToken', {
    method: 'POST',
    data: {},
  });
}
