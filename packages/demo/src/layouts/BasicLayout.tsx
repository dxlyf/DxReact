/**
 * 商家后台母版页
 * @author fanyonglong
 */
import type {
  MenuDataItem,
  BasicLayoutProps as ProLayoutProps,
  Settings,
} from '@ant-design/pro-layout';
import ProLayout, { RouteContext, PageContainer } from '@ant-design/pro-layout';
import React, { useContext } from 'react';
import type { Dispatch, ConnectProps } from 'umi';
import { Link, connect, history } from 'umi';
import Authorized, { checkAuthorize } from '@/components/Authorized';
import RightContent from '@/components/RightContent';
import Status403 from '@/pages/exception/403';
import Status404 from '@/pages/exception/404';
import type { GlobalModelState } from '@/models/global';
import logo from '@/assets/images/128.png';

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
  menuList
    .map((item) => {
      const localItem:any = {
        ...item,
        children: item.children
          ? postMenuDataRender(item.children).filter(Boolean)
          : undefined,
      };
      if (localItem.children && localItem.children.length <= 0) {
        return null as any;
      }
      if(!localItem.authority){
        return localItem
      }
      return checkAuthorize(
        item.authority,
        localItem,
        null,
      ) as MenuDataItem;
    })
    .filter(Boolean);

const BasicLayout: React.FC<any> = ({ children }) => {
  const { menuData, currentMenu, breadcrumb } = useContext(RouteContext);
  return (
    <PageContainer title={false} extra={false}>
      {!currentMenu||(currentMenu&&!currentMenu.authority)?children:<Authorized
        authority={currentMenu.authority}
        noMatch={<Status403></Status403>}>
        {children}
      </Authorized>}
    </PageContainer>
  );
};

const BasicLayoutWrapper: React.FC<{ settings: any } & ConnectProps> = ({
  settings,
  location,
  route,
  children,
  ...restProps
}) => {
  return (
    <ProLayout
      logo={logo}
      title="商家管理后台"
      className="basic-layout-wrapper"
      {...settings}
      route={route}
      location={location}
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
      itemRender={(route: any, params, routes, paths) => {
        const isNav =
          (route.component && routes.indexOf(route) !== routes.length - 1) ||
          route.breadcrumbNav; // routes.indexOf(route) === 0;
        return isNav ? (
          <Link to={route.path}>{route.breadcrumbName}</Link>
        ) : (
          <span>{route.breadcrumbName}</span>
        );
      }}
      postMenuData={postMenuDataRender}
      rightContentRender={() => <RightContent />}
    >
      <BasicLayout>{children}</BasicLayout>
    </ProLayout>
  );
};

export default connect(({ global }: { global: GlobalModelState }) => ({
  settings: global.settings,
}))(BasicLayoutWrapper);
