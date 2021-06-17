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
    let { propertyList, shopProductItemList, isCake } = props;

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

    let columns = useMemo<any[]>(() => {
      let arr = [
        {
          title: '规格图片',
          dataIndex: 'imageUrl',
          render(imageUrl: any, record: any) {
            return (
              <Form.Item
                initialValue={imageUrl}
                name={['skus', record.id + '', 'imageUrl']}
                valuePropName="fileList"
              >
                <UploadImage maxCount={1} disabled>
                  <span>上传</span>
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
                <InputNumber disabled min={0.01} precision={2}></InputNumber>
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
                <InputNumber disabled min={0.01} precision={2}></InputNumber>
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
      ];

      if (isCake === 1) {
        arr.push({
          title: '夹心模型',
          dataIndex: 'sandwichModelId',
          render: (value: any, record: any) => {
            return (
              <Form.Item
                initialValue={value}
                name={['skus', record.id + '', 'sandwichModelId']}
              >
                <DIYModelSelect></DIYModelSelect>
              </Form.Item>
            );
          },
        });
      } else {
        arr.push({
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
        });
      }

      return arr;
    }, [propertyColumn, isCake]);
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
