import { Button, Col, Form, Modal, Row, Space, Table,type TableProps,Input, Checkbox, Radio } from "antd"
import { useCallback, useEffect, useMemo, useState } from "react"
import {useAntdTable} from 'ahooks'
import {useModal,type ModalInstance} from '../hooks/useModal2'
import useRequest from "src/hooks/useRequest"
import request from "src/utils/request"
import TableBtnAction from "../components/TableBtnAction"

function delay(wait:number){
    return new Promise(resolve=>setTimeout(()=>resolve(''),wait))
}
function RoleForm({modal}){
    const [form]=Form.useForm()
    const [selectionRows,setSelectionRows]=useState(()=>new Set())

    const [data,setData]=useState(()=>[
        {
            id:1,
            name:'列表1',
            type:'page',
            children:[{
                id:11,
                name:'新增',
                type:'btn',
                enable:false
            },{
                id:12,
                name:'编辑',
                type:'btn',
                enable:true
            }]
        }
    ])
    const flatData=useMemo(()=>{
        return data.flatMap(d=>d.children??[])
    },[data])
    const flatBtnData=useMemo(()=>{
        return flatData.filter(d=>d.type==='btn')
    },[flatData])
    const allChecked=useMemo(()=>{
        return selectionRows.size>0&&flatBtnData.every(item=>selectionRows.has(item.id))
    },[flatBtnData,selectionRows])
    const allUnChecked=useMemo(()=>{
        return !flatBtnData.some(item=>selectionRows.has(item.id))
    },[flatBtnData,selectionRows])
    const columns=useMemo(()=>{
        return [{
            title:"名稱",
            dataIndex:'name',
            align:'center'
        },{
            title:<>
                <Radio name="allauth" checked={allChecked} onChange={(e)=>{
                    setSelectionRows(new Set(flatBtnData.map(item=>item.id)))
                }}>
                    全選啓用
                </Radio>
            </>,
            width:150,
            render(_,record){
                if(record.type!=='btn'){
                    return <></>
                }
                const checked=selectionRows.has(record.id)
                console.log('checked',checked)
                return <Radio checked={checked} value={record.id} onChange={(e)=>{
                    if(e.target.checked){
                        selectionRows.add(e.target.value)                   
                       setSelectionRows(new Set(selectionRows.values()))
                    }
        
                }}>啓用</Radio>
            }
        },{
            title:<>
                <Radio  name="allauth" checked={allUnChecked} onChange={()=>{
                    setSelectionRows(new Set([]))
                }}>
                    全選禁用
                </Radio>
            </>,
            width:150,
            render(_,record){
               if(record.type!=='btn'){
                    return <></>
                }
              const checked=selectionRows.has(record.id)
              return <Radio checked={!checked} value={record.id} onChange={(e)=>{
                    if(e.target.checked){
                        selectionRows.delete(e.target.value)
                       setSelectionRows(new Set(selectionRows.values()))
                    }
        
                }}>禁用</Radio>
            }
        }]
    },[selectionRows,allChecked,allUnChecked])

    modal.onSubmit(()=>{
        if(selectionRows.size>0){
            console.log('selectionRows',selectionRows)
            const submitData=flatBtnData.filter(item=>selectionRows.has(item.id))
            modal.submit(submitData,false)

        }
    })
    return <div>
        <Table rowKey={'id'} dataSource={data} columns={columns}></Table>
    </div>
}
export default ()=>{
    const [form]=Form.useForm()
    const {data,pagationInfo,setPagationInfo,read}=useRequest({
        defaultData:[],
        pagation:{
            pageSize:10,
            current:1,
        },
        request:async (params)=>{  
             const res=await request.post<{records:any[],total:number}>('/list',params)
             const records=res.data.records
             const total=res.data.total
             return {data:records,total}
        }
    })
    const columns=useMemo<NonNullable<TableProps['columns']>>(()=>[
        {
            title:'名称',
            dataIndex:'name',
            align:'center',
            width:200
        } ,   {
            title:'age',
            dataIndex:'age'
        },{
            width:200,
            title:'操作',
            fixed:'right',
            render(_,record){
                return <TableBtnAction onItemClick={async (item)=>{
                    if(item.key=='del'){
                        await delay(2000)
                        return false
                    }else{
                        console.log(item.key)
                    }
                }}></TableBtnAction>
            }
        }
    ],[])
    

    const [modalDom,modal]=useModal({
        title:'角权权限管理',
        width:'70%',
        destroyOnHidden:false,
        getModalStageProps(store){
            return {
                title:store.data?.title
            }
        },
        onSubmit(values){
            console.log('values',values)
        },
        children:(istance)=><RoleForm></RoleForm>
    })
    return <>
    {modalDom}
    <Row>
        <Col>
          <Button onClick={()=>{
        modal.open()
    }}>权限</Button>
        </Col>
    </Row>
    <Table rowKey='id'  onChange={(pagationInfo)=>{
            setPagationInfo((v)=>({...v,pageSize:pagationInfo.pageSize,current:pagationInfo.current}))
            read({},true)
    }} pagination={{
        current:pagationInfo.current,
        pageSize:pagationInfo.pageSize,
        total:pagationInfo.total,
    
    }} dataSource={data} scroll={{x:'100%'}} columns={columns} ></Table> 
    </>
}