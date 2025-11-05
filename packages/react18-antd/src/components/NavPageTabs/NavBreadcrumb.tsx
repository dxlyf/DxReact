import { useLayoutEffect, useCallback, useMemo, useContext, useState } from 'react';
import { RouteContext, type MenuDataItem } from '@ant-design/pro-layout';
import { Breadcrumb } from 'antd';
import styles from './index.module.scss';

type BreadcrumbItemType = {
    name?: string;
    key?: string;
    [key: string]: any;
};
type NavBreadcrumbProps = {
    items?: BreadcrumbItemType[] | false;
};
export const NavBreadcrumb = (props: NavBreadcrumbProps) => {
    const { items: propBreadcrumbItems } = props;
    const { matchMenus } = useContext(RouteContext);
    const renderBreadcrumb = () => {
        if (propBreadcrumbItems === false) {
          return null;
        }
        let breadcrumbItems = propBreadcrumbItems ?? matchMenus;
        return (
          <div className={styles.pageBreadcrumb}>
            <Breadcrumb items={breadcrumbItems?.map((d,i)=>({key:d.key,title:d.name}))}>
            </Breadcrumb>
          </div>
        );
      };
    return <>{renderBreadcrumb()}</>;
};