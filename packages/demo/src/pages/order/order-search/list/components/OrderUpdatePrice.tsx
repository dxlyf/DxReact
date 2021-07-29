import React, {
  useCallback,
  useMemo,
  useState,
  useEffect,
  useImperativeHandle,
} from 'react';
import { Form, InputNumber, Select, Table } from 'antd';
import * as orderService from '@/services/order';
import { useRequest, usePrevious } from 'ahooks';

const OrderUpdatePrice = React.memo(
  React.forwardRef((props: any, ref) => {
    let { dataItem } = props;

    let [dataSource, setDataSource] = useState([]);

    const [key, setKey] = useState(String(Date.now()));
    // const previd = usePrevious(dataItem.id);
    // console.log(
    //   '🚀 ~ file: OrderUpdatePrice.tsx ~ line 18 ~ React.forwardRef ~ previd',
    //   previd,
    // );

    let [form] = Form.useForm();

    const reqOrderFindItems = useRequest(orderService.getOrderFindItems, {
      manual: true,
      onSuccess(data: any) {
        setDataSource(
          data.orderItemList.map(
            ({
              id,
              productName,
              unitPrice,
              quantity,
              discountAmount,
              propertyStr,
            }) => {
              return {
                id,
                productName,
                price: Number((unitPrice * 0.01).toFixed(2)),
                num: quantity,
                discount: discountAmount,
                propertyStr,
              };
            },
          ),
        );
      },
    });

    useEffect(() => {
      if (dataItem.id) {
        reqOrderFindItems.run({
          id: dataItem.id,
        });
      }
    }, [dataItem.id]);
    let totalPrice = useMemo(() => {
      return dataSource.reduce(
        (price, r) => Number((price + r.price * r.num).toFixed(2)),
        0,
      );
    }, [dataSource]);
    let columns = useMemo(
      () => [
        {
          title: '商品',
          dataIndex: 'productName',
          render(value, { propertyStr }) {
            return (
              <>
                <p style={{ margin: 0 }}>{value}</p>
                <p style={{ margin: 0, color: '#999' }}>({propertyStr})</p>
              </>
            );
          },
        },
        {
          title: '单价(元)',
          dataIndex: 'price',
          render: (value, record: any) => {
            return (
              <Form.Item
                style={{ marginBottom: 0 }}
                // trigger="onBlur"
                // noStyle
                rules={[
                  {
                    required: true,
                    message: '请输入单价，并且大于0',
                    min: 0.01,
                    type: 'number',
                  },
                ]}
                initialValue={value}
                name={['order', record.id, 'price']}
              >
                <InputNumber disabled={dataItem.isEditPrice===false} precision={2}></InputNumber>
              </Form.Item>
            );
          },
        },
        {
          title: '数量',
          dataIndex: 'num',
        },
        {
          title: '优惠(元)',
          dataIndex: 'discount',
          render(value) {
            return Number(value * 0.01).toFixed(2);
          },
        },
        {
          title: '小计(元)',
          render(record: any) {
            return Number((record.price * record.num).toFixed(2));
          },
        },
        {
          title: '实付金额',
          render(_, _1, index: number) {
            if (index > 0) {
              return {
                props: {
                  rowSpan: 0,
                },
              };
            }
            return {
              children: totalPrice,
              props: {
                rowSpan: dataSource.length,
              },
            };
          },
        },
      ],
      [dataSource, totalPrice,dataItem],
    );
    useImperativeHandle(
      ref,
      () => ({
        form,
        submit: () => {
          return form.validateFields().then((values) => {
            let orderItemList = Object.entries(values.order).map(
              ([k, v]: any) => {
                return {
                  id: k,
                  unitPrice: v.price * 100,
                };
              },
            );
            return {
              orderId: dataItem.id,
              orderItemList,
            };
          });
        },
      }),
      [form, dataSource],
    );

    const onValuesChange = useCallback(
      (values, allValues) => {
        Object.keys(allValues.order).forEach((id) => {
          let newDataSource = dataSource.map((row) => {
            return {
              ...row,
              price: allValues.order[row.id].price,
            };
          });
          setDataSource(newDataSource);
        });
      },
      [dataSource],
    );
    return (
      <Form
        form={form}
        size="small"
        onValuesChange={onValuesChange}
        preserve={false}
      >
        <Table
          pagination={false}
          rowKey="id"
          columns={columns}
          dataSource={dataSource}
          size="middle"
        ></Table>
      </Form>
    );
  }),
);

export default OrderUpdatePrice;
