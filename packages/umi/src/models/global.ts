import { Effect, ImmerReducer, Reducer } from 'umi';
import * as userService from '@/services/user'
import { setCurrentUserAuthority } from '@/components/Authorized'

export interface GlobalModelState {
    settings: any;
}

export interface GlobalModelType {
    namespace: 'global';
    state: GlobalModelState;
    effects: {

    };
    reducers: {
        setState: ImmerReducer<GlobalModelState>;
    }
}
const UserModel: GlobalModelType = {
    namespace: "global",
    state: {
        // pro-layout 配置
        settings:{

        }
    },
    effects: {
   
    },
    reducers: {
        setState(state,action){
            
        }
    }
}
export default UserModel