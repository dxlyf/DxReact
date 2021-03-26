import React,{useCallback,useMemo} from 'react'
import {useControllableValue} from 'ahooks'
import {findIndex} from 'lodash'

interface TableSelectionType{
    [key:string]:any
    rowKey?:string
    defaultSelectedRows?:any[]
    selectedRows?:any[]
    onSelect?:(record:any, selected:boolean, selectedRows:any[], nativeEvent:any)=>void
    onChange?:(selectedRowKeys:any[], selectedRows:any[])=>void
    keep?:boolean

}
export default function useTableSelection<T extends {[key:string]:any}>(options: TableSelectionType = {}) {
    const {
        defaultSelectedRows = [],
        rowKey = 'id',
        onSelect,
        onChange,
        keep = false,
        ...config
    } = options;
    const [selectedRows, setSelectedRows] = useControllableValue(options, {
        defaultValuePropName: "defaultSelectedRows",
        defaultValue: defaultSelectedRows,
        valuePropName: "selectedRows"
    });
    // 记录所有选中行
    const selectDataRows = useCallback((selected, rows) => {
        let newSelectedRows = [...selectedRows as T[]]
        rows.forEach((record:T) => {
            let index = findIndex(newSelectedRows, d => d[rowKey] === record[rowKey])
            if (selected && index === -1) {
                newSelectedRows.push({ ...record })
            } else if (!selected && index !== -1) {
                newSelectedRows.splice(index, 1)
            }
        })
        setSelectedRows(newSelectedRows)
    }, [selectedRows, rowKey])
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
        [onSelect,selectDataRows],
    );
    let rowSelection=useMemo(()=>{
        if (!keep) {
            return {
                type: "checkbox",
                selectedRowKeys: selectedRows?.map((d: any) => d[rowKey]) ?? [],
                onChange: onChangehandle,
                ...config,
            };
        } else {
            return {
                type: "checkbox",
                selectedRowKeys: selectedRows?.map((d: any) => d[rowKey]) ?? [],
                onSelect: onSelecthandle,
                ...config,
            };
        } 
    },[selectedRows,onSelecthandle,onChangehandle,keep,rowKey])
    
    return [{ rowSelection, selectedRows }, { setSelectedRows }];
}
