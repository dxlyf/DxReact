/**
 * 会员管理-会员列表
 * @author fanyonglong
 */
import React, { useState, useCallback, useMemo, useRef } from 'react';
import { Card, Space } from 'antd';
import Table, { RichTableColumnType } from '@/components/Table';
import { get } from 'lodash';
import FilterForm, { FilterFormFieldType } from '@/components/FilterForm';
import * as memberService from '@/services/member';
import { useRequest, useModal } from '@/common/hooks';
import { ConnectRC, Link } from 'umi';

let MemberList: ConnectRC<any> = ({ history, match, location }) => {
  let phone = location.query?.phone;
  let [{ tableProps }, { query: showList }] = useRequest({
    service: memberService.getMemberList,
    params: {
      channelId: 1104,
    },
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
        name: 'mobile',
        label: '手机号',
        initialValue: phone,
        props: {
          placeholder: '请输入手机号',
          maxLength: 11,
        },
      },
      {
        type: 'text',
        name: 'nickname',
        label: '会员昵称',
        props: {
          props: {
            placeholder: '请输入会员昵称',
            maxLength: 50,
          },
        },
      },
    ],
    [],
  );
  const columns = useMemo<RichTableColumnType<any>[]>(
    () => [
      {
        title: '会员',
        dataIndex: 'nickname',
      },
      {
        title: '手机号',
        dataIndex: 'mobile',
      },
      {
        title: '生日',
        dataIndex: 'birthday',
      },
      {
        title: '注册时间',
        dataIndex: 'createdTime',
      },
    ],
    [],
  );

  return (
    <Space direction="vertical" className="m-list-wrapper">
      <Card className="m-filter-wrapper">
        <FilterForm
          span={18}
          fields={fields}
          onQuery={showList}
          autoBind={true}
        ></FilterForm>
      </Card>
      <Card className="m-table-wrapper">
        <Table columns={columns} rowKey="id" {...tableProps}></Table>
      </Card>
    </Space>
  );
};

export default MemberList;
