import React, {
  useCallback,
  useMemo,
  useState,
  useImperativeHandle,
} from 'react';
import { Form, InputNumber, Select, Table } from 'antd';
import { UploadImage, useUplaodImage } from '@/components/Upload/UploadImage';
import DIYModelSelect from './DIYModelSelect';
import styles from '../index.less';

const SKUTable = React.memo(
  React.forwardRef((props: any, ref) => {
    let { propertyList, shopProductItemList } = props;
    let [form] = Form.useForm();
    let [{ formItemProps }] = useUplaodImage({ message: '请上传图片' });
    let propertyColumn = useMemo(
      () =>
        propertyList.map((d: any) => ({
          title: d.name,
          render: (text: any, record: any) => {
            return (
              <div className={styles.skuTableColumn}>
                {
                  record.shopProductPropertyListFieldMap[d.fieldName]
                    .propertyValue
                }
              </div>
            );
          },
        })),
      [propertyList],
    );
    let columns = useMemo<any[]>(
      () => [
        {
          title: '规格图片',
          dataIndex: 'imageUrl',
          render(imageUrl: any, record: any) {
            return (
              <Form.Item
                initialValue={imageUrl}
                name={['skus', record.id + '', 'imageUrl']}
              >
                <UploadImage maxCount={1}>
                  <a>上传</a>
                </UploadImage>
              </Form.Item>
            );
          },
        },
        ...propertyColumn,
        {
          title: (
            <span>
              <i style={{ color: 'red' }}>*</i>建议零售价(元)
            </span>
          ),
          dataIndex: 'recommendedPrice',
          render: (value: any, record: any) => {
            return (
              <Form.Item
                initialValue={value}
                rules={[
                  {
                    required: true,
                    message: '请输入建议零售价',
                    type: 'number',
                  },
                ]}
                name={['skus', record.id + '', 'recommendedPrice']}
              >
                <InputNumber min={0} precision={2}></InputNumber>
              </Form.Item>
            );
          },
        },
        {
          title: (
            <span>
              <i style={{ color: 'red' }}>*</i>实际零售价(元)
            </span>
          ),
          dataIndex: 'price',
          render(value: any, record: any) {
            return (
              <Form.Item
                initialValue={value}
                rules={[
                  {
                    required: true,
                    message: '请输入实际零售价',
                    type: 'number',
                  },
                ]}
                name={['skus', record.id + '', 'price']}
              >
                <InputNumber min={0} precision={2}></InputNumber>
              </Form.Item>
            );
          },
        },
        {
          title: (
            <span>
              <i style={{ color: 'red' }}>*</i>库存
            </span>
          ),
          dataIndex: 'stockNum',
          render: (value: any, record: any) => {
            return (
              <Form.Item
                initialValue={value}
                rules={[
                  { required: true, message: '请输入库存', type: 'number' },
                ]}
                name={['skus', record.id + '', 'stockNum']}
              >
                <InputNumber max={9999} min={0}></InputNumber>
              </Form.Item>
            );
          },
        },
        {
          title: '规格编码',
          dataIndex: 'productItemNo',
          render: (text: any, record: any) => {
            return <div className={styles.skuTableColumn}>{text}</div>;
          },
        },
        {
          title: '是否启用',
          dataIndex: 'isEnable',
          width: 80,
          render: (value: any, record: any) => {
            return (
              <Form.Item
                name={['skus', record.id + '', 'isEnable']}
                initialValue={value}
              >
                <Select>
                  <Select.Option value={1} key={1}>
                    是
                  </Select.Option>
                  <Select.Option value={0} key={0}>
                    否
                  </Select.Option>
                </Select>
              </Form.Item>
            );
          },
        },
        {
          title: 'DIY规格模型',
          dataIndex: 'diyModelId',
          render: (value: any, record: any) => {
            return (
              <Form.Item
                initialValue={value}
                name={['skus', record.id + '', 'diyModelId']}
              >
                <DIYModelSelect></DIYModelSelect>
              </Form.Item>
            );
          },
        },
      ],
      [propertyColumn],
    );
    useImperativeHandle(
      ref,
      () => ({
        form,
        validateFields: () => {
          return form.validateFields();
        },
      }),
      [form],
    );
    return (
      <Form form={form} component={false} size="small">
        <Table
          pagination={false}
          rowKey="id"
          size="small"
          className={styles.skuTable}
          columns={columns}
          dataSource={shopProductItemList}
        ></Table>
      </Form>
    );
  }),
);

export default SKUTable;
