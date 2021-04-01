import request from '@/utils/request';

export function getShopList() {
  return request('blisscake/backend/shop/findList', {
    method: 'GET',
  });
}
