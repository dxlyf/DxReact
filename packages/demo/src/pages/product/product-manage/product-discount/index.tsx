/**
 * 商品折扣
 * @author fanyonglong
 */
import React, { useCallback, useMemo } from 'react';
import { Badge, Button, Card, Space, message, Modal } from 'antd';
import Table, { RichTableColumnType } from '@/components/Table';
import FilterForm, { FilterFormFieldType } from '@/components/FilterForm';
import * as prudctDiscountService from '@/services/product-discount';
import { useRequest } from '@/common/hooks';
import { ConnectRC, Link } from 'umi';
import { DISCOUNT_STATUS } from '@/common/constants/product-discount';

let ProductDiscount: ConnectRC<any> = ({ history }) => {
  let [{ tableProps, dataSource }, { query: showList }] = useRequest<any>({
    service: prudctDiscountService.getList,
    transform: (res: any) => {
      return {
        data: res.list,
        total: res.total,
      };
    },
  });

  const onUpdateStatusHandle = useCallback((record) => {
    Modal.confirm({
      title: '温馨提示',
      content: '确认结束该折扣吗？',
      onOk: () => {
        prudctDiscountService
          .updateStatus({
            id: record.id,
            status: 2, // 状态，0未开始,1已开始,2已停用
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
        name: 'name',
        label: '折扣名称',
        props: {
          placeholder: '请输入折扣名称',
          maxLength: 50,
        },
      },
      {
        type: 'list',
        name: 'status',
        label: '状态',
        data: DISCOUNT_STATUS.values,
      },
      {
        type: 'dateTimeRangePicker',
        name: ['discountStartTime', 'discountEndTime'],
        label: '时间',
      },
    ],
    [],
  );
  const columns = useMemo<RichTableColumnType<any>[]>(
    () => [
      {
        title: '折扣名称',
        dataIndex: 'name',
      },
      {
        title: '起止时间',
        render(record) {
          return (
            <Space>
              <span>{record.discountStartTime}</span>
              <span>~</span>
              <span>{record.discountEndTime}</span>
            </Space>
          );
        },
      },
      {
        title: '折扣微店',
        dataIndex: 'shopName',
        render(shopNames) {
          return shopNames.join(',');
        },
      },
      {
        title: '状态',
        dataIndex: 'statusDesc',
        render(text, record) {
          let color =
            record.status == 1
              ? 'green'
              : record.status == 2
              ? 'red'
              : 'yellow';
          return (
            <Badge
              text={DISCOUNT_STATUS.get(record.status)}
              color={color}
            ></Badge>
          );
        },
      },
      {
        title: '操作',
        render: (record: any) => {
          return (
            <Space>
              <Link to={`discount/view/${record.id}`}>查看</Link>
              <Button
                style={{ padding: 0 }}
                type="link"
                disabled={record.status == 2}
                onClick={() => {
                  history.push(`discount/edit/${record.id}`);
                }}
              >
                编辑
              </Button>
              <Button
                style={{ padding: 0 }}
                type="link"
                disabled={record.status == 2}
                onClick={onUpdateStatusHandle.bind(null, record)}
              >
                使结束
              </Button>
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
              history.push('discount/add');
            }}
          >
            新增折扣
          </Button>
        </FilterForm>
      </Card>
      <Card className="m-table-wrapper">
        <Table columns={columns} rowKey="id" {...tableProps}></Table>
      </Card>
    </Space>
  );
};

export default ProductDiscount;
