import React,{useCallback,useMemo} from 'react'
import type { ProColumnType } from '@ant-design/pro-table'
import ProTable from '@ant-design/pro-table'
import ProForm from '@ant-design/pro-form'
import request from '@/utils/request'
import * as userService from '@/services/user'

type DataType = {
    id:number,
    userName:string
  };
const UserList=()=>{
    const getList=useCallback((params={},sort,filter={})=>{
        return userService.getUserList({
            ...params,
            ...filter
        }).then((res:any)=>{
            return {
                data:res.list,
                total:res.total,
                success:true,
            }
        })
    },[])
    const searchConfig=useMemo<any>(() => ({filterType:"query"}), [])
    const columns: ProColumnType<DataType>[] = [
        {
          title: 'id',
          dataIndex: 'id',
          search:false
        },
        {
          title: 'name',
          dataIndex: 'userName',
          initialValue:"admin"
        }
    ];
    return <ProTable search={searchConfig} params={{name:'admin'}}  toolbar={{
        title: '用户列表',
        tooltip: '这是一个标题提示',
      }} rowKey="id" columns={columns} request={getList}></ProTable>
}
export default UserList