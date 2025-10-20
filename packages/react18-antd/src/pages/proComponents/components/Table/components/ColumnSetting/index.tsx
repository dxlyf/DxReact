import { Button,Checkbox,Dropdown, Menu, Popover } from "antd"
import type { ProColumnType} from "@ant-design/pro-components"
import {SettingOutlined} from '@ant-design/icons'
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react"
import styles from './index.module.css'

type ColumnSettingProps={
   columns:ProColumnType[]
}
type UseColumnSettingProps={
    storageKey?:string
    strageType?:'local'|'session'
    stoarge:Storage
    columns:ProColumnType[]
}
const useStorage=()=>{
    
}
const useColumnSetting=(props:UseColumnSettingProps)=>{
    const {storageKey,stoarge=localStorage,columns:propColumns}=props
    const [columnNames,setColumnNames]=useState<string[]|undefined>(undefined)
    const [open,setOpen]=useState(false)
    const columns=useMemo(()=>{
        if(!storageKey){
            return propColumns
        }
        return propColumns.filter(d=>{
             if(columnNames&&typeof d.dataIndex==='string'){
                return columnNames.includes(d.dataIndex as string)
             }
             return true
        })
    },[columnNames,propColumns,storageKey])

    const handleCheckedChange=useCallback((checkedValue:string[])=>{
        setColumnNames(checkedValue)
        stoarge.setItem(storageKey!,JSON.stringify(checkedValue))
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
         }) as ({label:string,value:string})[]
    },[propColumns])
   const menu = useMemo(() => ({
        items: [{
            key: `setcolumn`,
            label: <Checkbox.Group className={styles.checkgroupBreak} options={columnOptions} value={columnNames} onChange={handleCheckedChange} />
        }]
    }), [columnOptions, columnNames]);
    useEffect(()=>{
       if(storageKey){
            (async ()=>{
            const ret=await localStorage.getItem(storageKey)
            if(ret){
                try{
                    setColumnNames(JSON.parse(ret))
                }catch{}
            }else if(propColumns.length){
                   handleCheckedChange(propColumns.filter(d=>typeof d.dataIndex==='string').map(d=>d.dataIndex as string)) 
            }
        })();
       }
    },[storageKey])
    const children=<Dropdown open={open} placement='bottom' menu={menu} onOpenChange={(open)=>{
        if(open){
           /// handleCheckedChange(propColumns.filter(d=>typeof d.dataIndex==='string').map(d=>d.dataIndex as string))   
        }
        setOpen(open)
    }} trigger={['click']}>
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