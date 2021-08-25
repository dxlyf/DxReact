/**
 * 商品分组-商品管理
 * @author fanyonglong
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Space,
  Card,
  Descriptions,
  Button,
  message,
  Modal,
  Form,
  Select,
} from 'antd';
import { ConnectProps, Link } from 'umi';
import FilterForm, { FilterFormFieldType } from '@/components/FilterForm';
import Table, { RichTableColumnType } from '@/components/Table';
import { useRequest, useModal, useTableSelection } from '@/common/hooks';
import { ImageView } from '@/components/Image';
import * as diyService from '@/services/diy';
import { get } from 'lodash';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import GroupProductListModal from './components/GroupProductList';
import ProductListModal from './components/ProductList';

let GoodsManage: React.FC<{} & ConnectProps<any>> = ({ match }) => {
  let themeId = match?.params.themeId;
  let categoryId = match?.params.categoryId;
  let pid = match?.params.pid;
  let [
    { rowSelection, selectedRows },
    { clearAllSelection },
  ] = useTableSelection({ keep: true });
  const [{ tableProps, dataSource }, { query: showList }] = useRequest<any>({
    service: diyService.getCategoryProductList,
    transform: (d) => {
      return { data: d.list, total: d.total };
    },
    params: {
      diyCategoryId: categoryId,
    },
  });
  let [categoryGroup, setCategoryGroup] = useState<any>([]);
  let [modalForm] = Form.useForm();
  let [
    modal,
    {
      show: showModal,
      close: closeModal,
      setStateOptions: setModalStateOptions,
    },
  ] = useModal({
    destroyOnClose: true,
    okText: selectedRows.length > 0 ? `确定(${selectedRows.length})` : '确定',
    onOk: () => {
      modalForm.validateFields().then((values: any) => {
        let dataItem = modal.state.dataItem;
        setModalStateOptions({ okButtonProps: { loading: true } });
        diyService
          .updateProductCategory({
            ids: selectedRows.map((d) => d.id),
            diyCategoryId: values.diyCategoryId,
          })
          .then(() => {
            closeModal();
            clearAllSelection();
            showList(true);
            message.success('添加成功');
          })
          .finally(() => {
            setModalStateOptions({ okButtonProps: { loading: false } });
          });
      });
    },
  });

  const onDelete = useCallback((id) => {
    Modal.confirm({
      title: '是否解绑商品？',
      content: '删除后，不会删除基础商品',
      onOk: () => {
        diyService
          .deleteCategoryProductRef({
            id: id,
          })
          .then(() => {
            message.success('删除成功');
            showList(true);
          });
      },
    });
  }, []);
  const onUpSort = useCallback(
    (record, index) => {
      let targetId = dataSource[index - 1].id;
      let moveId = record.id;
      diyService
        .updateThemeCategoryGoodSort({
          coverI: moveId,
          coverII: targetId,
        })
        .then(() => {
          showList(true);
        });
    },
    [dataSource],
  );
  const onDownSort = useCallback(
    (record, index) => {
      let targetId = dataSource[index + 1].id;
      let moveId = record.id;
      diyService
        .updateThemeCategoryGoodSort({
          coverI: moveId,
          coverII: targetId,
        })
        .then(() => {
          showList(true);
        });
    },
    [dataSource],
  );
  const fields = useMemo<FilterFormFieldType[]>(
    () => [
      {
        label: '商品信息',
        type: 'text',
        name: 'productName',
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
        render: (record) => {
          return (
            <Space>
              <ImageView
                width={60}
                height={40}
                src={get(record.productImageUrl.split(','), 0)}
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
        title: '商品分组',
        dataIndex: 'groupName',
      },
      {
        title: '模型预览',
        dataIndex: 'modelImageUrl',
        render(url) {
          return url ? (
            <ImageView
              width={60}
              height={40}
              src={url}
              srcSuffix="?imageView2/1/w/60/h/40"
            ></ImageView>
          ) : (
            '无预览图，请及时编辑商品DIY配置信息，否则将在用户侧隐藏'
          );
        },
      },
      {
        name: '排序',
        width: 160,
        align: 'center',
        render(value: number, record: any, index: number) {
          return (
            <Space>
              <ArrowUpOutlined
                onClick={onUpSort.bind(null, record, index)}
                style={{
                  color: '#1890ff',
                  cursor: 'pointer',
                  visibility: index == 0 ? 'hidden' : 'visible',
                }}
              ></ArrowUpOutlined>
              <ArrowDownOutlined
                onClick={onDownSort.bind(null, record, index)}
                style={{
                  color: '#1890ff',
                  cursor: 'pointer',
                  visibility:
                    index + 1 >= dataSource.length ? 'hidden' : 'visible',
                }}
              ></ArrowDownOutlined>
            </Space>
          );
        },
      },
      {
        title: '操作',
        width: 80,
        render: (record) => {
          return <a onClick={onDelete.bind(null, record.id)}>解绑</a>;
        },
      },
    ],
    [onDelete, dataSource, onDownSort, onUpSort],
  );
  const [productModalVisible, setProductModalVisible] = useState(false);
  const [groupProductModalVisible, setGroupProductModalVisible] = useState(
    false,
  );
  const onComfirmProduct = useCallback((rows) => {
    if (rows.length <= 0) {
      setProductModalVisible(false);
      return;
    }

    diyService
      .addCategoryProductRef({
        diyCategoryId: categoryId,
        shopProductIds: rows.map((d: any) => d.id),
      })
      .then(() => {
        message.success('添加商品成功！');
        setProductModalVisible(false);
        showList(true);
      });
  }, []);
  const onComfirmGroupProduct = useCallback((rows) => {
    if (rows.length <= 0) {
      setProductModalVisible(false);
      return;
    }

    diyService
      .addCategoryGroupProductRef({
        categoryId: categoryId,
        groupIds: rows.map((d: any) => d.id),
      })
      .then(() => {
        message.success('添加分组商品成功！');
        setGroupProductModalVisible(false);
        showList(true);
      });
  }, []);
  const onShowAddGroup = useCallback(() => {
    if (selectedRows!.length <= 0) {
      message.warn('请先勾选商品！');
      return;
    }
    showModal('商品添加到');
  }, [showModal, selectedRows]);
  useEffect(() => {
    diyService.getCategoryByPid({ pid: pid }).then((d) => {
      setCategoryGroup(d);
    });
  }, []);
  return (
    <Space className="m-edit-wrapper" direction="vertical">
      <Card title="基本信息" bordered={false} className="m-card">
        <FilterForm
          fields={fields}
          onQuery={showList}
          autoBind
          searchProps={{ span: 24 }}
        >
          <Button
            type="primary"
            onClick={() => {
              setProductModalVisible(true);
            }}
          >
            添加商品
          </Button>
          <Button
            type="primary"
            onClick={() => {
              setGroupProductModalVisible(true);
            }}
          >
            添加分组商品
          </Button>
          <Button type="primary" onClick={onShowAddGroup}>
            添加到
          </Button>
        </FilterForm>
      </Card>
      <Card title="分组商品" bordered={false} className="m-card">
        <Table
          {...tableProps}
          rowSelection={rowSelection}
          rowKey="id"
          columns={columns}
        ></Table>
      </Card>
      <ProductListModal
        dataItem={{ id: categoryId, relType: 2 }}
        visible={productModalVisible}
        onOk={onComfirmProduct}
        onCancel={() => {
          setProductModalVisible(false);
        }}
      ></ProductListModal>
      <GroupProductListModal
        visible={groupProductModalVisible}
        onOk={onComfirmGroupProduct}
        onCancel={() => {
          setGroupProductModalVisible(false);
        }}
      ></GroupProductListModal>
      <Modal {...modal.props}>
        <Form
          form={modalForm}
          preserve={false}
          wrapperCol={{ span: 18 }}
          labelCol={{ span: 6 }}
        >
          <Form.Item
            label="组名称"
            name="diyCategoryId"
            rules={[
              {
                required: true,
                message: '请选择组',
              },
            ]}
          >
            <Select>
              {categoryGroup.map((d) => (
                <Select.Option
                  disabled={d.id == categoryId}
                  key={d.id}
                  value={d.id}
                >
                  {d.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
};
export default GoodsManage;
