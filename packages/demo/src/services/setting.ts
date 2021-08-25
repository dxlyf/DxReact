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
// 标签设置信息保存
export function updateLabelConfig(data) {
  return request('blisscake/backend/bussinessConfig/updateLabelConfig', {
    method: 'POST',
    data,
  });
}
// 获取标签设置信息
export function getLabelConfig() {
  return request('blisscake/backend/bussinessConfig/getLabelConfig', {
    method: 'GET'
  });
}
// 分享设置信息保存
export function updateShareConfig(data) {
  return request('blisscake/backend/bussinessConfig/updateShareConfig', {
    method: 'POST',
    data,
  });
}
// 获取分享设置信息
export function getShareConfig() {
  return request('blisscake/backend/bussinessConfig/getShareConfig', {
    method: 'GET'
  });
}
