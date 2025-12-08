import { Button,Checkbox,Dropdown } from "antd"
import {SettingOutlined} from '@ant-design/icons'
import React,{ useCallback, useEffect, useMemo, useState } from "react"
import styles from './index.module.css'
import localforage from 'localforage'
/**
 * type ColumnSettingProps={
   columns:ProColumnType[]
}
type UseColumnSettingProps={
    storageKey?:string
    stoarge:Storage
    columns:ProColumnType[]
}
 */
/**
 * 
 * @param {UseColumnSettingProps} props 
 * @returns 
 */
const useColumnSetting=(props)=>{
    const {storageKey:propStorageKey,stoarge=localStorage,columns:propColumns}=props
    const storageKey=propStorageKey!==undefined?'tb_col_'+propStorageKey:propStorageKey
    const [columnNames,setColumnNames]=useState(undefined)
    const [open,setOpen]=useState(false)
    const columns=useMemo(()=>{
        if(!storageKey||!columnNames){
            return propColumns
        }
        return propColumns.filter(d=>{
             if(typeof d.dataIndex==='string'){
                return columnNames.includes(d.dataIndex)
             }
             return true
        })
    },[columnNames,propColumns])

    const handleCheckedChange=useCallback((checkedValue)=>{
        setColumnNames(checkedValue)
        localforage.setItem(storageKey,JSON.stringify(checkedValue))
    },[storageKey])

    const columnOptions=useMemo(()=>{
        if(!storageKey){
            return []
        }
         return propColumns.filter((d)=>{
            return typeof d.title==='string'&&typeof d.dataIndex==='string'
         }).map((column)=>{
            return {
                label:column.title,
                value:column.dataIndex
            }
         })
    },[propColumns])
   const menu = useMemo(() => ({
        items: [{
            key: `setcolumn`,
            label: <Checkbox.Group className={styles.checkgroupBreak}  options={columnOptions} value={columnNames} onChange={handleCheckedChange} />
        }]
    }), [columnOptions, columnNames]);
    useEffect(()=>{
       if(storageKey){
            (async ()=>{
            const ret=await localforage.getItem(storageKey)
            if(ret){
                try{
                    setColumnNames(JSON.parse(ret))
                }catch{}
            }else if(propColumns.length){
                   handleCheckedChange(propColumns.filter(d=>typeof d.dataIndex==='string').map(d=>d.dataIndex)) 
            }
        })();
       }
    },[storageKey])
    const children=<Dropdown open={open} placement='bottom' menu={menu} trigger={['click']} onOpenChange={(flag,info)=>{
        if(info.source==='trigger'){
            setOpen(flag)
        }
    }} >
             <Button type={open?'primary':'default'} ghost={open} onClick={()=>{
                setOpen(!open)
            }} icon={<SettingOutlined></SettingOutlined>}></Button>
        </Dropdown>;
    return {
        columns,
        children,
    }
}


export {
    useColumnSetting
} 