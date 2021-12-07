/**
 * 有赞广告banner
 * @author fanyonglong
 */
import React, { useCallback, useMemo } from 'react';
import {
  Badge,
  Button,
  Card,
  Space,
  message,
  Modal,
  Tooltip,
  Typography,
} from 'antd';
import Table, { RichTableColumnType } from '@/components/Table';
import FilterForm, { FilterFormFieldType } from '@/components/FilterForm';
import * as avsertiseService from '@/services/advertisement';
import { useRequest } from '@/common/hooks';
import { ConnectRC, Link } from 'umi';
import { ImageView } from '@/components/Image';
import { get } from 'lodash';
import { ADVERTISE_TYPE } from '@/common/constants/advertisement';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';

let YouZanBanner: ConnectRC<any> = ({ history }) => {
  let [{ tableProps, dataSource }, { query: showList }] = useRequest<any>({
    service: (params = {}) => {
      return avsertiseService.getAdvertisementList({
        ...params,
        adviceType: ADVERTISE_TYPE.enums.value2.value,
      });
    },
    transform: (res: any) => {
      return {
        data: res.list,
        total: res.total,
      };
    },
  });

  const onUpdateStatusHandle = useCallback((record) => {
    let msg =
      record.status == 1 ? '确定要停用该广告吗？' : '确定要启用该广告吗？';
    let status = record.status == 1 ? 2 : 1;
    Modal.confirm({
      title: '温馨提示',
      content: msg,
      onOk: () => {
        avsertiseService
          .updateStatus({
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
  const fields = useMemo<FilterFormFieldType[]>(
    () => [
      {
        type: 'text',
        name: 'adviceName',
        label: '广告名称',
        props: {
          placeholder: '请输入名称',
          maxLength: 50,
        },
      },
      {
        type: 'list',
        name: 'status',
        label: '状态',
        initialValue: -1,
        data: [
          { text: '全部', value: -1 },
          { text: '启用中', value: 1 },
          { text: '已停用', value: 2 },
        ],
      },
    ],
    [],
  );
  const columns = useMemo<RichTableColumnType<any>[]>(
    () => [
      {
        title: '广告名称',
        dataIndex: 'adviceName',
      },
      {
        title: '广告图片',
        dataIndex: 'advicePic',
        width: 150,
        render(text, record: any) {
          return (
            <Space>
              <ImageView
                width={60}
                height={40}
                src={get(record.advicePic.split(','), 0)}
                srcSuffix="?imageView2/1/w/60/h/40"
              ></ImageView>
            </Space>
          );
        },
      },
      {
        title: '状态',
        dataIndex: 'statusDesc',
        width: 120,
        render(text, record) {
          return (
            <Badge
              text={text}
              color={record.status == 1 ? 'green' : 'red'}
            ></Badge>
          );
        },
      },
      {
        title: '更新时间',
        dataIndex: 'updatedTime',
        width: 180,
      },
      {
        title: '备注',
        dataIndex: 'remark',
        width: 480,
        render(text) {
          return (
            <Tooltip title={text}>
              <Typography.Paragraph
                style={{ width: 480 }}
                ellipsis={{
                  rows: 2,
                  expandable: false,
                }}
              >
                {text}
              </Typography.Paragraph>
            </Tooltip>
          );
        },
      },
      {
        title: '操作',
        width: 120,
        render: (record: any) => {
          return (
            <Space>
              <Link to={`/content/advertisement/youzan/edit/${record.id}`}>
                编辑
              </Link>
              <a onClick={onUpdateStatusHandle.bind(null, record)}>
                {record.status == 1 ? '停用' : '启用'}
              </a>
            </Space>
          );
        },
      },
    ],
    [dataSource, onUpdateStatusHandle],
  );

  return (
    <Space direction="vertical" className="m-list-wrapper">
      <Card className="m-filter-wrapper">
        <FilterForm fields={fields} onQuery={showList} autoBind={true}>
          <Button
            type="primary"
            onClick={() => {
              history.push('/content/advertisement/youzan/add');
            }}
          >
            新增广告
          </Button>
        </FilterForm>
      </Card>
      <Card className="m-table-wrapper">
        <Table
          columns={columns}
          rowKey="id"
          tableLayout="fixed"
          {...tableProps}
        ></Table>
      </Card>
    </Space>
  );
};

export default YouZanBanner;
