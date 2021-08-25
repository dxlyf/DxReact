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
import { getProductGroupList } from '@/services/product';
import { ImageView } from '@/components/Image';
import { useTableSelection } from '@/common/hooks';
import { PRODUCT } from '@/common/constants';
import { pick } from 'lodash';

export let GroupProductList: React.FC<any> = ({
  dataItem,
  onChange,
  ...restProps
}) => {
  let [
    { rowSelection, selectedRows },
    { clearAllSelection },
  ] = useTableSelection({
    keep: true,
    onAllChange: onChange,
    ...pick(restProps, 'selectedRows','getCheckboxProps'),
  });
  const [{ tableProps, dataSource }, { query: showList }] = useRequest({
    service: getProductGroupList,
    params: {},
    transform: (d) => {
      return {
        data: d.list,
        total: d.total,
      };
    },
  });
  const fields = useMemo<FilterFormFieldType[]>(
    () => [
      {
        type: 'text',
        name: 'name',
        label: '商品分组',
        props: {
          placeholder: '请输入商品分组名称',
          maxLength: 50,
        },
      },
    ],
    [],
  );
  const columns = useMemo<RichTableColumnType<any>[]>(
    () => [
      {
        title: '商品分组名称',
        dataIndex: 'name',
      },
      {
        title: '分组备注',
        dataIndex: 'remark',
      },
      {
        title: '商品数量',
        dataIndex: 'productNum',
      },
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
          selectedRowKeys: rowSelection?.selectedRowKeys,
        }}
      ></Table>
    </div>
  );
};
let GroupProductListModal: React.FC<any> = (props) => {
  let { dataItem, onOk, selectedRows: _selectedRows = [],listProps={} } = props;
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
    } else {
      setSelectedRows([..._selectedRows]);
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
      title=" 添加分组商品"
    >
      <GroupProductList
        dataItem={dataItem}
        onChange={onChangeHandle}
        selectedRows={selectedRows}
        {...listProps}
      ></GroupProductList>
    </Modal>
  );
};
export default GroupProductListModal;
