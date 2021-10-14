/**
 * 订单评价
 * @author fanyonglong
 */
import React, { useCallback, useMemo, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  Space,
  message,
  Modal,
  Tooltip,
  Typography,
  Image,
} from 'antd';
import Table, { RichTableColumnType } from '@/components/Table';
import FilterForm, { FilterFormFieldType } from '@/components/FilterForm';
import * as evaluateService from '@/services/product-evaluate';
import { ImageGroupPreview } from '@/components/Image';
import { useRequest, useModal, useTableSelection } from '@/common/hooks';
import { ConnectRC, Link } from 'umi';

let OrderEvaluate: ConnectRC<any> = ({ history }) => {
  let [{ tableProps, dataSource }, { query: showList }] = useRequest<any>({
    service: evaluateService.getList,
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
  let [{ visible: visibleImage, images }, setViewImages] = useState({
    visible: false,
    images: [],
  });
  const updateStatusHandle = useCallback(
    (status, ids, isBatch = false) => {
      let content;
      switch (status) {
        case 0:
          content = isBatch ? '确定隐藏选中评价吗？' : '确定要隐藏该评论吗？';
          break;
        case 1:
          content = isBatch ? '确定展示选中评价吗？' : '确定要显示该评论吗？';
          break;
      }
      Modal.confirm({
        title: '温馨提示',
        content: content,
        onOk: () => {
          evaluateService
            .batchUpdateStatus({
              orderInfoReviewIds: ids,
              status: status, // 状态，0隐藏 1 显示
            })
            .then(() => {
              message.success('修改状态成功');
              showList(true);
              clearAllSelection();
            });
        },
      });
    },
    [showList, clearAllSelection],
  );
  const onBatchUpdateStatus = useCallback(
    (status) => {
      if (selectedRows.length <= 0) {
        message.warning(
          '请先选择需要批量' + (status == 0 ? '隐藏的项' : '显示的项'),
        );
        return;
      }
      updateStatusHandle(
        status,
        selectedRows.map((d) => d.id),
        true,
      );
    },
    [selectedRows],
  );
  const fields = useMemo<FilterFormFieldType[]>(
    () => [
      {
        type: 'text',
        name: 'buyerName',
        label: '用户昵称',
        props: {
          placeholder: '请输入用户昵称',
          maxLength: 50,
        },
      },
      {
        type: 'list',
        name: 'status',
        label: '状态',
        data: [
          { text: '显示', value: 1 },
          { text: '隐藏', value: 0 },
        ],
      },
      {
        type: 'dateTimeRangePicker',
        name: ['startCreatedTime', 'endCreatedTime'],
        label: '时间',
      },
    ],
    [],
  );
  const viewImages = useCallback(
    (images) => {
      if (images.length <= 0) {
        return;
      }
      setViewImages({ visible: true, images: images });
    },
    [setViewImages],
  );
  const columns = useMemo<RichTableColumnType<any>[]>(
    () => [
      {
        title: '用户昵称',
        dataIndex: 'buyerName',
        width: 140,
      },
      {
        title: '评分',
        width: 240,
        render(record) {
          return (
            <>
              <div>
                <Space>
                  <span>综合评分{record.score}星</span>
                  <span>口味评分{record.scoreTaste}星</span>
                </Space>
              </div>
              <div>
                <Space>
                  <span>包装评分{record.scorePack}星</span>
                  <span>物流评分{record.scoreFlow}星</span>
                </Space>
              </div>
            </>
          );
        },
      },
      {
        title: '文字评价',
        dataIndex: 'content',
        render(content) {
          return content == '' ? (
            '当前用户暂无评价'
          ) : (
            <Tooltip title={content}>
              <Typography.Paragraph
                ellipsis={{
                  rows: 3,
                  expandable: false,
                }}
              >
                {content}
              </Typography.Paragraph>
            </Tooltip>
          );
        },
      },
      {
        title: '图片评价',
        dataIndex: 'reviewPicUrl',
        width: 120,
        render(reviewPicUrl) {
          let images = reviewPicUrl.split(',').filter(Boolean);
          return (
            <Button type="link" onClick={viewImages.bind(null, images)}>
              查看图片({images.length})
            </Button>
          );
        },
      },
      {
        title: '状态',
        width: 100,
        render(record) {
          let color = record.status == 1 ? 'green' : 'red';
          let text = record.status == 1 ? '展示中' : '已隐藏';
          return <Badge text={text} color={color}></Badge>;
        },
      },
      {
        title: '评价时间',
        dataIndex: 'createdTime',
        width: 180,
      },
      {
        title: '操作',
        width: 80,
        render: (record: any) => {
          let status = record.status == 1 ? 0 : 1;
          return (
            <Space>
              <Button
                style={{ padding: 0 }}
                type="link"
                onClick={() => {
                  updateStatusHandle(status, [record.id]);
                }}
              >
                {status == 0 ? '隐藏' : '显示'}
              </Button>
            </Space>
          );
        },
      },
    ],
    [updateStatusHandle, viewImages],
  );

  return (
    <Space direction="vertical" className="m-list-wrapper">
      <Card className="m-filter-wrapper">
        <FilterForm fields={fields} onQuery={showList} autoBind={true}>
          <Button type="primary" onClick={onBatchUpdateStatus.bind(null, 1)}>
            批量显示
          </Button>
          <Button type="primary" onClick={onBatchUpdateStatus.bind(null, 0)}>
            批量隐藏
          </Button>
        </FilterForm>
      </Card>
      <Card className="m-table-wrapper">
        <Table
          tableLayout="fixed"
          columns={columns}
          rowKey="id"
          {...tableProps}
          rowSelection={rowSelection}
        ></Table>
      </Card>
      <ImageGroupPreview
        images={images}
        visible={visibleImage}
        onVisibleChange={(visible) => {
          if (!visible) {
            setViewImages({ visible: false, images: [] });
          }
        }}
      ></ImageGroupPreview>
    </Space>
  );
};

export default OrderEvaluate;
