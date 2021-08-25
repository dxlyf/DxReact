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
import { get, flatMap, keyBy } from 'lodash';
import FilterForm, {
  FilterFormFieldType,
  ControlContextType,
} from '@/components/FilterForm';
import * as diyService from '@/services/diy';
import { useRequest, useModal } from '@/common/hooks';
import { ConnectRC, Link } from 'umi';
import cakeImg from '@/assets/images/cake.png';

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
  let dataSourceMap = useMemo(() => keyBy(dataSource, (d) => d.id), [
    dataSource,
  ]);
  let [modalForm] = Form.useForm();
  let [subModalForm] = Form.useForm();
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
        let dataItem = modal.state.dataItem;
        setModalStateOptions({ okButtonProps: { loading: true } });
        if (!dataItem.record) {
          diyService
            .addThemeCategory({
              pid: dataItem.pid,
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
              id: dataItem.record.id,
              name: values.name,
              pid: dataItem.record.pid,
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
    let isRoot = record.pid == '0';
    Modal.confirm({
      title: isRoot ? '是否删除分类?' : `确定删除【${record.name}】？`,
      content: isRoot
        ? '删除后，会解绑分类下的商品'
        : '删除分组，商品将移入【其他】分组中',
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
  const onUpdateSort = useCallback((moveId, targetId) => {
    diyService
      .updateThemeCategorySort({
        coverI: moveId,
        coverII: targetId,
      })
      .then(() => {
        showList(true);
      });
  }, []);
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
        render(name, record) {
          if (record.categoryType === 1) {
            return (
              <Space>
                <span>{name}</span>
                <img width={32} height={32} src={cakeImg} />
              </Space>
            );
          }
          return name;
        },
      },
      {
        title: '商品数量',
        dataIndex: 'productCount',
        render(value, record) {
          return record.pid == '0' ? '' : value + '';
        },
      },
      {
        title: '用户侧展示顺序',
        dataIndex: 'sort',
        width: 160,
        align: 'center',
        render(value: number, record: any, index: number) {
          let data =
            record.pid == '0'
              ? dataSource
              : dataSourceMap[record.pid].diyCategories;
          let isShowUp = index > 0;
          let isShowDown = index + 1 < data.length;
          if (record.pid !== '0' && record.categoryType == 2) {
            isShowUp = false;
            isShowDown = false;
          }
          if (isShowDown && data[index + 1].categoryType == 2) {
            isShowDown = false;
          }
          return (
            <Space>
              <ArrowUpOutlined
                onClick={() => {
                  onUpdateSort(record.id, data[index - 1].id);
                }}
                style={{
                  color: '#1890ff',
                  cursor: 'pointer',
                  visibility: !isShowUp ? 'hidden' : 'visible',
                }}
              ></ArrowUpOutlined>
              <ArrowDownOutlined
                onClick={() => {
                  onUpdateSort(record.id, data[index + 1].id);
                }}
                style={{
                  color: '#1890ff',
                  cursor: 'pointer',
                  visibility: !isShowDown ? 'hidden' : 'visible',
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
          let isRoot = record.pid == '0';
          if (isRoot) {
            return (
              <Space>
                <a
                  onClick={showModal.bind(null, '添加下级', {
                    pid: record.id,
                    label: '组名称',
                    message: '请输入组名称！',
                  })}
                >
                  添加下级
                </a>
                <a
                  onClick={showModal.bind(null, '编辑分类', {
                    record: record,
                    pid: 0,
                    label: '分类名称',
                    message: '请输入分类名称！',
                  })}
                >
                  编辑
                </a>
                {record.categoryType === 1 ? null : (
                  <a onClick={onDeleteHandle.bind(null, record)}>删除</a>
                )}
              </Space>
            );
          } else {
            return (
              <Space>
                {record.categoryType == 2 ? null : (
                  <a
                    onClick={showModal.bind(null, '编辑分组', {
                      record: record,
                      label: '组名称',
                      message: '请输入组名称！',
                    })}
                  >
                    编辑
                  </a>
                )}
                {record.categoryType == 2 ? null : (
                  <a onClick={onDeleteHandle.bind(null, record)}>删除</a>
                )}
                <Link
                  to={`/product/diy/theme/category/${themeId}/goods/${record.id}/${record.pid}`}
                >
                  商品管理
                </Link>
              </Space>
            );
          }
        },
      },
    ],
    [
      showModal,
      onDeleteHandle,
      onUpdateHandle,
      themeId,
      dataSource,
      dataSourceMap,
      onUpdateSort,
    ],
  );
  const expandable = {
    childrenColumnName: 'diyCategories',
  };
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
              showModal('添加分类', {
                pid: 0,
                label: '分类名称',
                message: '请输入分类名称！',
              });
            }}
          >
            添加分类
          </Button>
        </FilterForm>
      </Card>
      <Card className="m-table-wrapper">
        <Table
          columns={columns}
          rowKey="id"
          {...tableProps}
          expandable={expandable}
        ></Table>
      </Card>
      <Modal {...modal.props}>
        <Form
          form={modalForm}
          preserve={false}
          wrapperCol={{ span: 18 }}
          labelCol={{ span: 6 }}
        >
          <Form.Item
            label={get(modal.state.dataItem, 'label', '分类名称')}
            name="name"
            initialValue={get(modal.state.dataItem, 'record.name')}
            rules={[
              {
                required: true,
                message: get(modal.state.dataItem, 'message'),
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
