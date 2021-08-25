/**
 * 商品分组-添加商品-商品列表
 * @author fanyonglong
 */
import React, { useCallback, useMemo, useState } from 'react';
import { Modal, Space } from 'antd';
import { useControllableValue } from 'ahooks';
import FilterForm, { FilterFormFieldType } from '@/components/FilterForm';
import Table, { RichTableColumnType } from '@/components/Table';
import useRequest from '@/common/hooks/useRequest';
import { getDIYModelList } from '@/services/product';
import { ImageView } from '@/components/Image';

export let DIYModelList: React.FC<any> = ({ dataItem, onChange }) => {
  const [{ tableProps, dataSource }, { query: showList }] = useRequest({
    service: getDIYModelList,
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
        label: '模型名称',
        props: {
          placeholder: '请输入模型名称',
          maxLength: 50,
        },
      },
      {
        type: 'modelGroup',
        name: ['topModelGroupId', 'modelGroupId'],
        label: '模型分组',
      },
    ],
    [],
  );
  const columns = useMemo<RichTableColumnType<any>[]>(
    () => [
      {
        title: '模型名称',
        dataIndex: 'name',
      },
      {
        title: '模型分组',
        render: (record) => {
          return record.modelGroupNameStr
        },
      },
      {
        title: '模型预览图',
        dataIndex: 'productidInfo',
        render(text: any, record: any) {
          return (
            <ImageView
              preview={true}
              width={60}
              height={40}
              src={record.imageUrl}
              srcSuffix="?imageView2/1/w/60/h/40"
            ></ImageView>
          );
        },
      },
      {
        title: '操作',
        width: 100,
        render: (record: any) => {
          return (
            <a
              onClick={() => {
                onChange(record);
              }}
            >
              选择
            </a>
          );
        },
      },
    ],
    [onChange],
  );
  return (
    <div>
      <FilterForm fields={fields} autoBind onQuery={showList}></FilterForm>
      <Table
        scroll={{ y: 'calc(100vh - 500px)' }}
        rowKey="id"
        columns={columns}
        {...tableProps}
      ></Table>
    </div>
  );
};
let DIYModelListModal: React.FC<any> = (props) => {
  let { dataItem, onOk } = props;
  let [visible, setVisible] = useControllableValue(props, {
    defaultValue: false,
    defaultValuePropName: 'defaultVisible',
    valuePropName: 'visible',
    trigger: 'onCancel',
  });
  const onCancelHandle = useCallback(() => {
    setVisible(false);
  }, []);
  const onChangeHandle = useCallback((record: any[]) => {
    onOk(record);
    onCancelHandle();
  }, []);

  return (
    <Modal
      width="70%"
      destroyOnClose
      visible={visible}
      footer={null}
      onCancel={onCancelHandle}
      title="模型列表"
    >
      <DIYModelList
        dataItem={dataItem}
        onChange={onChangeHandle}
      ></DIYModelList>
    </Modal>
  );
};
export default DIYModelListModal;
