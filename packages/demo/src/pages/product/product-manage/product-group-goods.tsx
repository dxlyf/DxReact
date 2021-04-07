/**
 * 商品分组-商品管理
 * @author fanyonglong
 */
import React, { useCallback, useMemo, useState } from 'react';
import { Space, Card, Descriptions, Button, message } from 'antd';
import { ConnectProps, Link } from 'umi';
import FilterForm, { FilterFormFieldType } from '@/components/FilterForm';
import Table, { RichTableColumnType } from '@/components/Table';
import { useRequest } from '@/common/hooks';
import { ImageView } from '@/components/Image';
import * as productService from '@/services/product';
import GroupProductListModal from './components/GroupProductList'
import {get} from 'lodash'

let GoodsManage: React.FC<{} & ConnectProps<any>> = ({ match }) => {
  let groupId = match?.params.groupId;
  let groupName = decodeURIComponent(match?.params.name);
  const [{ tableProps }, { query: showList }] = useRequest({
    service: productService.getGroupRefProductList,
    transform: (d) => {
      return { data: d.list, total: d.total };
    },
    params: {
      groupId: groupId,
    },
  });
  const fields = useMemo<FilterFormFieldType[]>(
    () => [
      {
        label: '商品信息',
        type: 'text',
        name: 'name',
      },
    ],
    [],
  );
  const columns = useMemo<RichTableColumnType<any>[]>(
    () => [
      {
        title: '商品信息',
        render: (record) => {
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
        title: '操作',
        render: (record) => {
          return (
            <Link to={`/product/product-manage/list/edit/${record.id}`}>
              编辑
            </Link>
          );
        },
      },
    ],
    [],
  );
  let [productModalVisible, setProductModalVisible] = useState(false);
  const onComfirmGroupProduct = useCallback(
    (products: any[]) => {
      if (products.length <= 0) {
        return;
      }
      productService
        .addGroupProductList({
          groupId: groupId,
          shopProductIds: products.map((d) => d.id),
        })
        .then(() => {
          message.success('添加成功');
          showList(true);
        });
    },
    [groupId],
  );
  return (
    <Space className="m-edit-wrapper" direction="vertical">
      <Card>
        <Card title="基本信息" bordered={false} className="m-card">
          <Descriptions>
            <Descriptions.Item label="商品分组名称">
              {groupName}
            </Descriptions.Item>
          </Descriptions>
        </Card>
        <Card title="分组商品" bordered={false} className="m-card">
          <FilterForm fields={fields} onQuery={showList} autoBind>
            <Button
              type="primary"
              onClick={() => {
                setProductModalVisible(true);
              }}
            >
              添加商品
            </Button>
          </FilterForm>
          <Table {...tableProps} rowKey="id" columns={columns}></Table>
        </Card>
      </Card>
      <GroupProductListModal
        visible={productModalVisible}
        onOk={onComfirmGroupProduct}
        onCancel={() => {
          setProductModalVisible(false);
        }}
        dataItem={{ id: groupId, relType: 1 }}
      ></GroupProductListModal>
    </Space>
  );
};
export default GoodsManage;
