import request from '@/utils/request';

export function getModelList(data) {
  return request('blisscake/backend/diyModel/find', {
    method: 'POST',
    data,
  });
}

export function addModel(data) {
  return request('blisscake/backend/diyModel/add', {
    method: 'POST',
    data,
  });
}

export function editModel(data) {
  return request('blisscake/backend/diyModel/update', {
    method: 'POST',
    data,
  });
}

export function batchUpdateGroup(data) {
  return request('blisscake/backend/diyModel/batchUpdateGroup', {
    method: 'POST',
    data,
  });
}

export function batchDelete(data) {
  return request('blisscake/backend/diyModel/batchDelete', {
    method: 'POST',
    data,
  });
}

export function detailModel(data) {
  return request('blisscake/backend/diyModel/detail', {
    method: 'GET',
    params: data,
  });
}

export function copyModel(data) {
  return request('blisscake/backend/diyModel/copyModel', {
    method: 'GET',
    params: data,
  });
}
