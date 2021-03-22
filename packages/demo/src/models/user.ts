import { Effect, ImmerReducer, Reducer } from 'umi';
import * as userService from '@/services/user';
import { setCurrentUserAuthority } from '@/components/Authorized';

export interface UserModelState {
  currentUser: any;
}

export interface UserModelType {
  namespace: 'user';
  state: UserModelState;
  effects: {
    getUserInfo: Effect;
    login: Effect;
    logout: Effect;
  };
  reducers: {
    setCurrentUser: ImmerReducer<UserModelState>;
  };
}
const UserModel: UserModelType = {
  namespace: 'user',
  state: {
    currentUser: null, //当前登录用户信息
  },
  effects: {
    *getUserInfo({ payload }, { call, put }) {
      try {
        let data = yield call(userService.getCurrentUser);
        yield put({
          type: 'setCurrentUser',
          payload: data,
        });
        return data;
      } catch (e) {
        yield put({
          type: 'setCurrentUser',
          payload: null,
        });
        return Promise.reject(e);
      }
    },
    *login({ payload }, { call, put }: { put: any; call: any }) {
      try {
        let res = yield call(userService.login, payload);
        yield put.resolve({
          type: 'getUserInfo',
        });
        return res;
      } catch (e) {
        return Promise.reject(e);
      }
    },
    *logout(_arg, { call, put }: { put: any; call: any }) {
      try {
        let res = yield call(userService.logout);
        yield put({
          type: 'setCurrentUser',
          payload: null,
        });
        return res;
      } catch (e) {
        return Promise.reject(e);
      }
    },
  },
  reducers: {
    setCurrentUser(state, { payload }) {
      setCurrentUserAuthority(payload?.permissions || []);
      state.currentUser = payload;
    },
  },
};
export default UserModel;
