import { Effect, ImmerReducer, Reducer } from 'umi';
import * as userService from '@/services/user';
import { setCurrentUserAuthority } from '@/components/Authorized';
import app from '@/utils/app'
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
    *getUserInfo({ payload }, { call, put,all }) {
      try {
        let [data,config] = yield all([call(userService.getCurrentUser,{
          appCode:app.clientType
        }),call(userService.getResouceConfig)]);
        app.resourceConfig=config
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
        let res = yield call(userService.login, {
          ...payload,
          loginType:1,// 登入类型：1-用户名密码、2-短信验证码
          clientType:app.clientType,
          needVerification:0,
        });
        app.setToken(res.token)
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
          payload: {
             token:app.getToken()
          },
        });
        app.setToken(null)
        return res;
      } catch (e) {
        return Promise.reject(e);
      }
    },
  },
  reducers: {
    setCurrentUser(state, { payload }) {
      setCurrentUserAuthority(payload?.permissionCodeSet || []);
      state.currentUser = payload;
      app.currentUser=payload
    },
  },
};
export default UserModel;
