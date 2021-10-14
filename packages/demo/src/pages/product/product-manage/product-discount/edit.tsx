/**
 * 折扣详情
 * @author fanyonglong
 */
import React, {
  useCallback,
  useState,
  useEffect,
  useReducer,
  useMemo,
} from 'react';
import {
  Form,
  Card,
  Space,
  Button,
  Input,
  message,
  Row,
  Col,
  Radio,
  Badge,
  DatePicker,
  InputNumber,
  Table,
  Modal,
} from 'antd';
import * as productDiscountService from '@/services/product-discount';
import { useModal, useRequest, useTableSelection } from '@/common/hooks';
import moment from 'moment';
import { StoreListModal } from './components/StoreList';
import GroupProductListModal from '@/pages/product/diy/components/GroupProductList';
import ProductListModal from '@/pages/product/diy/components/ProductList';
import { get } from 'lodash';
import { useUpdate } from 'ahooks';
import styles from './style.less';

const formLayout = {
  wrapperCol: {
    xxl: { span: 10 },
    xl: { span: 10 },
    lg: { span: 10 },
    md: { span: 10 },
  },
  labelCol: {
    xxl: { span: 3 },
    xl: { span: 3 },
    lg: { span: 5 },
    md: { span: 7 },
  },
};
const initialState = () => {
  return {
    shopIdList: [],
    products: [],
    productGroup: [],
    detail: null,
  };
};
const reducerHandle = (state, action) => {
  if (action.type === 'init') {
    return {
      ...state,
      ...action.payload,
    };
  }
  if (action.type === 'setShopIdList') {
    return {
      ...state,
      shopIdList: action.payload,
    };
  }
  if (action.type === 'setProduct') {
    return {
      ...state,
      products: action.payload,
    };
  }
  if (action.type === 'setProductGroup') {
    return {
      ...state,
      productGroup: action.payload,
    };
  }
  return state;
};

const DiscountEdit: React.FC<any> = (props) => {
  let id = props.match?.params.id;
  let isEdit = typeof id !== 'undefined';
  let [modelDetail, dispatch] = useReducer(reducerHandle, null, initialState);
  let [loading, setLoading] = useState(false);
  let [visibleStore, setVisibleStore] = useState(false);
  let [form] = Form.useForm();
  let forceUpdate = useUpdate();
  const onSubmitHandle = useCallback(
    (values: any) => {
      let submitdata = {
        id: id,
        name: values.name,
        discountStartTime: values.discountTime[0].format('YYYY-MM-DD HH:mm:ss'),
        discountEndTime: values.discountTime[1].format('YYYY-MM-DD HH:mm:ss'),
        discountNum: values.discountNum,
        shopRangeType: values.shopRangeType,
        shopIdList: modelDetail.shopIdList.map((d) => d.shopId),
        productRangeType: values.productRangeType,
        productIds: modelDetail.products.map((d) => d.shopProductId),
        groupIds: modelDetail.productGroup.map((d) => d.productGroupId),
        couponMutex: values.couponMutex,
      };
      let p: any;
      if (typeof id !== 'undefined') {
        setLoading(true);
        p = productDiscountService.update(submitdata);
      } else {
        setLoading(true);
        p = productDiscountService.add(submitdata);
      }
      p.then((d: any) => {
        setLoading(false);
        if (d.repeatFlag == true) {
          Modal.warning({
            title: '以下商品正在活动中，不能添加。需要移除后，才能保存!',
            content: (
              <>
                <table className={styles['goods-table']}>
                  <thead>
                    <tr>
                      <th>商品编码</th>
                      <th>商品名称</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.shopProductList.map((item, index) => (
                      <tr key={index}>
                        <td>{item.productNo}</td>
                        <td>{item.productName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            ),
          });
          return;
        }
        message.success('保存成功');
        props.history.push('/product/product-manage/discount');
      }).catch(() => {
        setLoading(false);
      });
    },
    [id, modelDetail],
  );

  let productColumns = React.useMemo(() => {
    let productRangeType = form.getFieldValue('productRangeType') || 0;
    if (productRangeType == 0) {
      return [
        {
          title: '序号',
          render(_, record, index) {
            return index + 1;
          },
        },
        {
          title: '商品信息',
          dataIndex: 'productName',
        },
        {
          title: '商品编码',
          dataIndex: 'productNo',
        },
      ];
    } else {
      return [
        {
          title: '序号',
          render(_, record, index) {
            return index + 1;
          },
        },
        {
          title: '商品组',
          dataIndex: 'name',
        },
      ];
    }
  }, [form.getFieldValue('productRangeType')]);
  let productSource = React.useMemo(() => {
    let productRangeType = form.getFieldValue('productRangeType') || 0;
    if (productRangeType == 0) {
      return modelDetail.products;
    } else {
      return modelDetail.productGroup;
    }
  }, [form.getFieldValue('productRangeType'), modelDetail]);

  const [productModalVisible, setProductModalVisible] = useState(false);
  const [groupProductModalVisible, setGroupProductModalVisible] = useState(
    false,
  );
  let disableStoreMap = useMemo(() => {
    return new Map(
      modelDetail.shopIdList
        .filter((d) => d.isNew !== true)
        .map((d) => [d.id, d]),
    );
  }, [modelDetail.shopIdList]);

  let disableProductMap = useMemo(() => {
    return new Map(
      modelDetail.products
        .filter((d) => d.isNew !== true)
        .map((d) => [d.id, d]),
    );
  }, [modelDetail.products]);
  let disableProductGroupMap = useMemo(() => {
    return new Map(
      modelDetail.productGroup
        .filter((d) => d.isNew !== true)
        .map((d) => [d.id, d]),
    );
  }, [modelDetail.productGroup]);

  const onStoreChange = useCallback(
    (rows) => {
      dispatch({
        type: 'setShopIdList',
        payload: rows.map((d) => ({
          ...d,
          shopId: d.id,
          isNew: !disableStoreMap.has(d.id),
        })),
      });
      form.validateFields(['shopRangeType']);
      setVisibleStore(false);
    },
    [disableStoreMap],
  );
  const onComfirmProduct = useCallback(
    (rows) => {
      dispatch({
        type: 'setProduct',
        payload: rows.map((d) => {
          return {
            ...d,
            shopProductId: d.id,
            productName: d.productName || d.name,
            isNew: !disableProductMap.has(d.id),
          };
        }),
      });
      setProductModalVisible(false);
      form.validateFields(['productRangeType']);
    },
    [disableProductMap],
  );
  const onComfirmGroupProduct = useCallback(
    (rows) => {
      dispatch({
        type: 'setProductGroup',
        payload: rows.map((d) => {
          return {
            ...d,
            productGroupId: d.id,
            isNew: !disableProductGroupMap.has(d.id),
          };
        }),
      });
      setGroupProductModalVisible(false);
      form.validateFields(['productRangeType']);
    },
    [disableProductGroupMap],
  );
  useEffect(() => {
    if (!id) {
      return;
    }
    productDiscountService
      .getDetail({
        id: id,
      })
      .then((d: any) => {
        form.setFieldsValue({
          name: d.name,
          discountTime: [
            moment(d.discountStartTime),
            moment(d.discountEndTime),
          ],
          discountNum: d.discountNum,
          shopRangeType: d.shopRangeType,
          productRangeType: d.productRangeType,
          couponMutex: d.couponMutex,
        });
        dispatch({
          type: 'init',
          payload: {
            detail: d,
            shopIdList: get(d, 'shopRefs', []).map((d) => ({
              ...d,
              orgId: d.id,
              id: d.shopId,
            })),
            products: get(d, 'productRefs', []).map((d) => ({
              ...d,
              orgId: d.id,
              id: d.shopProductId + '',
            })),
            productGroup: get(d, 'groupRefs', []).map((d) => ({
              ...d,
              orgId: d.id,
              id: d.productGroupId + '',
            })),
          },
        });
      });
  }, []);
  let isView = props.match.path == '/product/product-manage/discount/view/:id';
  let disabledControls: any = {
    name: isView || isEdit,
    discountTime: [isView || isEdit, isView],
    discountNum: isView || isEdit,
    shopRangeType: isView,
    allShop:
      isView || (isEdit ? form.getFieldValue('shopRangeType') == 1 : false),
    partialShop:
      isView || (isEdit ? form.getFieldValue('shopRangeType') == 0 : false),
    product:
      isView || (isEdit ? form.getFieldValue('productRangeType') == 1 : false),
    groupProduct:
      isView || (isEdit ? form.getFieldValue('productRangeType') == 0 : false),
    productRangeType: isView,
    couponMutex: isView || isEdit,
    save: isView,
  };

  return (
    <Card>
      <Form {...formLayout} form={form} onFinish={onSubmitHandle}>
        <Form.Item
          label="折扣名称"
          name="name"
          rules={[
            {
              required: true,
              message: '折扣名称不能为空！',
            },
          ]}
        >
          <Input disabled={disabledControls.name} maxLength={20} />
        </Form.Item>
        <Form.Item
          label="起止时间"
          name="discountTime"
          rules={[
            {
              required: true,
              message: '请选择时间',
            },
          ]}
        >
          <DatePicker.RangePicker
            disabled={disabledControls.discountTime}
            disabledDate={(current) =>
              current && current.isBefore(moment(), 'day')
            }
            format="YYYY-MM-DD HH:mm:ss"
            showTime={{
              format: 'HH:mm:ss',
              defaultValue: [
                moment('00:00:00', 'HH:mm:ss'),
                moment('23:59:59', 'HH:mm:ss'),
              ],
            }}
          ></DatePicker.RangePicker>
        </Form.Item>
        <Form.Item label="商品折扣" required>
          <Space>
            <span>商品打</span>
            <Form.Item
              noStyle
              name="discountNum"
              rules={[
                {
                  required: true,
                  type: 'number',
                  message: '请输入商品折扣',
                },
              ]}
            >
              <InputNumber
                precision={2}
                disabled={disabledControls.discountNum}
                min={0.01}
                max={9.99}
              ></InputNumber>
            </Form.Item>
            <span>折</span>
          </Space>
        </Form.Item>
        <Form.Item label="折扣店铺" required>
          <Form.Item
            noStyle
            name="shopRangeType"
            initialValue={0}
            rules={[
              {
                required: true,
                type: 'number',
                message: '请选择店铺',
              },
              {
                validator(rule, value) {
                  if (value == 1 && modelDetail.shopIdList.length < 1) {
                    return Promise.reject('请添加店铺');
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <Radio.Group
              disabled={disabledControls.shopRangeType}
              onChange={(e) => {
                forceUpdate();
              }}
            >
              <Radio.Button value={0} disabled={disabledControls.allShop}>
                全部店铺
              </Radio.Button>
              <Radio.Button
                disabled={disabledControls.partialShop}
                value={1}
                onClick={() => {
                  if (!visibleStore) {
                    setVisibleStore(true);
                  }
                }}
              >
                {(form.getFieldValue('shopRangeType') || 0) == 0 ? (
                  '部分店铺'
                ) : (
                  <Badge
                    offset={[15, -5]}
                    count={modelDetail.shopIdList.length}
                    showZero
                  >
                    部分店铺
                  </Badge>
                )}
              </Radio.Button>
            </Radio.Group>
          </Form.Item>
        </Form.Item>
        <Form.Item label="添加商品" required help="">
          <Form.Item
            name="productRangeType"
            initialValue={0}
            rules={[
              {
                required: true,
                type: 'number',
                message: '请选择商品或分组商品',
              },
              {
                validator(rule, value) {
                  if (value == 0 && modelDetail.products.length < 1) {
                    return Promise.reject('请添加商品');
                  }
                  if (value == 1 && modelDetail.productGroup.length < 1) {
                    return Promise.reject('请添加商品分组');
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <Radio.Group
              disabled={disabledControls.productRangeType}
              onChange={(e) => {
                forceUpdate();
              }}
            >
              <Radio.Button
                disabled={disabledControls.product}
                value={0}
                onClick={() => {
                  if (!productModalVisible) {
                    setProductModalVisible(true);
                  }
                }}
              >
                添加商品
              </Radio.Button>
              <Radio.Button
                disabled={disabledControls.groupProduct}
                value={1}
                onClick={() => {
                  if (!groupProductModalVisible) {
                    setGroupProductModalVisible(true);
                  }
                }}
              >
                添加分组商品
              </Radio.Button>
            </Radio.Group>
          </Form.Item>
          <div style={{ marginTop: 15, width: 600 }}>
            <Table
              rowKey="id"
              dataSource={productSource}
              columns={productColumns}
            ></Table>
          </div>
        </Form.Item>
        <Form.Item
          label="与优惠券互斥"
          name="couponMutex"
          initialValue={0}
          rules={[
            {
              required: true,
              type: 'number',
              message: '请选择是否与优惠券互斥',
            },
          ]}
        >
          <Radio.Group disabled={disabledControls.couponMutex}>
            <Radio.Button value={0}>不互斥</Radio.Button>
            <Radio.Button value={1}>互斥</Radio.Button>
          </Radio.Group>
        </Form.Item>
        <Form.Item colon={false} label={<span></span>}>
          <Space>
            <Button
              onClick={() => {
                props.history.push('/product/product-manage/discount');
              }}
            >
              取消
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              disabled={disabledControls.save}
            >
              保存
            </Button>
          </Space>
        </Form.Item>
      </Form>
      <StoreListModal
        onChange={onStoreChange}
        selectedRows={modelDetail.shopIdList}
        visible={visibleStore}
        onCancel={() => {
          setVisibleStore(false);
        }}
        listProps={{
          getCheckboxProps: (record) => {
            return {
              disabled: disableStoreMap.has(record.id),
            };
          },
        }}
      ></StoreListModal>
      <ProductListModal
        selectedRows={modelDetail.products}
        dataItem={{ id: undefined, relType: 3 }}
        listProps={{
          getCheckboxProps: (record) => {
            return {
              disabled: disableProductMap.has(record.id),
            };
          },
        }}
        visible={productModalVisible}
        onOk={onComfirmProduct}
        onCancel={() => {
          setProductModalVisible(false);
        }}
      ></ProductListModal>
      <GroupProductListModal
        visible={groupProductModalVisible}
        selectedRows={modelDetail.productGroup}
        onOk={onComfirmGroupProduct}
        onCancel={() => {
          setGroupProductModalVisible(false);
        }}
        listProps={{
          getCheckboxProps: (record) => {
            return {
              disabled: disableProductGroupMap.has(record.id),
            };
          },
        }}
      ></GroupProductListModal>
    </Card>
  );
};
export default DiscountEdit;
