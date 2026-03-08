import React, { ReactNode } from 'react';
import classNames from 'classnames';
import './style/index.scss';

export interface ColumnProps {
  title: ReactNode;
  dataIndex: string;
  key?: string;
  width?: string | number;
  render?: (text: any, record: any, index: number) => ReactNode;
  sorter?: boolean | ((a: any, b: any) => number);
  filters?: Array<{ text: string; value: string }>;
  onFilter?: (value: string, record: any) => boolean;
}

export interface ColumnGroupProps {
  title: ReactNode;
  children?: ReactNode;
}

export interface TableProps extends React.HTMLAttributes<HTMLDivElement> {
  dataSource?: any[];
  columns?: ColumnProps[];
  rowKey?: string | ((record: any) => string | number);
  loading?: boolean;
  pagination?: boolean | any;
  className?: string;
  children?: ReactNode;
}

export const Column: React.FC<ColumnProps> = () => {
  return null;
};

export const ColumnGroup: React.FC<ColumnGroupProps> = () => {
  return null;
};

export const Table: React.FC<TableProps> = ({
  dataSource = [],
  columns = [],
  rowKey = 'key',
  loading = false,
  pagination = true,
  className,
  children,
  ...props
}) => {
  // 处理 rowKey
  const getRowKey = (record: any, index: number) => {
    if (typeof rowKey === 'function') {
      return rowKey(record);
    }
    return record[rowKey] || index;
  };

  // 处理 columns，优先使用 children 中的 Column 组件
  const finalColumns = children ? React.Children.toArray(children).filter(child => (child as any).type === Column) as ColumnProps[] : columns;

  const tableClass = classNames('lyf-table', {
    'lyf-table-loading': loading,
  }, className);

  return (
    <div className={tableClass} {...props}>
      <table className="lyf-table-table">
        <thead className="lyf-table-thead">
          <tr>
            {finalColumns.map((column, index) => (
              <th
                key={column.key || column.dataIndex || index}
                className="lyf-table-th"
                style={{ width: column.width }}
              >
                {column.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="lyf-table-tbody">
          {dataSource.map((record, index) => (
            <tr
              key={getRowKey(record, index)}
              className="lyf-table-tr"
            >
              {finalColumns.map((column, colIndex) => (
                <td
                  key={column.key || column.dataIndex || colIndex}
                  className="lyf-table-td"
                >
                  {column.render ? column.render(record[column.dataIndex], record, index) : record[column.dataIndex]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {loading && (
        <div className="lyf-table-loading-overlay">
          <span className="lyf-table-loading-spinner">Loading...</span>
        </div>
      )}
    </div>
  );
};

Table.Column = Column;
Table.ColumnGroup = ColumnGroup;

export default Table;
