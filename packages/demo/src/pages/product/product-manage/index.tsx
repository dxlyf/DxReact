/**
 * 商品管理
 * @author fanyonglong
 */
import React, { useState, useCallback, useMemo, useRef } from 'react';
import { Tabs, Button, Card, Space, message, Modal } from 'antd';
import Table, { RichTableColumnType } from '@/components/Table';
import FilterForm, {
  FilterFormFieldType,
  ControlContextType,
} from '@/components/FilterForm';
import * as productService from '@/services/product';
import { useRequest, useTableSelection } from '@/common/hooks';
import { ConnectRC, Link } from 'umi';
import { ImageView } from '@/components/Image';
import { get } from 'lodash';
import { PRODUCT } from '@/common/constants';
import { render } from 'react-dom';

let ProductManage: ConnectRC<any> = ({ history }) => {
  let [
    { rowSelection, selectedRows },
    { clearAllSelection },
  ] = useTableSelection({ keep: true });
  let filterRef = useRef<ControlContextType>();
  let [currentStatus, setStatus] = useState<string>('-1');
  let [{ tableProps }, { query: showList }] = useRequest({
    service: productService.getProductList,
    transform: (res: any) => {
      return {
        data: res.list,
        total: res.total,
      };
    },
  });
  const fields = useMemo<FilterFormFieldType[]>(
    () => [
      {
        type: 'text',
        name: 'name',
        label: '商品信息',
        props: {
          placeholder: '请输入商品名称或商品编号',
          maxLength: 50,
        },
      },
    ],
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
                src={get(record.imageUrl.split(','), 0)}
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
      },
      {
        title: '操作',
        render: (record: any) => {
          return (
            <Space>
              <Link to={`/product/product-manage/list/edit/${record.id}`}>
                编辑
              </Link>
            </Space>
          );
        },
      },
    ],
    [],
  );
  const onStatusTabChange = useCallback((value) => {
    setStatus(value + '');
    filterRef.current?.form.setFieldsValue({
      status: Number(value),
    });
    filterRef.current?.query();
  }, []);
  const onPublishProduct = useCallback(() => {
    history.push('/product/product-manage/list/add');
  }, []);
  const updateProductStatus = useCallback(
    (status: number) => {
      if (selectedRows!.length <= 0) {
        message.warn('请先勾选商品！');
        return;
      }
      let typeName = status === 1 ? '上架' : '下架';
      Modal.confirm({
        title: '温馨提示',
        content: `是否确认${typeName}?`,
        onOk: () => {
          productService
            .batchStatus({
              ids: selectedRows?.map((d) => d.id),
              status: status,
            })
            .then(() => {
              message.success(`${typeName}成功`);
              clearAllSelection!();
              showList(true);
            });
        },
      });
    },
    [selectedRows, clearAllSelection, showList],
  );
  const onDeleteProduct = useCallback(() => {
    if (selectedRows!.length <= 0) {
      message.warn('请先勾选商品！');
      return;
    }
    Modal.confirm({
      title: '是否确认删除？',
      content: `删除商品，请谨慎操作`,
      onOk: () => {
        productService.batchDelete(selectedRows?.map((d) => d.id)).then(() => {
          message.success(`删除成功`);
          clearAllSelection!();
          showList(true);
        });
      },
    });
  }, [selectedRows, clearAllSelection, showList]);
  const onBatchRefreshProduct=useCallback(() => {
    console.log('selectedRows',selectedRows)
    if (selectedRows!.length <= 0) {
      message.warn('请先勾选商品！');
      return;
    }
    productService.batchRefreshProduct(selectedRows?.map((d) => d.id)).then(() => {
      message.success(`刷新成功`);
      clearAllSelection!();
      showList(true);
    });
  }, [selectedRows, clearAllSelection, showList]);
  return (
    <Space direction="vertical" className="m-list-wrapper">
      <Card className="m-filter-wrapper">
        <FilterForm
          ref={filterRef as any}
          fields={fields}
          searchProps={{span:16}}
          onQuery={showList}
          autoBind={true}
        >
          <Button type="primary" onClick={onPublishProduct}>
            发布商品
          </Button>
          <Button onClick={onDeleteProduct}>删除</Button>
          <Button onClick={onBatchRefreshProduct} type="primary">批量刷新商品</Button>
        </FilterForm>
      </Card>
      <Card className="m-table-wrapper">
        <Table
          rowSelection={rowSelection}
          columns={columns}
          rowKey="id"
          {...tableProps}
        ></Table>
      </Card>
    </Space>
  );
};

export default ProductManage;
