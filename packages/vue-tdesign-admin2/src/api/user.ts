import {request} from '@/utils/request'

export type UserInfo={
    id:number,
    username:string,
    isSuperAdmin:boolean,
}
export const login = (username:string,password:string) => {
    return request<boolean>({
        url: '/user/login',
        method: 'POST',
        data:{
            username,
            password
        }
    })
}
export const getCurrentUserInfo=()=>{
    return request<UserInfo>({
        url: '/api/user/getCurrentUserInfo',
        method: 'get'
    })
}