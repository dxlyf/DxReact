import React, { FC, useState, useLayoutEffect, useMemo } from 'react';
import { PageLoading } from '@ant-design/pro-layout';
import { Redirect, ConnectProps, connect,Dispatch,Loading } from 'umi';
import { stringify } from 'querystring';
import { UserModelState } from '@/models/user'

type SecurityLayoutProps = {
  loading: boolean;
  user: UserModelState;
  dispatch:Dispatch
} & ConnectProps;


const SecurityLayout: FC<SecurityLayoutProps> = ({ children, loading,location, user, dispatch }) => {
  let currentUser = user.currentUser
  const isLogin = !!currentUser;
  let [isReady, setReady] = useState(isLogin ? true : false)// 默认请求
  useLayoutEffect(() => {
    if (isReady) {
      return
    }
    setReady(true)
    dispatch({
      type: "user/getUserInfo"
    }).catch(()=>{})
  }, [])
  const queryString = useMemo(() => stringify({
    redirect: window.location.pathname,
  }), [window.location.pathname])
  // 如果还没发起请求验证用户是否登录或在请求中，显示加载中
  if ((!isLogin && loading) || !isReady) {
    return <PageLoading />;
  }
  if (!isLogin &&location.pathname !== "/login") {
    return <Redirect to={`/login?${queryString}`} />;
  }
  return children as any;
}

export default connect(({ user, loading }: { user: UserModelState, loading: Loading }) => ({
  user: user,
  loading: loading.models.user,
}))(SecurityLayout);
