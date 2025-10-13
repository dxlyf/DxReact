import { ConfigProvider, Form, Collapse, Tabs, Row, Space, Col, Input, Select, Upload, Checkbox, DatePicker, Table, Descriptions, Grid, Button, InputNumber, Popover, Alert, message, Switch, Modal, Typography, Radio } from 'antd'
import type { FormItemProps, TabsProps, CollapseProps, GetProp, GetProps, GetRef, FormListOperation } from 'antd'
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import dayjs, { Dayjs } from 'dayjs'
import styles from './index.module.scss'
import { InfoCircleOutlined, MinusOutlined, PlusOutlined, CopyOutlined, DeleteOutlined } from '@ant-design/icons'
import { useMemoizedFn, useLatest, useUpdateEffect, useClickAway } from 'ahooks'
import classNames from 'classnames'
import { ProUpload } from '../components/ProUpload'
import Decimal from 'decimal.js'
import { chain, pick } from 'lodash-es'
import AntTableEditDemo from './AntTableEditDemo'
import { useModal } from '../hooks/useModal2'
import { EditableProTable, ProTable,useMountMergeState} from '@ant-design/pro-components'
import type { ActionType, ProColumns } from '@ant-design/pro-components'
import {useTable} from '../hooks/useTable'
import mockjs from 'mockjs'

const data=mockjs.mock({'list|100':[{'id|+1':0,'name':'@name','age|10-100':0}]}).list
async function query(params:any) {
        const {current,pageSize}=params
        return {
            data:data.slice(current*pageSize-pageSize,current*pageSize),
            total:data.length,
        }
}
function formatAmount(amount) {
  // 将数字转换为字符串
  const str = amount.toString();
  
  // 使用正则表达式进行格式化
  return str.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

const Summary=Table.Summary
const EditPage = () => {
    const [form] = Form.useForm()
    const [tableProps,{data}]=useTable({
        request:async (params,sorter,filtes)=>{
            console.log('param',params,sorter,filtes)
            const data=await query(params)
            return data
        },
        columns:[
            {
                title:'姓名',
                dataIndex:'name',
                sorter:{        
                    multiple:1
                },    
                sortOrder:'ascend',
            },
               {
                title:'年龄',
                dataIndex:'age',
                sorter:{
                    multiple:2
                }
            }
        ]
    })
  
    const showPrice=(v:any,f=2)=>{
        let d=new Decimal(v)
      //  Decimal.
        return Decimal.isDecimal(d)?d.toFixed(f):''
    }
    dayjs
    return <>
   {showPrice('43.65445645',0)}
   {dayjs('2025-09-30T16:00:00.000Z').format('YYYY-MM-DD')}
    <Table {...tableProps} ></Table>
    </>
}

export default EditPage