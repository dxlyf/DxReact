/**
 * 首页广告banner
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
import { ADVERTISE_URL_TYPES } from '@/common/constants/advertisement';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';

let HomeBanner: ConnectRC<any> = ({ history }) => {
  let [{ tableProps, dataSource }, { query: showList }] = useRequest<any>({
    service: avsertiseService.getAdvertisementList,
    transform: (res: any) => {
      return {
        data: res.list,
        total: res.total,
      };
    },
  });
  const onUpSort = useCallback(
    (record, index) => {
      let targetId = dataSource[index - 1].id;
      let moveId = record.id;
      avsertiseService
        .updateSort({
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
      avsertiseService
        .updateSort({
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
      {
        type: 'text',
        name: 'adviceName',
        label: '广告名称',
        props: {
          placeholder: '请输入名称',
          maxLength: 50,
        },
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
        title: '广告类型',
        dataIndex: 'urlType',
        render(value: number) {
          return ADVERTISE_URL_TYPES.get(value, 'text');
        },
      },
      {
        title: '状态',
        dataIndex: 'statusDesc',
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
        title: '起止时间',
        render(record) {
          return (
            <Space>
              <span>{record.startTime}</span>
              <span>~</span>
              <span>{record.endTime}</span>
            </Space>
          );
        },
      },
      {
        title: '排序',
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
        width: 100,
        render: (record: any) => {
          return (
            <Space>
              <Link to={`/content/advertisement/home-banner/edit/${record.id}`}>
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
              history.push('/content/advertisement/home-banner/add');
            }}
          >
            新增广告
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
