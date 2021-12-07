import React, { useState, useEffect, useReducer, useMemo, useRef, useCallback } from 'react';
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
import moment from 'moment';
import {get} from 'lodash' 

const { Option } = Select;
const Transaction = (props) => {
  const [loading, setLoading]: any = useState(false);
  const reqgetTradeConfig = useRequest(getTradeConfig, {
    // 请求设置信息数据
    manual: true,
    formatResult: (data: any) => data,
    onSuccess(data) {},
  });

  useMount(() => {
    reqgetTradeConfig.run({});
  });

  const onFinish = useCallback((values:any) => {
    if(loading){
      return
    }
    setLoading(true)
    let {timeArr,minDeliveryAmount,...restValues}=values
    let data={
      ...restValues,
      minDeliveryAmount:isNaN(parseFloat(minDeliveryAmount))?undefined:parseFloat(minDeliveryAmount)*100,
      deliveryStartTime:timeArr[0].format('HH:mm'),
      deliveryEndTime:timeArr[1].format('HH:mm')
    }
    updateTradeConfig(data).then(()=>{
      message.success('保存成功')
    }).finally(()=>{
      setLoading(false)
    })
  },[loading])
  const layout = {
    labelCol: { span: 4 },
    // wrapperCol: { span: 21 },
  };

  return (
    <ProCard split="horizontal" >
      {reqgetTradeConfig.data ? (
        <Form
          {...layout}
          layout="horizontal"
          colon={true}
          onFinish={onFinish}
          initialValues={{
            // 赋初始值
            bookDay: get(reqgetTradeConfig.data,'bookDay','7')+'',
            readyTime:get(reqgetTradeConfig.data,'readyTime',''),
            splitTime: get(reqgetTradeConfig.data,'splitTime','30')+'',
            stockOutType: get(reqgetTradeConfig.data,'stockOutType','1')+'',
            minDeliveryAmount:!isNaN(parseFloat(reqgetTradeConfig.data.minDeliveryAmount))?parseFloat(reqgetTradeConfig.data.minDeliveryAmount)/100:'',
            timeArr: [
              moment(get(reqgetTradeConfig.data,'deliveryStartTime','09:00'), 'HH:mm'),
              moment(get(reqgetTradeConfig.data,'deliveryEndTime',':22:00'), 'HH:mm'),
            ], // 格式化时间
          }}
        >
            <ProCard split="vertical" style={{paddingLeft:68,paddingTop:20}}>
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
          <ProCard title="配送时间" style={{paddingLeft:50}}>
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
          </ProCard>
          <ProCard  title="起送价" style={{paddingLeft:50}}>
          <Form.Item name="minDeliveryAmount" label="起送价(元)" rules={[{
                validator(rule, value) {
                    value=parseFloat(value)
                  if (!isNaN(value)&&value<0) {
                      return Promise.reject('不能为小于0')
                  }
                  return Promise.resolve()
              }
          }]}>
              <InputNumber style={{ width: 160 }}/>
            </Form.Item>
          </ProCard>
          <Form.Item wrapperCol={{ span: 12, offset: 6 }}>
              <Button loading={loading}
                type="primary"
                htmlType="submit"
                style={{ width: '120px' }}
              >
                保存
              </Button>
            </Form.Item>
        </Form>
      ) : <Spin></Spin>}
    </ProCard>
  );
};

export default Transaction;
