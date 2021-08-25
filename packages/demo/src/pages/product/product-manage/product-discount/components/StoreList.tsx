/**
 * 店铺列表
 * @author fanyonglong
 */
 import React, {
    useCallback,
    useState,
    useEffect,
    forwardRef,
    useImperativeHandle,
    useMemo,
  } from 'react';
  import { Form, Radio, Badge, Table, Modal, Space } from 'antd';
  import { useModal, useRequest, useTableSelection } from '@/common/hooks';
  import FilterForm from '@/components/FilterForm';
  import { useUpdateEffect } from 'ahooks';
  import * as prudctDiscountService from '@/services/product-discount';
  import { pick } from 'lodash';
  
  export let StoreList = (props) => {
    let { onChange,...restProps } = props;
    let [{ tableProps, dataSource }, { query: showList }] = useRequest<any>({
      service: prudctDiscountService.getActivityStorePageByParam,
      params: {
        companyId:'2',
        typeList: [2],
      },
      transform: (res: any) => {
        return {
          data: res.list,
          total: res.total,
        };
      },
    });
    let [
      { rowSelection, selectedRows },
      { clearAllSelection },
    ] = useTableSelection({
      keep: true,
      onAllChange: useCallback(
        (rows) => {
          if (onChange) {
            onChange(rows);
          }
        },
        [onChange],
      ),
      ...pick(restProps, 'selectedRows','getCheckboxProps'),
    });
    let fields = useMemo(
      () => [
        {
          type: 'text',
          name: 'name',
          label: '微店名称',
          props: {
            maxLength: 50,
            placeholder: '请输入微店名称',
          },
        },
      ],
      [],
    );
    let columns = useMemo(
      () => [
        {
          title: '店铺名称',
          dataIndex: 'name',
        },
        {
          title: '总公司',
          dataIndex: 'topCompanyName',
        },
        {
          title: '子公司',
          dataIndex: 'companyName',
        },
        {
          title: '城市',
          dataIndex: 'cityName',
        },
        {
          title: '区域',
          dataIndex: 'regionName',
        },
        {
          title: '负责人信息',
          render(record) {
            return (
              <Space>
                <span>{record.managerName}</span>
                <span>{record.managerPhone}</span>
              </Space>
            );
          },
        },
      ],
      [],
    );

    return (
      <div>
        <FilterForm fields={fields} onQuery={showList} autoBind></FilterForm>
        <Table
          rowKey="id"
          {...tableProps}
          columns={columns}
          rowSelection={rowSelection}
        ></Table>
      </div>
    );
  };
  export const StoreListModal: React.FC<any> = (props) => {
    let {
      onChange,
      onCancel,
      visible,
      selectedRows: _selectedRows,
      listProps={}
    } = props;
    let [selectedRows, setSelectedRows] = useState<any[]>([]);
    let [modal] = useModal({
      destroyOnClose: true,
      width: '70%',
      visible: visible,
      okText:selectedRows.length > 0 ? `确定(${selectedRows.length})` : '确定',
      onCancel: onCancel,
      onOk: () => {
        if (onChange) {
          onChange([...selectedRows]);
        }
      },
    });
    useUpdateEffect(() => {
      if (!visible) {
        setSelectedRows([]);
      } else {
        setSelectedRows([..._selectedRows]);
      }
    }, [visible]);
    let onProductChange = useCallback((selectedRows) => {
      setSelectedRows([...selectedRows]);
    }, []);

    return (
      <Modal {...modal.props}>
        <StoreList
          onChange={onProductChange}
          selectedRows={selectedRows}
          {...listProps}
        ></StoreList>
      </Modal>
    );
  };
  