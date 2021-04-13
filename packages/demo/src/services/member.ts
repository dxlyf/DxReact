import request from '@/utils/request';

export function getMemberList(data: any) {
  return request('/members/backend/member/findPage', {
    method: 'POST',
    data: data,
  });
}
