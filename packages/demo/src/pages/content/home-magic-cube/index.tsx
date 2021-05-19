/**
 * 首页魔方
 * @author fanyonglong
 */
import React, { useState, useCallback, useMemo, useRef } from 'react';
import { Tabs, Button, Card, Space, message, Modal } from 'antd';
import Table, { RichTableColumnType } from '@/components/Table';
import FilterForm, {
  FilterFormFieldType,
  ControlContextType,
} from '@/components/FilterForm';
import * as contentService from '@/services/content';
import { useRequest } from '@/common/hooks';
import { ConnectRC, Link } from 'umi';
import { ImageView } from '@/components/Image';
import { get } from 'lodash';
import { ADVERTISE_STATUS } from '@/common/constants/advertisement';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';

let HomeBanner: ConnectRC<any> = ({ history }) => {
  let [{ tableProps, dataSource }, { query: showList }] = useRequest<any>({
    service: contentService.getMagicCubeList,
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
        name: 'title',
        label: '标题',
        props: {
          placeholder: '请输入标题',
          maxLength: 50,
        },
      },
    ],
    [],
  );
  const onDeleteMagicCube = useCallback((record) => {
    Modal.confirm({
      title: '温馨提示',
      content: '确定要删除该魔方吗?',
      onOk: () => {
        contentService.deleteMagicCube({
            id: record.id,
          })
          .then(() => {
            message.success('删除成功!');
            showList(true);
          });
      },
    });
  }, []);
  const onUpdateStatusHandle = useCallback((record) => {
    let msg =
      record.status == 1 ? '确定要停用该魔方吗？' : '确定要启用该魔方吗？';
    let status = record.status == 1 ? 2 : 1;
    Modal.confirm({
      title: '温馨提示',
      content: msg,
      onOk: () => {
        contentService.updateMagicCubeStatus({
            id: record.id,
            status: status,
          })
          .then(() => {
            message.success('修改状态成功!');
            showList(true);
          });
      },
    });
  }, []);
  const columns = useMemo<RichTableColumnType<any>[]>(
    () => [
      {
        title: '名称',
        dataIndex: 'title',
      },
      {
        title: '更新时间',
        dataIndex: 'updatedTime',
      },
      {
        title: '操作',
        render: (record: any) => {
          return (
            <Space>
              <Link to={`/content/home-magic-cube/edit/${record.id}`}>
                编辑
              </Link>
              <a onClick={onDeleteMagicCube.bind(null,record)}>
                删除
              </a>
              <a onClick={onUpdateStatusHandle.bind(null, record)}>{record.status===1?'停用':'启用'}</a>
            </Space>
          );
        },
      },
    ],
    [dataSource,onUpdateStatusHandle,onDeleteMagicCube],
  );

  return (
    <Space direction="vertical" className="m-list-wrapper">
      <Card className="m-filter-wrapper">
        <FilterForm fields={fields} onQuery={showList} autoBind={true}>
          <Button
            type="primary"
            onClick={() => {
              history.push('/content/home-magic-cube/add');
            }}
          >
            新增魔方
          </Button>
        </FilterForm>
      </Card>
      <Card className="m-table-wrapper">
        <Table columns={columns} rowKey="id" {...tableProps}></Table>
      </Card>
    </Space>
  );
};

export default HomeBanner;
