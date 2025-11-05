import {ProTable,BetaSchemaForm,ModalForm,ProFormText,ProFormGroup,ProFormSelect} from '@ant-design/pro-components'
import type {ProColumns} from 'src/types/ProComponents'
import { useCallback, useMemo } from 'react'
import {request} from 'src/utils/request'
import { Button,Modal, Space } from 'antd'


export default ()=>{

    const columns=useMemo<ProColumns[]>(()=>{
        return [
            {
              title:'序号',
              search:false,
              render(dom,record,index){
                return index+1
              }
            },
            {
                dataIndex:'name',
                title:'名称'
            },
            {
                dataIndex:'createTime',
                sorter:true,
                sortOrder:'descend',
                title:'创建时间'
            },
            {
                title:'操作',
                width:140,
                align:'center',
                render(dom,record){
                    return <Space>
                        <Button type='link' onClick={()=>{

                        }}>编辑</Button>
                        <Button type='link' danger >删除</Button>
                    </Space>
                }
            }
        ]
    },[])
    const requestList=useCallback(async (param:any,sort:any,filter:any)=>{
        const ret=await request<{total:number,records:any[]}>({
            url:'list',
            method:'post',
            data:{
                current:param.current,
                pageSize:param.pageSize
            }
        })
        return {
            total:ret.data.total,
            data:ret.data.records,
            success:true
        }
    },[])

    const handleFinish=useCallback((values)=>{

    },[])

    return <><ProTable options={false}  toolbar={{
        actions:[<ModalForm layout='inline' title='新增' trigger={<Button type='primary'>新增</Button>} onFinish={handleFinish}>
            <ProFormGroup>
                <ProFormText label='名称' name={'name'} required width={200}></ProFormText>
            </ProFormGroup>
        </ModalForm>],
        menu:{
            type:'inline',
            activeKey:'a',
            items:[{key:'a',label:'未审核'},{key:'b',label:'已审核'}]   
        }
    }} rowKey={'id'} columns={columns} request={requestList}></ProTable>
    <Modal ></Modal>
    </>
}