import { Tag, Space, Menu, Dropdown, Avatar } from 'antd';
import {
  QuestionCircleOutlined,
  LogoutOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import React, { useCallback } from 'react';
import { connect, ConnectProps, ConnectRC, history } from 'umi';
import { UserModelState } from '@/models/user';
import styles from './index.less';

export type SiderTheme = 'light' | 'dark';

export type RightContentProps = {
  navTheme?: SiderTheme;
  layout?: string;
  user?: UserModelState;
} & ConnectProps;

const RightContent: React.FC<Partial<RightContentProps>> = ({
  navTheme,
  layout,
  user,
  dispatch,
}) => {
  let currentUser = user?.currentUser;
  let className = styles.right;

  if ((navTheme === 'dark' && layout === 'top') || layout === 'mix') {
    className = `${styles.right}  ${styles.dark}`;
  }

  const onMenuClick = useCallback(
    (item) => {
      if (item.key === 'logout') {
        dispatch!({
          type: 'user/logout',
        });
      }
    },
    [dispatch],
  );
  const menuHeaderDropdown = (
    <Menu className={styles.menu} selectedKeys={[]} onClick={onMenuClick}>
      <Menu.Item key="logout">
        <LogoutOutlined />
        退出登录
      </Menu.Item>
    </Menu>
  );
  return (
    <Space className={className}>
      <Dropdown overlay={menuHeaderDropdown}>
        <span className={`${styles.action} ${styles.account}`}>
          <Avatar
            size="small"
            className={styles.avatar}
            src={currentUser.avatar}
            alt="avatar"
          />
          <span className={`${styles.name} anticon`}>
            {currentUser.firstName}
          </span>
        </span>
      </Dropdown>
    </Space>
  );
};
export default connect(({ user }: { user: UserModelState }) => ({
  user: user,
}))(RightContent);
