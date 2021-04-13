import request from '@/utils/request';

export function getTradeConfig(data) {
  return request('blisscake/backend/bussinessConfig/getTradeConfig', {
    method: 'GET',
    params: data,
  });
}

export function updateTradeConfig(data) {
  return request('blisscake/backend/bussinessConfig/updateTradeConfig', {
    method: 'POST',
    data,
  });
}
