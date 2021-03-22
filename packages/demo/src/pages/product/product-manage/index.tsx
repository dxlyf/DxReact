/**
 * 商品列表
 * @author fanyonglong
 */
import React, { useState, useCallback, useMemo, useRef } from 'react';
import { Tabs, Button } from 'antd';
import Table, { RichTableColumnType } from '@/components/Table';
import FilterForm, {
  FilterFormFieldType,
  ControlContextType,
} from '@/components/FilterForm';
import * as productService from '@/services/product';
import useRequest from '@/common/hooks/useRequest';
type ProductRecordDataType = {
  productName: string;
};

let ProductManage = () => {
  let filterRef = useRef<ControlContextType>();
  let [currentStatus, setStatus] = useState<string>('-1');
  let [{ tableProps }, { query: showList }] = useRequest({
    service: productService.getProductList,
    transform: (res) => {
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
        },
      },
      {
        type: 'list',
        name: 'name2',
        label: '商品归属',
        initialValue: -1,
        data: [
          { text: '全部', value: -1 },
          { text: '幸福送全国店', value: 1 },
          { text: '未分', value: 2 },
        ],
      },
      {
        type: 'list',
        name: 'name3',
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
        render(text, record) {
          return record.productName;
        },
      },
      {
        title: '商品归属',
        dataIndex: 'belong',
      },
      {
        title: '商品状态',
        dataIndex: 'statusName',
      },
      {
        title: '操作',
      },
    ],
    [],
  );
  const onStatusTabChange = useCallback((value) => {
    console.log('value', value);
    setStatus('' + value);
    filterRef.current?.form.setFieldsValue({
      name3: Number(value),
    });
  }, []);

  return (
    <div>
      <FilterForm
        ref={filterRef as any}
        span={18}
        fields={fields}
        onQuery={showList}
        autoBind={true}
      >
        <Button>上架</Button>
        <Button>下架</Button>
        <Button>删除</Button>
      </FilterForm>
      <Tabs activeKey={currentStatus} onChange={onStatusTabChange}>
        <Tabs.TabPane tab="全部" key="-1"></Tabs.TabPane>
        <Tabs.TabPane tab="已上架" key="1"></Tabs.TabPane>
        <Tabs.TabPane tab="已下架" key="2"></Tabs.TabPane>
      </Tabs>
      <Table bordered columns={columns} rowKey="id" {...tableProps}></Table>
    </div>
  );
};

export default ProductManage;
