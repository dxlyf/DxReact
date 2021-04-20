/**
 * 登录
 * @author fanyonglong
 */
import React, { useCallback, useState } from 'react';
import { connect, ConnectProps, history, Loading,Helmet } from 'umi';
import { Form, Input, Button, message, Space, Typography } from 'antd';
import { UserModelState } from '@/models/user';
import { useInterval } from 'ahooks';
import styles from './index.less';
import app from '@/utils/app';
import Icon from '@ant-design/icons';
import classNames from 'classnames';

type LoginProps = {
  user: UserModelState;
  loginLoading: boolean;
} & ConnectProps<{}, {}, { redirect?: string }>;
const Login: React.FC<LoginProps> = ({ dispatch, location, loginLoading }) => {
  const [form] = Form.useForm();
  const [needVerification, setNeedVerification] = useState(false);
  const [sendState, setSendState] = useState<any>({
    status: 'idle',
    interval: null,
  });
  let [arrivalTime, setArrivalTime] = useState(120);
  let [codePlaceholder, setCodePlaceholder] = useState('验证码');
  useInterval(() => {
    let value = arrivalTime - 1;
    setArrivalTime(value);
    if (value <= 0) {
      setSendState({
        status: 'again',
        interval: null,
      });
      setCodePlaceholder('验证码');
    }
  }, sendState.interval);
  const onSendVerifyCode = useCallback(() => {
    form.validateFields(['loginName']).then((values) => {
      setArrivalTime(120);
      setSendState({
        status: 'pedding',
        interval: 1000,
      });
      dispatch!({
        type: 'user/sendToSpecifiedMobile',
        payload: {
          clientId: app.clientType,
          loginName: values.loginName,
          typeCode: 'AdminLogin',
        },
      })
        .then((data: any) => {
          setCodePlaceholder(`已发送至:${data}`);
        })
        .catch(() => {
          message.error('发送失败，请重新发送');
          setArrivalTime(120);
          setSendState({
            status: 'again',
            interval: null,
          });
        });
    });
  }, [sendState]);
  const onSubmit = useCallback(
    (formData) => {
      let loginData = {
        ...formData,
        ifVerifyCode: needVerification ? 1 : 0,
      };
      dispatch!({
        type: 'user/login',
        payload: loginData,
      })
        .then((res: any) => {
          let redirect = location.query?.redirect;
          if (redirect === '/login') {
            redirect = '/';
          }
          history.push({
            pathname: redirect || '/',
          });
        })
        .catch((e: any) => {
          if (e.isBusinessError && e.data.code == 15417) {
            if (/5/.test(e.data.message)) {
              form.setFields([
                {
                  name: 'loginName',
                  errors: [
                    '连续输错5次将会被锁定30分钟，30分钟后可重试',
                    '如需急用，请联系重置密码',
                  ],
                },
              ]);
            } else {
              form.setFields([
                {
                  name: 'loginName',
                  errors: [e.data.message],
                },
              ]);
            }
          } else if (e.isBusinessError && e.data.code == 15418) {
            setNeedVerification(true); // 需要验证码
            form.setFields([
              {
                name: 'loginName',
                errors: [e.data.message],
              },
            ]);
          } else if (e.isBusinessError) {
            form.setFields([
              {
                name: 'loginName',
                errors: [e.data.message],
              },
            ]);
          } else {
            message.error(e.message || '服务出错');
          }
        });
    },
    [dispatch, form, needVerification],
  );
  const renderSendButtonText = () => {
    switch (sendState.status) {
      case 'idle':
        return '获取验证码';
      case 'pedding':
        return '重新发送' + '(' + arrivalTime + 'S)';
      case 'again':
        return '获取验证码';
    }
  };

  return (
    <div className={styles.container}>
      <Helmet>
        <title>登录 - 商家管理后台</title>
      </Helmet>
      <div className={styles.bg}></div>
      <div className={styles.loginWrap}>
        <div className={styles.logo}></div>
        <Form onFinish={onSubmit} form={form}>
          <Form.Item
            name="loginName"
            required={false}
            rules={[
              {
                required: true,
                message: '用户名不能为空',
                whitespace: true,
              },
            ]}
            className={classNames(styles.userNameFormItem, {
              [styles.notNeedVerification]: !needVerification,
            })}
          >
            <Input
              prefix={<span className={styles.userNameIcon}></span>}
              className={styles.userName}
              placeholder="请输入用户名"
            ></Input>
          </Form.Item>
          <Form.Item
            name="password"
            required={false}
            className={styles.pwdFormItem}
            rules={[
              {
                required: true,
                message: '密码不能为空',
                whitespace: true,
              },
            ]}
          >
            <Input.Password
              prefix={<span className={styles.passwordIcon}></span>}
              className={styles.password}
              placeholder="请输入用户密码"
            ></Input.Password>
          </Form.Item>
          {needVerification && (
            <Form.Item name="verifyCode">
              <Space>
                <Form.Item
                  noStyle
                  name="verifyCode"
                  rules={[
                    {
                      required: true,
                      message: '请输入验证码',
                    },
                  ]}
                >
                  <Input
                    className={styles.verifyCode}
                    placeholder={codePlaceholder}
                  ></Input>
                </Form.Item>
                <Button
                  className={styles.verifyCodeBtn}
                  onClick={onSendVerifyCode}
                  disabled={sendState.status == 'pedding'}
                >
                  {renderSendButtonText()}
                </Button>
              </Space>
            </Form.Item>
          )}
          <Form.Item colon={false}>
            <Button
              loading={loginLoading}
              type="primary"
              htmlType="submit"
              danger
              className={classNames(styles.btnLogin, {
                [styles.needVerification]: needVerification,
              })}
            >
              登录
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};
export default connect(
  ({ user, loading }: { user: UserModelState; loading: Loading }) => ({
    user: user,
    loginLoading: !!loading.effects['user/login'],
  }),
)(Login);
