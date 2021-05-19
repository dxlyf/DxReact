import request from '@/utils/request';

export function getAdvertisementList(data: any) {
  return request('blisscake/backend/advice/find', {
    method: 'POST',
    data: data,
  });
}
export function updateSort(data: any) {
  return request('blisscake/backend/advice/updateSort', {
    method: 'GET',
    params: data,
  });
}
export function updateStatus(data: any) {
  return request('blisscake/backend/advice/updateStatus', {
    method: 'POST',
    data: data,
  });
}
export function getAdvertisementDetail(data: any) {
  return request('blisscake/backend/advice/detail', {
    method: 'GET',
    params: data,
  });
}
export function addAdvertisement(data: any) {
  return request('blisscake/backend/advice/add', {
    method: 'POST',
    data,
  });
}
export function updateAdvertisement(data: any) {
  return request('blisscake/backend/advice/update', {
    method: 'POST',
    data,
  });
}
