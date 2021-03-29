/**
 * antd table 富应用
 * @author fanyonglong
 */
import React, { FC, useMemo } from 'react';
import type { TableProps, TableColumnType, TableColumnProps } from 'antd';
import { Table } from 'antd';

export interface RichTableProps<T> extends TableProps<T> {
  columns: RichTableColumnType<T>[];
}

export interface RichTableColumnType<T> extends TableColumnType<T> {}

const RichTable: FC<RichTableProps<any>> = ({
  columns,
  dataSource,
  ...restProps
}) => {
  return (
    <Table columns={columns} dataSource={dataSource} {...restProps}></Table>
  );
};

export default RichTable;
