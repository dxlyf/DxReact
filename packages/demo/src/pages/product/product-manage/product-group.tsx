/**
 * 商品分组
 * @author fanyonglong
 */
import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  Tabs,
  Button,
  Card,
  Space,
  message,
  Modal,
  Form,
  Input,
  FormProps,
} from 'antd';
import Table, { RichTableColumnType } from '@/components/Table';
import FilterForm, { FilterFormFieldType } from '@/components/FilterForm';
import * as productService from '@/services/product';
import { useRequest, useModal } from '@/common/hooks';
import { ConnectRC, Link } from 'umi';
import { get } from 'lodash';

const formLayoutProps: FormProps = {
  wrapperCol: {
    span: 18,
  },
  labelCol: {
    span: 6,
  },
};
let ProductGroup: ConnectRC<any> = ({ history }) => {
  let [currentStatus, setStatus] = useState<string>('-1');
  let [{ tableProps }, { query: showList }] = useRequest({
    service: productService.getProductGroupList,
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
        label: '分组名称',
        props: {
          placeholder: '请输入商品分组名称',
          maxLength: 50,
        },
      },
    ],
    [],
  );
  const onDelete = useCallback((id) => {
    Modal.confirm({
      title: '是否删除分组?',
      content: '删除后，商品会与分组解绑',
      onOk: () => {
        productService
          .deleteProductGroup({
            id: id,
          })
          .then(() => {
            message.success('删除成功');
            showList(true);
          });
      },
    });
  }, []);
  let [groupForm] = Form.useForm();
  let [
    groupModal,
    { show: showGroupModal, close: hideGroupModal, setStateOptions },
  ] = useModal({
    destroyOnClose: true,
    onOk: () => {
      groupForm.validateFields().then((formdata) => {
        setStateOptions({ confirmLoading: true });
        let dataItem = groupModal.state.dataItem;
        if (dataItem) {
          productService
            .updateProductGroup({
              id: dataItem.id,
              ...formdata,
            })
            .then(() => {
              message.success('修改成功');
              showList(true);
              hideGroupModal();
            })
            .finally(() => {
              setStateOptions({ confirmLoading: false });
            });
        } else {
          productService
            .addProductGroup(formdata)
            .then(() => {
              message.success('添加成功');
              showList(true);
              hideGroupModal();
            })
            .finally(() => {
              setStateOptions({ confirmLoading: false });
            });
        }
      });
    },
  });
  const columns = useMemo<any>(
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
      {
        title: '操作',
        width: 220,
        render: (record: any) => {
          return (
            <Space>
              <a onClick={showGroupModal.bind(null, '编辑分组', record)}>
                编辑
              </a>
              <a onClick={onDelete.bind(null, record.id)}>删除</a>
              <Link
                to={`/product/product-manage/group/manage/${
                  record.id
                }/${encodeURIComponent(record.name)}`}
              >
                商品管理
              </Link>
            </Space>
          );
        },
      },
    ],
    [onDelete, showGroupModal],
  );

  return (
    <Space direction="vertical" className="m-list-wrapper">
      <Card className="m-filter-wrapper">
        <FilterForm
          span={18}
          fields={fields}
          onQuery={showList}
          autoBind={true}
        >
          <Button type="primary" onClick={() => showGroupModal('添加分组')}>
            添加分组
          </Button>
        </FilterForm>
      </Card>
      <Card className="m-table-wrapper">
        <Table columns={columns} rowKey="id" {...tableProps}></Table>
      </Card>
      <Modal {...groupModal.props}>
        <Form
          name="groupModal"
          preserve={false}
          form={groupForm}
          {...formLayoutProps}
        >
          <Form.Item
            label="分组名称"
            name="name"
            initialValue={get(groupModal.state.dataItem, 'name')}
            rules={[
              { required: true, message: '请输入主题名称！', whitespace: true },
            ]}
          >
            <Input maxLength={50}></Input>
          </Form.Item>
          <Form.Item
            label="分组备注"
            name="remark"
            initialValue={get(groupModal.state.dataItem, 'remark')}
          >
            <Input maxLength={50}></Input>
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
};

export default ProductGroup;
