import request from '@/utils/request';

export function getAllModelGroup(data) {
  return request('blisscake/backend/modelGroup/findTree', {
    method: 'GET',
    params: data,
  });
}

export function addModelGroup(data) {
  return request('blisscake/backend/modelGroup/add', {
    method: 'POST',
    data,
  });
}

export function editModelGroup(data) {
  return request('blisscake/backend/modelGroup/update', {
    method: 'POST',
    data,
  });
}

export function deleteModelGroup(data) {
  return request('blisscake/backend/modelGroup/delete', {
    method: 'GET',
    params: data,
  });
}

export function getModelGroupById(data) {
  return request('blisscake/backend/modelGroup/findByPid', {
    method: 'GET',
    params: data,
  });
}
export function searchModelGroupByName(data) {
  return request('blisscake/backend/modelGroup/searchByName', {
    method: 'GET',
    params: data,
  });
}

// 获取七牛上传token
export function getQiniuToken() {
  return request('baseinfo/backend/file/getUploadToken', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json;charset=utf-8',
    },
    data: {},
  });
}
