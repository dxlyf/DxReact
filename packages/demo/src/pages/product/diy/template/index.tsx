/**
 * 模板管理
 * @author fanyonglong
 */
import React, { useState, useCallback, useMemo, useRef } from 'react';
import { Button, Card, Space, message, Modal, Badge } from 'antd';
import Table, { RichTableColumnType } from '@/components/Table';
import { get } from 'lodash';
import FilterForm, {
  FilterFormFieldType,
  ControlContextType,
} from '@/components/FilterForm';
import { ImageView } from '@/components/Image';
import * as diyService from '@/services/diy';
import { useRequest, useModal, useTableSelection } from '@/common/hooks';
import { ConnectRC, Link } from 'umi';
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  VerticalAlignTopOutlined,
} from '@ant-design/icons';

let UserOpus: ConnectRC<any> = (props) => {
  let { onSelectChange } = props;
  let [{ dataSource, tableProps }, { query: showList }] = useRequest<any>({
    service: (params: any) => {
      return diyService.getUserOpus(params).catch(() => {
        return {
          list: [],
          total: 0,
        };
      });
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
      (selectedRows) => {
        if (onSelectChange) {
          onSelectChange(selectedRows.map((d) => d.id));
        }
      },
      [onSelectChange],
    ),
  });
  const fields = useMemo(
    () => [
      {
        type: 'text',
        label: '作品名称',
        name: 'name',
        props: {
          maxLength: 50,
        },
      },
      {
        type: 'number',
        label: '手机号码',
        name: 'memberMobile',
        props: {
          maxLength: 11,
        },
      },
    ],
    [],
  );
  const columns = useMemo(
    () => [
      {
        title: '模板信息',
        dataIndex: 'name',
        render(text, record: any) {
          return (
            <Space>
              <ImageView
                width={60}
                height={40}
                src={record.picUrl}
                srcSuffix="?imageView2/1/w/60/h/40"
              ></ImageView>
              <Space direction="vertical" align="start">
                <div>{record.name}</div>
              </Space>
            </Space>
          );
        },
      },
      {
        title: '创作者',
        dataIndex: 'memberName',
      },
      {
        title: '手机号码',
        dataIndex: 'memberMobile',
      },
      {
        title: '主题',
        dataIndex: 'themeName',
      },
    ],
    [],
  );
  return (
    <div>
      <FilterForm
        span={24}
        fields={fields}
        onQuery={showList}
        autoBind={true}
      ></FilterForm>
      <Table
        columns={columns}
        rowSelection={rowSelection}
        rowKey="id"
        {...tableProps}
      ></Table>
    </div>
  );
};

let DIYTempalte: ConnectRC<any> = ({ history }) => {
  let filterRef = useRef<ControlContextType>();
  let [selectedUserOpusIds, setSelectedUserOpusIds] = useState([]);
  let [currentStatus, setStatus] = useState<string>('-1');
  let [{ dataSource, tableProps }, { query: showList }] = useRequest<any>({
    service: (params: any) => {
      return diyService.getTemplateList(params).catch(() => {
        return {
          list: [],
          total: 0,
        };
      });
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
  ] = useTableSelection({ keep: true });
  let [
    modal,
    {
      show: showModal,
      close: closeModal,
      setStateOptions: setModalStateOptions,
    },
  ] = useModal({
    width: '70vw',
    okText:
      selectedUserOpusIds.length > 0
        ? `确定(${selectedUserOpusIds.length})`
        : '确定',
    okButtonProps: {
      disabled: selectedUserOpusIds.length <= 0,
    },
    destroyOnClose: true,
    onOk: () => {
      setModalStateOptions({ confirmLoading: true });
      diyService
        .batchAddTemplate(selectedUserOpusIds)
        .then(() => {
          setSelectedUserOpusIds([]);
          closeModal();
          showList(true);
          message.success('添加成功');
        })
        .finally(() => {
          setModalStateOptions({ confirmLoading: false });
        });
    },
  });

  const onUpdateHandle = useCallback((record, checked) => {
    diyService
      .updateThemeStatus({
        themeIds: [record.id],
        status: checked ? 1 : 0,
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
        label: '模板名称',
        props: {
          placeholder: '请输入模板名称',
          maxLength: 50,
        },
      },
      {
        type: 'text',
        name: 'memberName',
        label: '作者',
        props: {
          maxLength: 50,
        },
      },
      {
        type: 'number',
        name: 'memberMobile',
        label: '手机',
        props: {
          maxLength: 11,
        },
      },
      {
        type: 'text',
        name: 'themeName',
        label: '主题',
        props: {
          maxLength: 50,
        },
      },
    ],
    [],
  );
  const onUpdateSort = useCallback(
    (record, index) => {
      let targetId = dataSource[index].id;
      let moveId = record.id;
      diyService
        .updateTemplateSort({
          coverI: moveId,
          coverII: targetId,
        })
        .then(() => {
          showList(true);
        });
    },
    [dataSource],
  );

  const onUpdateStatusHandle = useCallback((record) => {
    let msg =
      record.status == 1 ? '确定要停用该模板吗？' : '确定要启用该模板吗？';
    let status = record.status == 1 ? 2 : 1;
    Modal.confirm({
      title: '温馨提示',
      content: msg,
      onOk: () => {
        diyService
          .updateTempalteStatus({
            id: record.id,
            status: status,
          })
          .then(() => {
            message.success('修改状态成功');
            showList(true);
          });
      },
    });
  }, []);
  const deleteTemplate = useCallback(
    (deleteIds) => {
      Modal.confirm({
        title: '温馨提示',
        content: `确定从模板列表删除该作品吗？`,
        onOk: () => {
          diyService.deleteTempalte(deleteIds).then(() => {
            message.success(`删除成功`);
            clearAllSelection!();
            showList(true);
          });
        },
      });
    },
    [clearAllSelection, showList],
  );
  const onDeleteTemplate = useCallback(() => {
    if (selectedRows!.length <= 0) {
      message.warn('请先勾选模板！');
      return;
    }
    deleteTemplate(selectedRows.map((d) => d.id));
  }, [selectedRows, deleteTemplate]);
  const onDeleteHandle = useCallback(
    (record) => {
      deleteTemplate([record.id]);
    },
    [deleteTemplate],
  );
  const columns = useMemo<RichTableColumnType<any>[]>(
    () => [
      {
        title: '模板信息',
        dataIndex: 'name',
        render(text, record: any) {
          return (
            <Space>
              <ImageView
                width={60}
                height={40}
                src={record.picUrl}
                srcSuffix="?imageView2/1/w/60/h/40"
              ></ImageView>
              <Space direction="vertical" align="start">
                <div>{record.name}</div>
              </Space>
            </Space>
          );
        },
      },
      {
        title: '作者',
        dataIndex: 'memberName',
      },
      {
        title: '手机',
        dataIndex: 'memberMobile',
      },
      {
        title: '主题',
        dataIndex: 'themeName',
      },
      {
        title: '状态',
        render(record) {
          let text = record.status == 1 ? '启用' : '停用';
          return (
            <Badge
              text={text}
              color={record.status == 1 ? 'green' : 'red'}
            ></Badge>
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
                onClick={onUpdateSort.bind(null, record, index - 1)}
                style={{
                  color: '#1890ff',
                  cursor: 'pointer',
                  visibility: index == 0 ? 'hidden' : 'visible',
                }}
              ></ArrowUpOutlined>
              <ArrowDownOutlined
                onClick={onUpdateSort.bind(null, record, index + 1)}
                style={{
                  color: '#1890ff',
                  cursor: 'pointer',
                  visibility:
                    index + 1 >= dataSource.length ? 'hidden' : 'visible',
                }}
              ></ArrowDownOutlined>
              <VerticalAlignTopOutlined
                onClick={onUpdateSort.bind(null, record, 0)}
                style={{
                  color: '#1890ff',
                  cursor: 'pointer',
                  visibility: index == 0 ? 'hidden' : 'visible',
                }}
              ></VerticalAlignTopOutlined>
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
              <a onClick={onUpdateStatusHandle.bind(null, record)}>
                {record.status == 1 ? '停用' : '启用'}
              </a>
              <a
                onClick={() => {
                  history.push(`template/edit/${record.id}`);
                }}
              >
                编辑
              </a>
              <a onClick={onDeleteHandle.bind(null, record)}>删除</a>
            </Space>
          );
        },
      },
    ],
    [showModal, onDeleteHandle, onUpdateHandle, dataSource, onUpdateSort],
  );
  const onStatusTabChange = useCallback((value) => {
    setStatus(value + '');
    filterRef.current?.form.setFieldsValue({
      status: Number(value),
    });
    filterRef.current?.query();
  }, []);
  const onUserSelectChange = useCallback((ids) => {
    setSelectedUserOpusIds(ids);
  }, []);
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
              showModal('添加模板');
            }}
          >
            添加模板
          </Button>
          <Button onClick={onDeleteTemplate}>批量删除</Button>
        </FilterForm>
      </Card>
      <Card className="m-table-wrapper">
        <Table
          columns={columns}
          rowSelection={rowSelection}
          rowKey="id"
          {...tableProps}
        ></Table>
      </Card>
      <Modal {...modal.props}>
        <UserOpus onSelectChange={onUserSelectChange}></UserOpus>
      </Modal>
    </Space>
  );
};

export default DIYTempalte;
