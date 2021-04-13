import React, { useState, useEffect, useReducer, useMemo, useRef } from 'react';
import {
  Row,
  Col,
  Card,
  Skeleton,
  message,
  Spin,
  Empty,
  Button,
  Radio,
  TimePicker,
  Select,
  Form,
  InputNumber,
} from 'antd';
import ProCard from '@ant-design/pro-card';
import styles from './transaction.less';
import { useSelections, useRequest, useMount } from 'ahooks';
import { getTradeConfig, updateTradeConfig } from '@/services/setting';
import { useImmer } from 'use-immer';
import moment from 'moment';

const { Option } = Select;
const Transaction = (props) => {
  const [state, setState]: any = useImmer({
    // 相当于声明data
    lastTime: 0,
  });
  const reqgetTradeConfig = useRequest(getTradeConfig, {
    // 请求设置信息数据
    manual: true,
    formatResult: (data: any) => data,
    onSuccess(data) {},
  });
  // 保存设置
  const requpdateTradeConfig = useRequest(
    (params) => updateTradeConfig(params),
    {
      manual: true,
      onSuccess(data) {
        console.log('保存设置', data);
        message.success('保存成功');
      },
    },
  );

  useMount(() => {
    reqgetTradeConfig.run({});
  });

  const onFinish = (e: any) => {
    // 点击保存按钮
    console.log(e);
    const rangeValue = e['timeArr'];
    let params = e;
    delete params.timeArr;
    const rezNumber = (str) => {
      return str.replace(/[^0-9]/gi, '');
    };
    for (const key in params) {
      if (key !== 'readyTime') {
        params[key] = rezNumber(params[key]);
      }
    }
    [params.deliveryStartTime, params.deliveryEndTime] = [
      rangeValue[0].format('HH:mm'),
      rangeValue[1].format('HH:mm'),
    ];
    // console.log(new Date().getTime());
    const nowTime = new Date().getTime();
    if (nowTime - state.lastTime > 2000 || state.lastTime === 0) {
      // 防止多次提交
      setState((draft) => {
        draft.lastTime = new Date().getTime();
      });
      requpdateTradeConfig.run(params);
      return;
    }
    // requpdateTradeConfig.run(params)
  };
  const layout = {
    labelCol: { span: 4 },
    // wrapperCol: { span: 21 },
  };
  const {
    // 把表单的初始值声明
    bookDay,
    deliveryEndTime,
    deliveryStartTime,
    readyTime,
    splitTime,
    stockOutType,
  } = reqgetTradeConfig.data ? reqgetTradeConfig.data : ''; // 没数据的时候报错

  return (
    <ProCard split="horizontal">
      {reqgetTradeConfig.data ? (
        <Form
          {...layout}
          layout="horizontal"
          colon={true}
          onFinish={onFinish}
          initialValues={{
            // 赋初始值
            bookDay: `近${bookDay}天`,
            deliveryEndTime,
            deliveryStartTime,
            readyTime,
            splitTime: `${splitTime}分钟`,
            stockOutType: `${stockOutType}`,
            timeArr: [
              moment(deliveryStartTime, 'HH:mm'),
              moment(deliveryEndTime, 'HH:mm'),
            ], // 格式化时间
          }}
        >
          <ProCard>
            <ProCard split="vertical">
              <Form.Item name="stockOutType" label="库存扣减方式：">
                <Radio.Group>
                  <Radio value="1">拍下减库存</Radio>
                  <Radio value="2">付款减库存</Radio>
                </Radio.Group>
              </Form.Item>
              <div className={styles.tipsText}>
                全平台库存扣减设置
                <br />
                1）拍下减库存：提交订单后扣减库存
                <br />
                2）付款减库存：订单支付后减库存
              </div>
            </ProCard>
          </ProCard>
          <ProCard style={{ marginLeft: 30 }}>配送时间</ProCard>
          <ProCard style={{ marginTop: -30 }}>
            <Form.Item
              name="timeArr"
              label="店铺营业时间"
              rules={[
                { required: true, message: '请选择开始时间和结束时间！' },
              ]}
            >
              <TimePicker.RangePicker format="HH:mm" />
            </Form.Item>
            <Form.Item name="splitTime" label="下单分割时长(分钟)">
              <Select style={{ width: 160 }}>
                <Option value="30">30分钟</Option>
                <Option value="60">60分钟</Option>
              </Select>
            </Form.Item>
            <Form.Item name="readyTime" label="生产&配送用时(分钟)">
              <InputNumber style={{ width: 160 }} min={1} />
            </Form.Item>
            <Form.Item name="bookDay" label="可下单天数">
              <Select style={{ width: 160 }}>
                <Option value="7">近7天</Option>
              </Select>
            </Form.Item>
            <Form.Item wrapperCol={{ span: 12, offset: 6 }}>
              <Button
                type="primary"
                htmlType="submit"
                style={{ width: '120px' }}
              >
                保存
              </Button>
            </Form.Item>
          </ProCard>
        </Form>
      ) : (
        ''
      )}
    </ProCard>
  );
};

export default Transaction;
