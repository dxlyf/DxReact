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
  Steps,
  Table,
  Image,
  Statistic,
  Modal,
} from 'antd';
import ProCard from '@ant-design/pro-card';
import { QuestionCircleOutlined } from '@ant-design/icons';
import styles from './orderDetail.less';
import { useSelections, useRequest, useMount } from 'ahooks';
import {
  getOrderDetail,
  getByOrderLog,
  getcancelOrder,
} from '@/services/order';
import { useImmer } from 'use-immer';
import { ExclamationCircleOutlined } from '@ant-design/icons';

const { Step } = Steps;
const { Countdown } = Statistic;
const OrderDetail = (props) => {
  let { location, match, route, history, setStore } = props;

  const [state, setState]: any = useImmer({
    // 相当于声明data
    goodsData: [],
  });
  const { orderId } = match.params;
  const imgFaillBack = `data:image/png;base64,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`;

  const columns = [
    {
      title: '商品信息',
      //   dataIndex: 'info',
      width: '50%',
      render: (text) => (
        <div style={{ display: 'flex' }}>
          <ProCard colSpan={5}>
            <Image
              src={
                text.picUrl
                  ? `https://rf.blissmall.net/${text.picUrl}?imageView2/1/w/150/h/150`
                  : imgFaillBack
              }
              className={styles.tableImage}
            ></Image>
          </ProCard>
          <ProCard>
            <div>{text.productName}</div>
            <div className={styles.gray}>规格编码：{text.productItemNo}</div>
            <div className={styles.gray}>{text.propertyStr}</div>
          </ProCard>
        </div>
      ),
    },
    {
      title: '单价(元) ',
      dataIndex: 'unitPrice',
    },
    {
      title: '数量',
      dataIndex: 'quantity',
    },
    {
      title: '优惠(元)',
      dataIndex: 'discountAmount',
    },
    {
      title: '小计(元)',
      dataIndex: 'payAmount',
    },
    {
      title: '发货状态',
      dataIndex: 'orderStatusStr',
    },
  ];
  // 详情
  const reqgetOrderDetail = useRequest(() => getOrderDetail(orderId), {
    manual: true,
    formatResult: (data: any) => data,
    onSuccess(data) {
      // console.log('请求chenggong');
      const dataArr = data.orderItemList;
      dataArr.forEach((item, index) => {
        dataArr[index].blessInfo = item.blessInfo
          ? JSON.parse(item.blessInfo)
          : {};
        dataArr[index].key = item.id;
        dataArr[index].picUrl = item.picUrl.replace(/^\//, '');
        dataArr[index].unitPrice = toPrice(item.unitPrice);
        dataArr[index].payAmount = toPrice(item.payAmount);
        dataArr[index].discountAmount = toPrice(item.discountAmount);
      });
      setState((draft) => {
        draft.goodsData = dataArr; // 表格
      });
    },
  });
  // 日志
  const reqgetByOrderLog = useRequest(() => getByOrderLog(orderId), {
    manual: true,
    formatResult: (data: any) => data,
    onSuccess(data) {
      // console.log('请求chenggong',data);
    },
  });
  // 取消订单
  const reqgetcancelOrder = useRequest((params) => getcancelOrder(params), {
    manual: true,
    formatResult: (data: any) => data,
    onSuccess(data) {
      console.log('取消订单', data);
      message.success('取消成功');
      setTimeout(() => {
        reqgetOrderDetail.run();
        reqgetByOrderLog.run();
      }, 1500);
    },
  });
  useMount(() => {
    reqgetOrderDetail.run();
    reqgetByOrderLog.run();
  });
  const deadline = reqgetOrderDetail.data
    ? new Date(reqgetOrderDetail.data.createdTime).getTime() + 1000 * 60 * 15
    : ''; // 倒计时
  const onFinish = () => {
    console.log('倒计时完成');
    reqgetOrderDetail.run();
    reqgetByOrderLog.run();
  };
  const onCancelOrder = () => {
    console.log('取消按钮');
    Modal.confirm({
      title: '是否取消订单？',
      centered: true,
      icon: <ExclamationCircleOutlined />,
      content: '',
      okText: '确认',
      cancelText: '取消',
      onOk: () => {
        console.log('点击确定');
        reqgetcancelOrder.run({ orderId: orderId });
      },
    });
  };
  const toPrice = (str: any) => {
    return Number(str * 0.01).toFixed(2);
  };
  return (
    <ProCard split="horizontal">
      {reqgetOrderDetail.data ? (
        <div>
          <ProCard>
            <span className={styles.mar20}>
              订单编号：{reqgetOrderDetail.data.orderNo || '-'}
            </span>
            <span className={styles.mar20}>
              下单时间：{reqgetOrderDetail.data.createdTime || '-'}
            </span>
            <span className={styles.mar20}>
              订单类型：{reqgetOrderDetail.data.typeStr || '-'}
            </span>
            <span className={styles.mar20}>
              订单来源：{reqgetOrderDetail.data.appName || '-'}
            </span>
            <span className={styles.mar20}>
              店铺归属：{reqgetOrderDetail.data.shopName || '-'}
            </span>
            <span className={styles.mar20}>
              城市归属：{reqgetOrderDetail.data.receiverCityName || '-'}
            </span>
          </ProCard>
          <ProCard>
            <div className={styles.borderBig}>
              {/* 订单状态 0:未支付 1:付款确认中 10:待发货 20：已发货 30:已完成 40:已关闭 */}
              <div className={styles.border} style={{ padding: '20px' }}>
                <div className={styles.status}>
                  {reqgetOrderDetail.data.status == 0
                    ? '待付款'
                    : reqgetOrderDetail.data.status == 10
                    ? '待发货'
                    : reqgetOrderDetail.data.status == 20
                    ? '已发货'
                    : reqgetOrderDetail.data.status == 30
                    ? '已完成'
                    : reqgetOrderDetail.data.status == 40
                    ? '已关闭'
                    : ''}
                </div>
                <ProCard>
                  {reqgetOrderDetail.data.status == 40 ? (
                    reqgetOrderDetail.data.cancelReason
                  ) : reqgetOrderDetail.data.status == 0 ? (
                    <Countdown
                      value={deadline}
                      valueStyle={{ fontSize: 14 }}
                      format="m分s秒后未支付，系统将自动关闭交易"
                      onFinish={onFinish}
                    />
                  ) : (
                    ''
                  )}
                </ProCard>

                {reqgetOrderDetail.data.status == 40 ? (
                  ''
                ) : (
                  <Button type="primary" onClick={onCancelOrder}>
                    取消订单
                  </Button>
                )}
              </div>
              <div style={{ padding: '40px', flexBasis: '70%' }}>
                {reqgetOrderDetail.data.status == 40 ? (
                  ''
                ) : (
                  <Steps
                    current={
                      reqgetOrderDetail.data.status == 0
                        ? 1
                        : reqgetOrderDetail.data.status == 10
                        ? 2
                        : reqgetOrderDetail.data.status == 20
                        ? 3
                        : reqgetOrderDetail.data.status == 30
                        ? 4
                        : 0
                    }
                    labelPlacement="vertical"
                    className={styles.steps}
                  >
                    <Step
                      title="买家下单"
                      description={reqgetOrderDetail.data.createdTime}
                    />
                    <Step
                      title="买家付款"
                      description={reqgetOrderDetail.data.payTime}
                    />
                    <Step
                      title="商家发货"
                      description={reqgetOrderDetail.data.packTime}
                    />
                    <Step
                      title="交易成功"
                      description={reqgetOrderDetail.data.finishTime}
                    />
                  </Steps>
                )}
              </div>
            </div>
          </ProCard>
          <div className={styles.infoDiv}>
            <div className={styles.infoTwoBox}>
              <div className={styles.infoTitle}>收货人信息</div>
              <div className={styles.info}>
                <div>收货人：</div>
                {reqgetOrderDetail.data.receiverName || '-'}
              </div>
              <div className={styles.info}>
                <div>联系电话：</div>
                {reqgetOrderDetail.data.receiverPhone || '-'}
              </div>
              <div className={styles.info}>
                <div>收货地址：</div>
                {reqgetOrderDetail.data.receiverFullAddress || '-'}
              </div>
            </div>
            <div className={styles.infoTwoBox}>
              <div className={styles.infoTitle}>买家信息</div>
              <div className={styles.info}>
                <div>买家：</div>
                {reqgetOrderDetail.data.buyerName || '-'}
              </div>
              <div className={styles.info}>
                <div>买家电话：</div>
                {reqgetOrderDetail.data.buyerPhone || '-'}
              </div>
              <div className={styles.info}>
                <div>买家备注：</div>
                {reqgetOrderDetail.data.buyerRemark || '-'}
              </div>
            </div>
            <div className={styles.infoTwoBox}>
              <div className={styles.infoTitle}>生产及配送</div>
              <div className={styles.info}>
                <div>城市归属：</div>
                {reqgetOrderDetail.data.receiverCityName}
              </div>
              <div className={styles.info}>
                <div>生产站点：</div>
              </div>
              <div className={styles.info}>
                <div>生产人员：</div>
              </div>
              <div className={styles.info}>
                <div>生产时间：</div>
              </div>
              <div className={styles.info}>
                <div>配送方式：</div>
              </div>
              <div className={styles.info}>
                <div>配送商：</div>
              </div>
              <div className={styles.info}>
                <div>配送员：</div>
              </div>
              <div className={styles.info}>
                <div>配送时间：</div>
              </div>
            </div>
            <div className={styles.infoTwoBox}>
              <div className={styles.infoTitle}>付款信息</div>
              <div className={styles.info}>
                <div>实付金额(元)：</div>
                {reqgetOrderDetail.data.status == 10 ||
                reqgetOrderDetail.data.status == 20 ||
                reqgetOrderDetail.data.status == 30
                  ? `￥${toPrice(reqgetOrderDetail.data.payAmount)}`
                  : '-'}
              </div>
              <div className={styles.info}>
                <div>付款方式：</div>
                {reqgetOrderDetail.data.payTypeStr || '-'}
              </div>
              <div className={styles.info}>
                <div>付款时间：</div>
                {reqgetOrderDetail.data.payTime || '-'}
              </div>
              <div className={styles.info}>
                <div>支付流水号：</div>
                {reqgetOrderDetail.data.payNo || '-'}
              </div>
            </div>
            {/* <div className={styles.infoTwoBox}>
              <div className={styles.infoTitle}>其他信息</div>
              <div className={styles.info}>
                <div>是否开发票：</div>
              </div>
            </div> */}
          </div>
          <ProCard>
            <div className={styles.journalTitle}>DIY蛋糕基本信息</div>
            <div style={{ display: 'flex' }}>
              <div className={styles.infoLeft}>
                <div className={styles.imgDiv}>
                  <Image
                    className={styles.infoImg}
                    src={reqgetOrderDetail.data.memberOpusPicUrl}
                  ></Image>
                </div>
                <div className={styles.flexDiv}>
                  <div style={{ fontSize: 24, fontWeight: 'bold' }}>
                    {reqgetOrderDetail.data.memberOpusName}
                  </div>
                  <span className={styles.tag}>DIY</span>
                </div>
              </div>
              <div>
                <div className={styles.red}>
                  巧克力牌：
                  {reqgetOrderDetail.data.blessInfoList[0].chocolateCard || '-'}
                </div>
                <div className={styles.red}>
                  祝福贺卡：
                  {reqgetOrderDetail.data.blessInfoList[0].greetCard || '-'}
                </div>
              </div>
            </div>
          </ProCard>
          <ProCard>
            <div className={styles.journalTitle}>DIY蛋糕成分</div>
            <Table
              columns={columns}
              dataSource={state.goodsData}
              bordered={true}
              pagination={false}
            />
          </ProCard>
          <ProCard>
            <div className={styles.infoBottom}>
              <div>商品总价：</div>
              <span>￥{toPrice(reqgetOrderDetail.data.totalAmount)}</span>
            </div>
            <div className={styles.infoBottom}>
              <div>运费：</div>
              <span>￥{toPrice(reqgetOrderDetail.data.postAmount)}</span>
            </div>
            {/* <div className={styles.infoBottom}>
              <div>优惠：</div>
              <span>
              ￥
              {reqgetOrderDetail.data.promotionAmount}
              </span>
              <QuestionCircleOutlined className={styles.icon} />
            </div> */}
            <div className={styles.infoBottom}>
              <div>附加费：</div>
              <span>￥{toPrice(reqgetOrderDetail.data.additionalAmount)}</span>
            </div>
            <div className={styles.infoBottom}>
              <div>礼品卡/储值卡：</div>
              <span>￥{toPrice(reqgetOrderDetail.data.cardAmount)}</span>
            </div>
            <div className={styles.infoBottom}>
              <div>实付金额：</div>
              <span>
                {reqgetOrderDetail.data.status == 10 ||
                reqgetOrderDetail.data.status == 20 ||
                reqgetOrderDetail.data.status == 30
                  ? `￥${toPrice(reqgetOrderDetail.data.payAmount)}`
                  : '-'}
              </span>
            </div>
          </ProCard>
          <ProCard>
            <div className={styles.journalTitle}>订单日志</div>
            <div className={styles.journalList}>
              <div>时间</div>
              <div>事项</div>
              <div>详情</div>
            </div>
            {reqgetByOrderLog.data
              ? reqgetByOrderLog.data.map((item) => {
                  return (
                    <div className={styles.journalList} key={item.id}>
                      <div>{item.createdTime}</div>
                      <div>{item.event}</div>
                      <div>{item.eventDetail}</div>
                    </div>
                  );
                })
              : ''}
          </ProCard>
        </div>
      ) : (
        ''
      )}
    </ProCard>
  );
};

export default OrderDetail;
