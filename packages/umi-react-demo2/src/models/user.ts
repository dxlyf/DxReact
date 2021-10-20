// @ts-nocheck
import { Effect, ImmerReducer, Reducer } from 'umi';
import app from '@/utils/app';
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
    sendToSpecifiedMobile: Effect;
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
    *getUserInfo({ payload }, { call, put, all }) {
        yield put({
          type:"setCurrentUser",
          payload:{
              avatar:require('@/assets/images/128.png'),
              firstName:"admin"
          }
        })
    },
    *login({ payload }, { call, put }: { put: any; call: any }) {
    
    },
    *logout(_arg, { call, put }: { put: any; call: any }) {
 
    },
    *sendToSpecifiedMobile({ payload },{ call, put }: { put: any; call: any },) {

    },
  },
  reducers: {
    setCurrentUser(state, { payload }) {
      state.currentUser = payload
      app.currentUser = payload
    },
  },
};
export default UserModel;
