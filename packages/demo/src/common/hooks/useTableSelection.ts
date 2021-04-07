/**
 * antd table行选中
 * @author fanyonglong
 */
import React, { useCallback, useMemo } from 'react';
import { useControllableValue } from 'ahooks';
import { findIndex } from 'lodash';

interface TableSelectionType {
  [key: string]: any;
  rowKey?: string;
  defaultSelectedRows?: any[];
  selectedRows?: any[];
  onSelect?: (
    record: any,
    selected: boolean,
    selectedRows: any[],
    nativeEvent: any,
  ) => void;
  onChange?: (selectedRowKeys: any[], selectedRows: any[]) => void;
  onSelectAll?: (selected: any, selectedRows: any, changeRows: any) => void;
  onAllChange?: (selectedRows: any[]) => void;
  keep?: boolean;
}
export default function useTableSelection<T extends { [key: string]: any }>(
  options: TableSelectionType = {},
) {
  const {
    defaultSelectedRows = [],
    rowKey = 'id',
    onAllChange,
    onSelect,
    onChange,
    onSelectAll,
    keep = false,
    ...config
  } = options;
  const [selectedRows, setSelectedRows] = useControllableValue<T[]>(options, {
    defaultValuePropName: 'defaultSelectedRows',
    defaultValue: defaultSelectedRows,
    valuePropName: 'selectedRows',
  });
  // 记录所有选中行
  const selectDataRows = useCallback(
    (selected, rows) => {
      let newSelectedRows = [...(selectedRows as T[])];
      rows.forEach((record: T) => {
        let index = findIndex(
          newSelectedRows,
          (d) => d[rowKey] === record[rowKey],
        );
        if (selected && index === -1) {
          newSelectedRows.push({ ...record });
        } else if (!selected && index !== -1) {
          newSelectedRows.splice(index, 1);
        }
      });
      onAllChange && onAllChange(newSelectedRows);
      setSelectedRows(newSelectedRows);
    },
    [selectedRows, rowKey, onAllChange],
  );
  const onChangehandle = useCallback(
    (selectedRowKeys, selectedRows) => {
      setSelectedRows([...selectedRows]);
      onChange && onChange(selectedRowKeys, selectedRows);
    },
    [onChange],
  );
  const onSelecthandle = useCallback(
    (record, selected, selectedRows, nativeEvent) => {
      selectDataRows(selected, [record]);
      onSelect && onSelect(record, selected, selectedRows, nativeEvent);
    },
    [onSelect, selectDataRows],
  );
  const onSelectAllHandle = useCallback(
    (selected, selectedRows, changeRows) => {
      selectDataRows(selected, changeRows);
      onSelectAll && onSelectAll(selected, selectedRows, changeRows);
    },
    [onSelectAll, selectDataRows],
  );
  let rowSelection = useMemo(() => {
    if (!keep) {
      return {
        type: 'checkbox',
        selectedRowKeys: selectedRows?.map((d: any) => d[rowKey]) ?? [],
        onChange: onChangehandle,
        ...config,
      };
    } else {
      return {
        type: 'checkbox',
        selectedRowKeys: selectedRows?.map((d: any) => d[rowKey]) ?? [],
        onSelect: onSelecthandle,
        onSelectAll: onSelectAllHandle,
        ...config,
      };
    }
  }, [
    selectedRows,
    onSelecthandle,
    onSelectAllHandle,
    onChangehandle,
    keep,
    rowKey,
  ]);
  const clearAllSelection = useCallback(() => {
    setSelectedRows([]);
  }, []);
  return [
    { rowSelection, selectedRows },
    { clearAllSelection, setSelectedRows },
  ];
}
