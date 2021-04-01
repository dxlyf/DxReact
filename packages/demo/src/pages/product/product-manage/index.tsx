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
type ProductManage = {};
type ProductRecordDataType = {
  productName: string;
  product: any;
};

let ProductManage: ConnectRC<ProductManage> = ({ history }) => {
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
          placeholder: '请输入商口名称或商品编号',
          maxLength: 50,
        },
      },
      {
        type: 'shop',
        name: 'shopId',
        label: '商品归属',
        initialValue: -1,
        data: [
          { text: '全部', value: -1 },
          { text: '送全国店', value: 1 },
          { text: '未分', value: 2 },
        ],
      },
      {
        type: 'list',
        name: 'status',
        label: '商品状态',
        initialValue: -1,
        data: [
          { text: '全部', value: -1 },
          { text: '已上架', value: 1 },
          { text: '已下架', value: 2 },
        ],
        props: {
          onChange: (value: string) => {
            setStatus('' + value);
            filterRef.current?.query();
          },
        },
      },
    ],
    [],
  );
  const columns = useMemo<RichTableColumnType<ProductRecordDataType>[]>(
    () => [
      {
        title: '商品信息',
        dataIndex: 'productidInfo',
        render(text, record: any) {
          let firstImage = record.imageUrl.split(',')[0];
          return (
            <Space>
              <ImageView
                width={60}
                height={40}
                src={firstImage + '?imageView2/1/w/60/h/40'}
              ></ImageView>
              <Space direction="vertical" align="start">
                <div>{record.productName}</div>
                <div>{record.productNo}</div>
              </Space>
            </Space>
          );
        },
      },
      {
        title: '商品归属',
        dataIndex: 'shopName',
      },
      {
        title: '上架状态',
        dataIndex: 'status',
        render(value: number) {
          return value == 1 ? '上架' : value == 2 ? '下架' : '--';
        },
      },
      {
        title: '商品分类',
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
    history.push('/product/product-manage/list/edit');
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
              status: 2,
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
  return (
    <Space direction="vertical" className="m-list-wrapper">
      <Card className="m-filter-wrapper">
        <FilterForm
          ref={filterRef as any}
          span={18}
          fields={fields}
          onQuery={showList}
          autoBind={true}
        >
          <Button type="primary" onClick={onPublishProduct}>
            发布商品
          </Button>
          <Button onClick={() => updateProductStatus(1)}>上架</Button>
          <Button onClick={() => updateProductStatus(2)}>下架</Button>
          <Button onClick={onDeleteProduct}>删除</Button>
        </FilterForm>
      </Card>
      <Card className="m-table-wrapper">
        <Tabs activeKey={currentStatus} onChange={onStatusTabChange}>
          <Tabs.TabPane tab="全部" key="-1"></Tabs.TabPane>
          <Tabs.TabPane tab="已上架" key="1"></Tabs.TabPane>
          <Tabs.TabPane tab="已下架" key="2"></Tabs.TabPane>
        </Tabs>
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
