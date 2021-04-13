/**
 * 商品管理
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
  Typography,
  Switch,
  Form,
  Input,
} from 'antd';
import Table, { RichTableColumnType } from '@/components/Table';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { get } from 'lodash';
import FilterForm, {
  FilterFormFieldType,
  ControlContextType,
} from '@/components/FilterForm';
import * as diyService from '@/services/diy';
import { useRequest, useModal } from '@/common/hooks';
import { ConnectRC, Link } from 'umi';

let DIYCategory: ConnectRC<any> = ({ history, match }) => {
  let themeId = match.params.themeId;
  let filterRef = useRef<ControlContextType>();
  let [{ tableProps, dataSource }, { query: showList }] = useRequest<any>({
    service: diyService.getThemeCategoryList,
    params: {
      themeId: themeId,
    },
    transform: (res: any) => {
      return {
        data: res.list,
        total: res.total,
      };
    },
  });
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
    onOk: () => {
      modalForm.validateFields().then((values: any) => {
        let modalState = modal.state;
        setModalStateOptions({ okButtonProps: { loading: true } });
        if (!modalState.dataItem) {
          diyService
            .addThemeCategory({
              themeId: themeId,
              name: values.name,
            })
            .then(() => {
              closeModal();
              showList(true);
              message.success('添加成功');
            })
            .finally(() => {
              setModalStateOptions({ okButtonProps: { loading: false } });
            });
        } else {
          diyService
            .updateThemeCategory({
              id: modalState.dataItem.id,
              name: values.name,
            })
            .then(() => {
              closeModal();
              showList(true);
              message.success('修改成功');
            })
            .finally(() => {
              setModalStateOptions({ okButtonProps: { loading: false } });
            });
        }
      });
    },
  });
  const onDeleteHandle = useCallback((record) => {
    Modal.confirm({
      title: '是否删除分类?',
      content: '删除后，会解绑分类下的商品',
      onOk: () => {
        diyService
          .deleteThemeCategory({
            id: record.id,
          })
          .then(() => {
            message.success('删除成功');
            showList(true);
          });
      },
    });
  }, []);
  const onUpdateHandle = useCallback((record, checked) => {
    diyService.updateThemeStatus({
      themeIds: [record.id],
      status: checked ? 1 : 0,
    });
  }, []);
  const onUpSort = useCallback(
    (record, index) => {
      let targetId = dataSource[index - 1].id;
      let moveId = record.id;
      diyService
        .updateThemeCategorySort({
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
        .updateThemeCategorySort({
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
        type: 'text',
        name: 'name',
        label: '分类名称',
        props: {
          placeholder: '请输入分类名称',
        },
      },
    ],
    [],
  );
  const columns = useMemo<RichTableColumnType<any>[]>(
    () => [
      {
        title: '分类名称',
        dataIndex: 'name',
      },
      {
        title: '商品数量',
        dataIndex: 'productCount',
      },
      {
        title: '用户侧展示顺序',
        dataIndex: 'sort',
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
        width: 200,
        render: (record: any) => {
          return (
            <Space>
              <a onClick={showModal.bind(null, '编辑分类', record)}>编辑</a>
              <a onClick={onDeleteHandle.bind(null, record)}>删除</a>
              <Link
                to={`/product/diy/theme/category/${themeId}/goods/${record.id}`}
              >
                商品管理
              </Link>
            </Space>
          );
        },
      },
    ],
    [
      showModal,
      onDeleteHandle,
      onUpdateHandle,
      themeId,
      dataSource,
      onUpSort,
      onDownSort,
    ],
  );

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
          <Button
            type="primary"
            onClick={() => {
              showModal('添加分类');
            }}
          >
            添加分类
          </Button>
        </FilterForm>
      </Card>
      <Card className="m-table-wrapper">
        <Table columns={columns} rowKey="id" {...tableProps}></Table>
      </Card>
      <Modal {...modal.props}>
        <Form
          form={modalForm}
          preserve={false}
          wrapperCol={{ span: 18 }}
          labelCol={{ span: 6 }}
        >
          <Form.Item
            label="分类名称"
            name="name"
            initialValue={get(modal.state.dataItem, 'name')}
            rules={[
              {
                required: true,
                message: '请输入分类名称！',
                whitespace: true,
              },
            ]}
          >
            <Input maxLength={50}></Input>
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
};

export default DIYCategory;
