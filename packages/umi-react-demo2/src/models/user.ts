// @ts-nocheck
import { Effect, ImmerReducer, Reducer } from 'umi';
import { setCurrentUserAuthority } from '@/components/Authorized';
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
    currentUser: {}, //当前登录用户信息
  },
  effects: {
    *getUserInfo({ payload }, { call, put, all }) {
      
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
      let permissionCodeSet = payload?.permissionCodeSet
        ? [...payload?.permissionCodeSet]
        : [];
      setCurrentUserAuthority(permissionCodeSet);
      state.currentUser = payload;
      app.currentUser = payload;
    },
  },
};
export default UserModel;
