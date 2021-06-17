/**
 * 商品分组-添加商品-商品列表
 * @author fanyonglong
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, Space } from 'antd';
import { useControllableValue, useUpdateEffect } from 'ahooks';
import FilterForm, { FilterFormFieldType } from '@/components/FilterForm';
import Table, { RichTableColumnType } from '@/components/Table';
import useRequest from '@/common/hooks/useRequest';
import { getGroupProductList } from '@/services/product';
import { ImageView } from '@/components/Image';
import { useTableSelection } from '@/common/hooks';
import { PRODUCT } from '@/common/constants';

export let ProductList: React.FC<any> = ({ dataItem, onChange }) => {
  let [
    { rowSelection, selectedRows },
    { clearAllSelection },
  ] = useTableSelection({
    keep: true,
    onAllChange: onChange,
    getCheckboxProps(record: any) {
      return {
        disabled: !!record.isOptional,
      };
    },
  });
  const [{ tableProps, dataSource }, { query: showList }] = useRequest({
    service: getGroupProductList,
    params: {
      relId: dataItem.id, // 关联分组ID
      relType: dataItem.relType, //商品关联类型 1.商品分组 2.diy分组
    },
    transform: (d) => {
      return {
        data: d.list,
        total: d.total,
      };
    },
  });
  const alreaySelected = useMemo(
    () => dataSource.filter((d: any) => !!d.isOptional).map((d: any) => d.id),
    [dataSource],
  );
  const fields = useMemo<FilterFormFieldType[]>(
    () => [
      {
        type: 'text',
        name: 'name',
        label: '商品信息',
        props: {
          placeholder: '请输入商口名称或商品编号',
          maxLength: 50,
        },
      }],
    [],
  );
  const columns = useMemo<RichTableColumnType<any>[]>(
    () => [
      {
        title: '商品信息',
        dataIndex: 'productidInfo',
        render(text, record: any) {
          return (
            <Space>
              <ImageView
                width={60}
                height={40}
                src={(record.imageUrl+'').split(',')[0]}
                srcSuffix="?imageView2/1/w/60/h/40"
              ></ImageView>
              <Space direction="vertical" align="start">
                <div>{record.productName}</div>
              </Space>
            </Space>
          );
        },
      },
      {
        title: '商品编号',
        dataIndex: 'productNo',
      },
      {
        title: '商品类型',
        dataIndex: 'type',
        render(type) {
          return PRODUCT.PRODUCT_TYPES.get(type, 'text');
        },
      },
      {
        title: '状态',
        dataIndex: 'status',
        render(value: number) {
          return PRODUCT.PRODUCT_STATUS.get(value, 'text');
        },
      },
      {
        title: '电商云商品分类',
        dataIndex: 'categoryName',
      }
    ],
    [],
  );
  return (
    <div>
      <FilterForm fields={fields} autoBind onQuery={showList}></FilterForm>
      <Table
        scroll={{ y: 'calc(100vh - 500px)' }}
        rowKey="id"
        columns={columns}
        {...tableProps}
        rowSelection={{
          ...rowSelection,
          selectedRowKeys: rowSelection?.selectedRowKeys.concat(alreaySelected),
        }}
      ></Table>
    </div>
  );
};
let ProductListModal: React.FC<any> = (props) => {
  let { dataItem, onOk } = props;
  let [selectedRows, setSelectedRows] = useState<any[]>([]);
  let [visible, setVisible] = useControllableValue(props, {
    defaultValue: false,
    defaultValuePropName: 'defaultVisible',
    valuePropName: 'visible',
    trigger: 'onCancel',
  });
  const onCancelHandle = useCallback(() => {
    setVisible(false);
  }, []);
  const onChangeHandle = useCallback((selectedRows: any[]) => {
    setSelectedRows([...selectedRows]);
  }, []);
  const onOkHandle = useCallback(() => {
    if (onOk) {
      onOk([...selectedRows]);
    }
  }, [onOk, selectedRows, onCancelHandle]);
  useUpdateEffect(() => {
    if (!visible) {
      setSelectedRows([]);
    }
  }, [visible]);
  let okText = `确认选择${
    selectedRows.length ? `(${selectedRows.length})` : ''
  }`;
  return (
    <Modal
      width="70%"
      destroyOnClose
      visible={visible}
      onCancel={onCancelHandle}
      onOk={onOkHandle}
      okText={okText}
      title=" 添加商品"
    >
      <ProductList dataItem={dataItem} onChange={onChangeHandle}></ProductList>
    </Modal>
  );
};
export default ProductListModal;
