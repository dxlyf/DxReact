/**
 * Ant Design Pro v4 use `@ant-design/pro-layout` to handle Layout.
 * You can view component api by:
 * https://github.com/ant-design/ant-design-pro-layout
 */
import type {
  MenuDataItem,
  BasicLayoutProps as ProLayoutProps,
  Settings,
} from '@ant-design/pro-layout';
import ProLayout, { RouteContext,PageContainer  } from '@ant-design/pro-layout';
import React, { useEffect, useMemo, useRef, useContext } from 'react';
import type { Dispatch } from 'umi';
import { Link, connect, history } from 'umi';
import { GithubOutlined } from '@ant-design/icons';
import { Result, Button } from 'antd';
import { getMatchMenu, transformRoute } from '@umijs/route-utils';
import Authorized, { checkAuthorize } from '@/components/Authorized'
import RightContent from '@/components/RightContent'
import  Status403 from '@/pages/exception/403'
import  Status404 from '@/pages/exception/404'

export type BasicLayoutProps = {
  breadcrumbNameMap: Record<string, MenuDataItem>;
  route: ProLayoutProps['route'] & {
    authority: string[];
  };
  settings: Settings;
  dispatch: Dispatch;
} & ProLayoutProps;
export type BasicLayoutContext = { [K in 'location']: BasicLayoutProps[K] } & {
  breadcrumbNameMap: Record<string, MenuDataItem>;
};

const postMenuDataRender = (menuList: MenuDataItem[]): MenuDataItem[] =>
  menuList.map((item) => {
    const localItem = {
      ...item,
      children: item.children ? postMenuDataRender(item.children).filter(Boolean) : undefined,
    };
    if (localItem.children && localItem.children.length <= 0) {
       return null as any
    }
    return checkAuthorize(item.authority, localItem, null) as MenuDataItem;
  }).filter(Boolean);
const menuDataRender = (menuList: MenuDataItem[]): MenuDataItem[] =>
  menuList.map((item) => {
    const localItem = {
      ...item,
      children: item.children ? menuDataRender(item.children): undefined,
    };
    return localItem
  });

const BasicLayout: React.FC<BasicLayoutProps> = (props) => {
  const {children} = props;
  const { menuData, currentMenu,breadcrumb } = useContext(RouteContext)
  if(currentMenu&&currentMenu.redirect){
     return children as React.ReactElement
  }
  if(!currentMenu||currentMenu&&!currentMenu.component){
     return <Status404></Status404>
  }
  return  <PageContainer title={false} extra={false}><Authorized authority={currentMenu?.authority} noMatch={<Status403></Status403>}>{children}</Authorized></PageContainer>
};

const BasicLayoutWrapper = (props: any) => {
  return <ProLayout
    // logo={logo}
    title="admin"
    className="basic-layout-wrapper"
    {...props}
    onMenuHeaderClick={() => history.push('/')}
    menuItemRender={(menuItemProps, defaultDom) => {
      if (
        menuItemProps.isUrl ||
        !menuItemProps.path ||
        location.pathname === menuItemProps.path
      ) {
        return defaultDom;
      }

      return <Link to={menuItemProps.path}>{defaultDom}</Link>;
    }}
    breadcrumbRender={(routers = []) => routers}
    itemRender={(route, params, routes, paths) => {
      const first = routes.indexOf(route) === 0;
      return first ? (
        <Link to={paths.join('/')}>{route.breadcrumbName}</Link>
      ) : (
        <span>{route.breadcrumbName}</span>
      );
    }}
    menuDataRender={menuDataRender}
    postMenuData={postMenuDataRender}
    rightContentRender={() => <RightContent />}
  >
    <BasicLayout {...props} ></BasicLayout>
  </ProLayout>
}

export default BasicLayoutWrapper;
