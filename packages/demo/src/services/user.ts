import request from '@/utils/request';

export function getCurrentUser() {
  return request('users/getCurrentUser', {
    skipErrorHandler: true,
  });
}
export function getUserList(data: any) {
  return request('users/getUserList', {
    method: 'POST',
    data,
  });
}
export function login(data: any) {
  return request('users/login', {
    method: 'POST',
    skipErrorHandler: true,
    data,
  });
}
export function logout() {
  return request('users/logout', {
    method: 'POST',
    skipErrorHandler: true,
  });
}
