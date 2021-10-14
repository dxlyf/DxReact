import request from '@/utils/request';

// 获取评价列表
export function getList(data: any) {
  return request('blisscake/backend/orderInfoReview/findPage', {
    method: 'POST',
    data,
  });
}

// 获取评价列表
export function batchUpdateStatus(data: any) {
    return request('blisscake/backend/orderInfoReview/batchUpdateReviewStatus', {
      method: 'POST',
      data,
    });
  }
