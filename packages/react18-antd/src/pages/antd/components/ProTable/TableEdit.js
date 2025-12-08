

import React, { useCallback, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Button, Col, Form, Input, Popover, Row, Space, Table,InputNumber } from 'antd'
import useMemoizedFn from '../../hooks/useMemoizedFn'
import GenericFormItem,{formItemEnum} from '../GenericFormItem'
import {MAX_DECIMAL_NUMBER, MAX_INTEGER_COUNT, ProFormItem} from '../ProForm'
import styles from './index.module.css'
const tableRowKey = 'table_rowIndex'
const dataIndexFlat = (dataIndex) => {
    return Array.isArray(dataIndex) ? dataIndex.join('_') : dataIndex
}
const getNamePath = (dataIndex) => {
    if (dataIndex === undefined || dataIndex === null) {
        return []
    }
    if (Array.isArray(dataIndex)) {
        return dataIndex
    }
    return [dataIndex]
}

const useTableEdit = (props) => {
    const { name, alwarysEdit, rowSelection, dataSource: propDataSurce, onTableChange, columns, onChange, renderHeader, renderFooter, ...restProps } = props;
    const [innerDataSource, setInnerDataSource] = useState([])
    const [editRowKeys, setEditRowKeys] = useState([])
    const [selectedRows, setSelectedRows] = useState([])
    const isController = propDataSurce !== undefined
    const dataSource = isController ? propDataSurce : innerDataSource
    const prefixName = useMemo(() => {
        return getNamePath(name)
    }, [name])
    const getRowId = useCallback((record) => {
        return record[tableRowKey]
    }, [])
    const isEditing = useCallback((record) => {
        return alwarysEdit ? alwarysEdit : editRowKeys.includes(getRowId(record))
    }, [getRowId, editRowKeys, alwarysEdit])

    const defaultRenderFormItem = useCallback((editInfo) => {
        let { editable,valueType,formItemProps, fieldProps } = editInfo
        let _formItemProps={
            ...formItemProps
        }
        let _fieldProps={
            size:'small',
            required:editable.required,
            ...fieldProps
        }
        if(valueType!==formItemEnum.UPLOAD_FILE_LIST){
            if(!_fieldProps.style){
                _fieldProps.style={}
            }
            if(!_fieldProps.style.width){
                _fieldProps.style.width='100%'
            }
        }
        if(valueType==='integer'){
            valueType=formItemEnum.INPUT_NUMBER
             _fieldProps={
                min:0,
                max:MAX_INTEGER_COUNT,
                precision:0,
                ..._fieldProps
            }

        }
        if(valueType==='decimal'){
             valueType=formItemEnum.INPUT_NUMBER
             _fieldProps={
                min:0,
                max:MAX_DECIMAL_NUMBER,
                precision:2,
                ..._fieldProps
             }
        }
        return <GenericFormItem name={editInfo.name}  label={editable.label} showLabel={editable.showLabel} component={ProFormItem}  type={valueType} {..._formItemProps} config={_fieldProps}></GenericFormItem>
    }, [])
 
    const transformColumn = useCallback((col, parentCol) => {
        const { render, editable,valueType, formItemProps = {}, fieldProps = {}, renderFormItem, dataIndex, ...restCol } = col
        if (editable) {
            let finalEditable={
                required:true,
                showLabel:false,
                label:col.title
            }
            if(typeof editable==='object'&&editable!==null){
                Object.assign(finalEditable,editable)
            }
            return {
                ...restCol,
                dataIndex,
                render: (text, record, index) => {
                    const editing = isEditing(record)
                    if (editing) {
                        const rowKey = getRowId(record)
                        const editInfo = {
                            col,
                            parentCol,
                            valueType,
                            index,
                            record,
                            rowKey,
                            editable:finalEditable,
                            dataIndex: dataIndex,
                            name: prefixName.length>0?[...prefixName, rowKey, ...getNamePath(dataIndex)]:getNamePath(dataIndex)
                        }
                        const _fieldProps = typeof fieldProps === 'function' ? fieldProps(editInfo) : fieldProps
                        const {dependencies,shouldUpdate,..._formItemProps} = typeof formItemProps === 'function' ? formItemProps(editInfo) : formItemProps
                        editInfo.fieldProps = _fieldProps
                        editInfo.formItemProps = _formItemProps
                        let dom;
                        if (renderFormItem) {
                            dom= renderFormItem(editInfo)
                        }else{
                            dom= defaultRenderFormItem(editInfo)
                        }
                       
                        if(shouldUpdate){
                            return <Form.Item noStyle shouldUpdate={shouldUpdate}>{()=>dom}</Form.Item>
                        }
                        if(dependencies){
                             return <Form.Item noStyle dependencies={dependencies}>{()=>dom}</Form.Item>
                        }
                        return dom
                    }
                    return render ? render(text, record, index) : text
                }
            }
        }
        if (col.children && Array.isArray(col.children)) {
            col.children = col.children.map(childCol => transformColumn(childCol, col))
        }
        return col
    }, [isEditing, getRowId, prefixName, defaultRenderFormItem])
    const mergeColumns = useMemo(() => {
        return (Array.isArray(columns) ? columns.filter(d=>d.hidden!==false).map((col, index) => {
            return transformColumn(col)
        }) : [])
    }, [columns, transformColumn])
    const mergeDataSource = useMemo(() => {
        return dataSource ? dataSource.map((record, index) => {
            return {
                [tableRowKey]: index,
                ...record
            }
        }) : []
    }, [dataSource])
    const setMergeDataSource = useMemoizedFn((data) => {
        const pureData = typeof data === 'function' ? data(mergeDataSource) : data.map(record => {
            const newRecord = {}
            Object.keys(record).forEach((key) => {
                if (key !== tableRowKey) {
                    newRecord[key] = record[key]
                }
            })
            return newRecord
        })
        if (!isController) {
            setInnerDataSource(pureData)
        }
        onChange?.(pureData);
    })
    const selectedRowKeys = useMemo(() => selectedRows.map(d => getRowId(d)), [selectedRows, getRowId])
    const tableProps = {
        ...restProps,
        pagination: false,
        rowSelection: rowSelection !== undefined&&rowSelection!==false ? {
            selectedRowKeys: selectedRowKeys,
            onChange: (selectedRowKeys, selectedRows) => {
                setSelectedRows(selectedRows)
            },
            ...rowSelection,
        } : rowSelection,
        rowKey: tableRowKey,
        dataSource: mergeDataSource,
        columns: mergeColumns,
        onChange: onTableChange
    }
    const editableInstance = useMemo(() => ({
        removeRowKeys: (keys) => {
            const newData = mergeDataSource.filter(d => !keys.includes(getRowId(d)))
            setMergeDataSource(newData)
        },
        removeRows: (records) => {
            const keys = records.map(d => getRowId(d))
            const newData = mergeDataSource.filter(d => !keys.includes(getRowId(d)))
            setMergeDataSource(newData)
        },
        removeRow: (record) => {
            const newData = mergeDataSource.filter(d => getRowId(d) !== getRowId(record))
            setMergeDataSource(newData)
        },
        insertRow: (record, index) => {
            const newData = [...mergeDataSource]
            if (typeof index === 'number') {
                newData.splice(index, record)
            } else {
                newData.push(record)
            }
            setMergeDataSource(newData)
        },
        mergeDataSource,
        dataSource,
        editRowKeys,
        selectedRowKeys,
        selectedRows,
        setSelectedRows,
        setEditRowKeys,
        setDataSource: setMergeDataSource
    }), [mergeDataSource, setInnerDataSource, dataSource, editRowKeys, setEditRowKeys, selectedRowKeys, selectedRows, setSelectedRows])

    return [tableProps, editableInstance]
}



const TableEdit = (props) => {
    const {title,children, disabled, newAddBtnText = '', name, ...restTableProps } = props
    const [tableProps, editableInstance] = useTableEdit({
        name,
        size: 'small',
        alwarysEdit: true,
        rowSelection: disabled?false:{
            hideSelectAll:disabled
        },
        ...restTableProps,
    })
    const handleBatchDelete = () => {
        editableInstance.removeRowKeys(editableInstance.selectedRowKeys)
        editableInstance.setSelectedRows([])
    }
    const handleAdd = () => {
        editableInstance.insertRow({})
        editableInstance.setEditRowKeys([editableInstance.dataSource.length])
    }
    const selectedRowKeys = editableInstance.selectedRowKeys
    // const selectedRows=editableInstance.selectedRows
    const actionDom = (disabled ? null : <Space>
        <Button type="primary" danger size="small" onClick={handleBatchDelete} disabled={!selectedRowKeys.length}>
            刪除{selectedRowKeys.length ? ` ${selectedRowKeys.length} 條數據` : ''}
        </Button>
        <Button type="primary" size="small" onClick={handleAdd}>新增{newAddBtnText}</Button>
    </Space>)

    const tableDom = <Table scroll={{x:'max-content'}} className={styles.tableEdit} {...tableProps}></Table>
    return <>
        {typeof children === 'function' ? children({
            instance: editableInstance,
            tableDom,
            actionDom
        }) : <>
             <Row justify={'space-between'} style={{marginBottom:8}}>
                <Col flex='none'>
                <span>{title}</span>
                </Col>
                <Col flex='none'>{actionDom}</Col>
             </Row>
            {tableDom}
        </>}
    </>
}
TableEdit.Summary=Table.Summary
export {
    useTableEdit,
    TableEdit
}
